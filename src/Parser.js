const Plon = require("../plon");

const Expr = require("./Expr");
const ParseError = require("./errors/ParseError");
const Stmt = require("./Stmt");
const Token = require("./Token");
const TokenType = require("./TokenType");
const Escape = require("./throw/Escape");
const Instance = require("./Instance");

/**
 * @typedef {string} TokenType A so-called Enum containing all the possible type of tokens.
 */

module.exports = class Parser {
    /**
     * @type {Token[]}
     */
    tokens;
    current = 0;

    Plon;

    /**
     * Creates a parser.
     * @param {Token[]} tokens 
     */
    constructor(tokens, Plon) {
        this.tokens = tokens;
        this.Plon = Plon;
    }

    parse() {
        let statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }

        return statements;
    }

    //* EXPRESSIONS

    expression() {
        return this.assignment();
    }

    assignment() {
        let /* Expr */ expr = this.ternary();

        if (this.match(TokenType.EQUAL)) {
            let /* Token */ equals = this.previous();
            let /* Expr */ value = this.ternary();

            if (expr instanceof Expr.Variable) {
                let /* Token */ name = expr.name;
                return new Expr.Assign(name, value);
            } else if (expr instanceof Expr.Get) {
                let get = /* Expr.Get */ expr;
                return new Expr.Set(get.object, get.name, value);
        
            }

            this.error(equals, "Invalid assignment target.");
        }

        return expr;
    }

    ternary() {
        let leftExpr = this.or();

        if (this.match(TokenType.QUESTION)) {
            let leftOp = this.previous();
            let centerExpr = this.or();
            if (this.match(TokenType.COLON)) {
                let rightOp = this.previous();
                let rightExpr = this.or();
                return new Expr.Ternary(leftExpr, leftOp, centerExpr, rightOp, rightExpr);
            } else {
                return this.error(this.previous(), "Expected ':' after '?' and expression.");
            }
        } else {
            return leftExpr;
        }

        // return leftxpr;
    }

    or() {
        let /* Expr */ expr = this.and();

        while (this.match(TokenType.OR)) {
            let /* Token */ operator = this.previous();
            let /* Expr */ right = this.and();
            expr = new Expr.Logical(expr, operator, right);
        }

        return expr;
    }

    and() {
        let /* Expr */ expr = this.xor();

        while (this.match(TokenType.AND)) {
            let /* Token */ operator = this.previous();
            let /* Expr */ right = this.xor();
            expr = new Expr.Logical(expr, operator, right);
        }

        return expr;
    }

    xor() {
        let /* Expr */ expr = this.lambda();

        while (this.match(TokenType.XOR)) {
            let /* Token */ operator = this.previous();
            let /* Expr */ right = this.lambda();
            expr = new Expr.Logical(expr, operator, right);
        }

        return expr;
    }

    lambda() {
        if (this.match(TokenType.LAMBDA)) {
            let params = [];
            if (this.match(TokenType.LEFT_PAREN)) {
                if (!this.check(TokenType.RIGHT_PAREN)) {
                    do {
                        if (params.length >= 255) {
                            this.error(this.peek(), "A lambda function can't have more than 255 arguments.");
                        }
                        params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name."));
                    } while (this.match(TokenType.COMMA));
                    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after lambda argument list.");
                } else {
                    // No argument lambda
                    this.advance(); // )
                }
            } else {
                params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name."));
            }

            this.consume(TokenType.ARROW, "Expected '->' after lambda argument list.");

            let body;
            if (this.match(TokenType.LEFT_BRACE)) {
                body = this.block();
            } else {
                body = [this.returnStatement(false)];
            }

            return new Stmt.Function(null, params, body, false);
        }

        return this.equality();
    }

    equality() {
        let expr = this.comparison();

        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            let operator = this.previous();
            let right = this.comparison();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    comparison() {
        let expr = this.bitwiseBool();

        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            let operator = this.previous();
            let right = this.bitwiseBool();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    bitwiseBool() {
        let expr = this.bitwiseShift();

        //                           &                |                 ^
        if (this.match(TokenType.BW_AND, TokenType.BW_OR, TokenType.BW_XOR)) {
            let operator = this.previous();
            let right = this.bitwiseShift();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    bitwiseShift() {
        let expr = this.addition();

        //                               <<                   >>
        while (this.match(TokenType.BW_LSHIFT, TokenType.BW_RSHIFT)) {
            let operator = this.previous();
            let right = this.addition();
            // console.log("shift", expr, operator, right);
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    addition() {
        let expr = this.multiplication();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            let operator = this.previous();
            let right = this.multiplication();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    multiplication() {
        let expr = this.power();

        while (this.match(TokenType.SLASH, TokenType.STAR, TokenType.PERCENT)) {
            let operator = this.previous();
            let right = this.power();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    power() {
        let expr = this.postfix();

        if (this.match(TokenType.STAR_STAR)) {
            let operator = this.previous();
            let right = this.postfix();
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    postfix() {
        let expr = this.unary();

        if (this.match(TokenType.MINUS_MINUS, TokenType.PLUS_PLUS)) {
            let left = expr;
            let operator = this.previous();
            return new Expr.Postfix(left, operator);
        } else {
            return expr;
        }
    }

    unary() {
        if (this.match(TokenType.MINUS, TokenType.BANG)) {
            let operator = this.previous();
            let right = this.primary();
            return new Expr.Unary(operator, right);
        }

        return this.call();
    }

    call() {
        let expr = this.primary();

        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.DOT)) {
                // console.log(this.tokens[this.current + 1])
                let name = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'.");
                expr = new Expr.Get(expr, name);
            } else if (this.match(TokenType.LEFT_BRACK)) {
                if (this.match(TokenType.RIGHT_BRACK)) {
                    this.error(this.previous(), "Unexpected ']' in subscript expression.");
                } else {
                    let bracket = this.previous();
                    let name = this.expression();
                    this.consume(TokenType.RIGHT_BRACK, "Exected ']' after subscript.");
                    expr = new Expr.SubscriptGet(expr, name, bracket);
                }
            } else {
                break;
            }
        }

        return expr;
    }

    finishCall( /* Expr */ callee) {
        let /* List<Expr> */ args = new Array();
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "A function call can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }

        // console.log(args)

        let /* Token */ paren = this.consume(TokenType.RIGHT_PAREN, "Expected ')' after argument list.");

        return new Expr.Call(callee, paren, args);
    }

    primary() {
        if (this.match(TokenType.FALSE)) return new Expr.Literal(false);
        if (this.match(TokenType.TRUE)) return new Expr.Literal(true);
        if (this.match(TokenType.NULL)) return new Expr.Literal(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new Expr.Literal(this.previous().literal);
        }

        if (this.match(TokenType.LEFT_BRACK)) return this.array();

        if (this.match(TokenType.IDENTIFIER)) {
            return new Expr.Variable(this.previous());
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            let expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
            return new Expr.Grouping(expr);
        }

        if (this.match(TokenType.THIS))
            return new Expr.This(this.previous());

        throw this.error(this.peek(), "Expected expression.");
    }

    array() {
        let values = [];

        if (!this.match(TokenType.RIGHT_BRACK)) {
            do {
                values.push(this.expression());
            } while (this.match(TokenType.COMMA));

            this.consume(TokenType.RIGHT_BRACK, "Expected ']' after array values.");
        }

        return new Expr.Literal(values);
    }

    //* STATEMENTS

    declaration() {
        try {
            if (this.match(TokenType.FUNCTION)) return this.function("function");
            if (this.match(TokenType.VAR)) return this.varDeclaration();

            return this.statement();
        } catch ( /* ParseError */ error) {
            if (!(error instanceof ParseError)) throw error;
            this.synchronize();
            // console.log(error);
            return null;
        }
    }

    constDeclaration() {
        let /* Token */ name = this.consume(TokenType.IDENTIFIER, "Expected a constant name.");

        let /* Expr */ initializer = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expected ';' after constant declaration.");
        return new Stmt.Const(name, initializer);
    }

    function( /* String */ kind, isStatic = false) {
        let name = this.consume(TokenType.IDENTIFIER, `Expected ${kind} name.`);

        this.consume(TokenType.LEFT_PAREN, `Expected '(' after ${kind} name.`);

        let /* List<Token> */ params = new Array();

        // if (!isGetter) {
            if (!this.check(TokenType.RIGHT_PAREN)) {
                do {
                    if (params.length >= 255) {
                        this.error(this.peek(), "You can't have more than 255 parameters " +
                            "in a function call.");
                    }
        
                    params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name."));
                } while (this.match(TokenType.COMMA));
            }

            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameter list.");
        // } else {
        //     if (isStatic) {
        //         this.error(this.previous(), "You can't have a static setter.");
        //     }
            
        //     params = [];
        // }

        this.consume(TokenType.LEFT_BRACE, `Expected '{' before ${kind} body.`);
        let /* List<Stmt> */ body = this.block();

        return new Stmt.Function(name, params, body, isStatic);
    }

    varDeclaration() {
        let /* Token */ name = this.consume(TokenType.IDENTIFIER, "Expected a variable name.");

        let /* Expr */ initializer = null;
        if (this.match(TokenType.EQUAL)) {
            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration.");
        return new Stmt.Var(name, initializer);
    }

    statement() {
        if (this.match(TokenType.CLASS)) return this.classDeclaration();
        if (this.match(TokenType.IF)) return this.ifStatement();
        if (this.match(TokenType.FOR)) return this.forStatement();
        if (this.match(TokenType.REPEAT)) return this.repeatStatement();
        if (this.match(TokenType.RETURN)) return this.returnStatement();
        if (this.match(TokenType.LEFT_BRACE)) return new Stmt.Block(this.block());
        if (this.match(TokenType.WHILE)) return this.whileStatement();

        if (this.match(TokenType.BREAK)) {
            this.consume(TokenType.SEMICOLON, "Expected ';' after 'break'.");
            return new Escape(Escape.types.BREAK, this.previous());
        }
        if (this.match(TokenType.CONTINUE)) {
            this.consume(TokenType.SEMICOLON, "Expected ';' after 'continue'.");
            return new Escape(Escape.types.CONTINUE, this.previous());
        }

        return this.expressionStatement();
    }

    classDeclaration() {
        let name = this.consume(TokenType.IDENTIFIER, "Expected class name.");
        this.consume(TokenType.LEFT_BRACE, "Expected '{' before class body.");

        let methods = new Array();
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if(this.match(TokenType.STATIC)) {
                methods.push(this.function("method", true));
            } else {
                methods.push(this.function("method"));
            }
        }

        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after class body.");

        return new Stmt.Class(name, methods);
    }

    block() {
        var /* List<Stmt> */ statements = new Array();

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration());
        }

        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
        return statements;
    }

    expressionStatement() {
        let /* Expr */ expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after an expression.");
        return new Stmt.Expression(expr);
    }

    ifStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
        let /* Expr */ condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition.");

        let /* Stmt */ thenBranch = this.statement();

        // let /* List<Stmt> */ elseIfBranches = new Array();
        // while (this.peek().type == TokenType.ELSE && this.peekNext().type == TokenType.IF) {
        //     this.advance(); // else
        //     this.advance(); // if
        //     this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'else if'.");
        //     let /* Expr */ condition = this.expression();
        //     this.consume(TokenType.RIGHT_PAREN, "Expected ')' after else if condition.");
        //     elseIfBranches.push({
        //         condition,
        //         statement: this.statement()
        //     });
        // }

        let /* Stmt */ elseBranch = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return new Stmt.If(condition, thenBranch, /* elseIfBranches */[], elseBranch);
    }

    forStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'repeat'.");

        let /* Stmt */ initializer;
        if (this.match(TokenType.SEMICOLON)) {
            initializer = null;
        } else if (this.match(TokenType.VAR)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let /* Expr */ condition = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expeted ';' after loop condition.");

        let /* Expr */ increment = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expeted ')' after loop increment.");

        let /* Stmt */ body = this.statement();

        if (!!increment) {
            body = new Stmt.Block([
                body,
                new Stmt.Expression(increment)
            ]);
        }

        if (!!condition) {
            body = new Stmt.While(condition, body, true);
        }

        if (!!initializer) {
            body = new Stmt.Block([
                initializer,
                body
            ]);
        }

        return body;
    }

    printStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'print'.");
        let values = [];
        do {
            values.push(this.expression());
        } while (this.match(TokenType.COMMA));
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after print expression.");
        this.consume(TokenType.SEMICOLON, "Expected ';' after print closing parenthesis.");
        return new Stmt.Print(values[0]);
    }

    repeatStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'repeat'.");
        let num = this.expression();

        let step = new Expr.Literal(1);
        if (this.match(TokenType.COMMA)) {
            step = this.expression();
        }

        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after repeat expression.");

        let body = this.statement();
        return new Stmt.Repeat(num, step, body);
    }

    returnStatement(semic = true) {
        let keyword = this.previous();
        let value = null;
        if (!this.check(TokenType.SEMICOLON)) {
          value = this.expression();
        }
    
        if (semic) this.consume(TokenType.SEMICOLON, "Expected ';' after return value.");
        return new Stmt.Return(keyword, value);
    }

    whileStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
        let expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after while expression.");

        let body = this.statement();

        return new Stmt.While(expr, body, false);
    }

    //* UTILITY METHODS

    /**
     * If the next token is one of `types`, returns true and advances.
     * @param  {...TokenType} types 
     * @returns {boolean} Whether the next token is one of `types`.
     */
    match(...types) {
        for (let type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type == type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    isAtEnd() {
        return this.peek().type == TokenType.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    peekNext() {
        return this.tokens[this.current + 1];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    /**
     * 
     * @param {TokenType} type 
     * @param {string} message
     * @throws {string}
     */
    consume(type, message) {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    /**
     * Throws an error
     * @param {Token} token 
     * @param {string} message
     * @returns {ParseError} 
     */
    error(token, message) {
        this.Plon.error(token, message);
        return new ParseError(message);
    }

    synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUNCTION:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }
}