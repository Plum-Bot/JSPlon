const Class = require("./Class");
const RuntimeError = require("./errors/RuntimeError");
const Environment = require("./Environment");
const TokenType = require("./TokenType");
const Escape = require("./throw/Escape");
const Callable = require("./Callable");
const lib = require("./lib");
const Func = require("./Function");
const Return = require("./throw/Return");
const Instance = require("./Instance");
const Expr = require("./Expr");
const Token = require("./Token");
const { instance: StringInstance } = require("./lib/String");

module.exports = class Interpreter {
    Plon;

    globals;
    environment;

    locals;

    /**
     * Creates an instance of a Plon Interpreter.
     * @param {typeof import("../plon.js")} Plon
     */
    constructor(Plon) {
        this.Plon = Plon;

        this.globals = new Environment();
        this.environment = this.globals;

        /**
         * @type {{Expr.Expr: integer}}
         */
        this.locals = {};

        //! MARK: Plon's library.
        lib.defineLibraryFunctions(this);
    }


    interpret( /* List<Stmt> */ statements) {
        try {
            for (let /* Stmt */ statement of statements) {
                this.execute(statement);
                if (Date.now() - this.Plon.start >= this.Plon.MAX_RUN_TIME) {
                    throw new RuntimeError(new Token(TokenType.EOF, "\0", "", 0, 0), "Script took to long to execute");
                }
            }
        } catch ( /* RuntimeError */ error) {
            this.Plon.runtimeError(error);
        }
    }

    execute( /* Stmt */ stmt) {
        // console.log("a", stmt, stmt.accept(this));
        if (stmt instanceof Escape) {
            throw stmt;
        }
        return stmt.accept(this);
    }

    resolve(expr, depth) {
        this.locals[expr] = depth;
    }

    evaluate( /* Expr */ expr) {
        return expr.accept(this);
    }

    visitAssignExpr( /* Expr.Assign */ expr) {
        let /* Object */ value = this.evaluate(expr.value);

        let distance = this.locals[expr];
        if (distance) {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.environment.assign(expr.name, value);
        }

        return value;
    }

    visitBinaryExpr( /* Expr.Binary */ expr) {
        let /* Object */ left = this.evaluate(expr.left);
        let /* Object */ right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return +left - +right;
            case TokenType.PLUS: {
                if (typeof left == "number" && typeof right == "number") {
                    return +left + +right;
                }
                let strLeft = this.toString(left);
                let strRight = this.toString(right);
                return this.asString(strLeft + strRight);
            }
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                if (+right == 0)
                    throw new RuntimeError(expr, "Dividing by zero is not allowed.");
                return +left / +right;
            case TokenType.STAR:
                if (typeof left == "number" && typeof right == "number") {
                    return +left * +right;
                }
                this.checkNumberOperand(expr.operator, right);
                return this.asString(lib.stringify(this, left).repeat(+right));
            case TokenType.PERCENT:
                this.checkNumberOperands(expr.operator, left, right);
                return +left % +right;
            case TokenType.STAR_STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Math.pow(+left, +right);

            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return +left > +right;
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return +left >= +right;
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return +left < +right;
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return +left <= +right;

            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
        }

        // Unreachable.
        return null;
    }

    /**
     * @param {Expr.Call} expr 
     */
    visitCallExpr( /* Expr.Call */ expr) {
        let /* Object */ callee = this.evaluate(expr.callee);

        let /* List<Object> */ args = new Array();
        for (let /* Expr */ argument of expr.args) {
            args.push(this.evaluate(argument));
        }

        if (!(callee instanceof Callable)) {
            throw new RuntimeError(expr.paren, "You can only call functions and classes.");
        }

        // Skip arity checks if the function is native.
        if (!callee.isNative && args.length != callee.getArity()) {
            throw new RuntimeError(expr.paren,
                `Expected ${callee.getArity()} argument${callee.getArity() == 1 ? "" : "s"} but ` +
                `got ${args.length == 0 ? "none" : args.length}.`);
        }

        /// One less variable is less wasted memory.
        let res = callee.call(this, args);
        
        if (typeof(res) == "string")
            return this.asString(res);
        else return res;
    }

    visitGetExpr(expr) {
        let object = this.evaluate(expr.object);
        if (object instanceof Instance || object instanceof Class) {
            return object.get(expr.name);
        }

        throw new RuntimeError(expr.name,
            "Only instances have properties, and classes static methods.");
    }

    visitGroupingExpr( /* Expr.Grouping */ expr) {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr( /* Expr.Literal */ expr) {
        if (Array.isArray(expr.value)) {
            /** @type {import("./Class")<import("./lib/Array").instance>} */
            let ArrayClass = this.globals.values.get("Array");
            let values = expr.value.map(v => this.evaluate(v));
            let arr = ArrayClass.call(this, []);
            values.forEach(value => {
                arr.push(value);
            });
            return arr;
        } else if (typeof(expr.value) == "string") {
            return this.asString(expr.value);
        }
        return expr.value;
    }

    visitPostfixExpr( /* Expr.Postfix */ expr) {
        let /* Object */ left = this.evaluate(expr.left);

        this.checkNumberOperand(expr.operator, left);

        switch (expr.operator.type) {
            case TokenType.MINUS_MINUS:
                if (expr.left instanceof Expr.Variable) {
                    this.environment.assign(expr.left.name, this.environment.get(expr.left.name) - 1);
                    return +this.environment.get(expr.left.name) + 1;
                }
                return left - 1;
            case TokenType.PLUS_PLUS:
                if (expr.left instanceof Expr.Variable) {
                    this.environment.assign(expr.left.name, this.environment.get(expr.left.name) + 1);
                    return +this.environment.get(expr.left.name) - 1;
                }
                return left + 1;
        }

        // Unreachable.
        return null;
    }

    visitSetExpr(expr) {
        let object = this.evaluate(expr.object);
    
        if (!(object instanceof Instance || object instanceof Class)) { 
            throw new RuntimeError(expr.name, "Only instances have fields, and classes static methods.");
        }
    
        let value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }

    visitSubscriptGetExpr(expr) {
        let object = this.evaluate(expr.object);
        let val = this.evaluate(expr.name);
        if (object instanceof Instance || object instanceof Class) {
            return object.get(val);
        }

        // console.log(object);
        if (Array.isArray(object)) {
            if (val < 0)
                val += object.length;
            return object[val];
        }

        if (typeof object == "string") {
            return this.asString(object[val]);
        }
        if (this.isString(object)) {
            return object[val];
        }

        throw new RuntimeError(expr.bracket,
            "You can only use a subscript expression on arrays, strings, classes and instances");
    }

    visitTernaryExpr( /* Expr.Ternary */ expr) {
        if (expr.leftOperator.type == TokenType.QUESTION &&
            expr.rightOperator.type == TokenType.COLON) { // Ternary op ?:
            return this.isTruthy(this.evaluate(expr.left)) ? this.evaluate(expr.center) : this.evaluate(expr.right);
        }

        // Unreachable.
        return null;
    }

    visitThisExpr(expr) {
        return this.lookUpVariable(expr.keyword, expr);
    }

    visitUnaryExpr(expr) {
        let /* Object */ right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return -right;
            case TokenType.BANG:
                return !this.isTruthy(right);
        }

        // Unreachable.
        return null;
    }

    visitVariableExpr( /* Expr.Variable */ expr) {
        return this.environment.get(expr.name);
    }

    lookUpVariable(name, expr) {
        let distance = this.locals[expr];
        
        if (distance) {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.environment.get(name);
        }
    }

    visitBlockStmt( /* Stmt.Block */ stmt) {
        this.executeBlock(stmt.statements, new Environment(this.environment));
        return null;
    }

    visitClassStmt(stmt) {
        this.environment.define(stmt.name.lexeme, null);

        /** @type {Map<string, Func>} */
        let methods = new Map();
        for (let method of stmt.methods) {
            let func = new Func(method, this.environment, method.isStatic, method.name.lexeme == "new");
            methods.set(method.name.lexeme, func);
        }

        let klass = new Class(stmt.name.lexeme, methods);

        this.environment.assign(stmt.name, klass);
        return null;
    }

    visitConstStmt( /* Stmt.Print */ stmt) {
        let /* Object */ value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name.lexeme, value, false);
        return value;
    }

    visitExpressionStmt( /* Stmt.Expression */ stmt) {
        this.evaluate(stmt.expression);
        return null;
    }

    visitFunctionStmt( /* Stmt.Function */ stmt) {
        let /* Func */ func = new Func(stmt, this.environment, stmt.isStatic, false);
        if (stmt.name) this.environment.define(stmt.name.lexeme, func);
        return func;
    }

    visitIfStmt( /* Stmt.If */ stmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch != null) {
            this.execute(stmt.elseBranch);
        }

//         let ifString = `
// `;

//         stmt.elseIfBranches.forEach((v, i) => {
//             ifString += `
// else if (this.isTruthy(this.evaluate(stmt.elseIfBranches[${i}].condition))) {
//     this.execute(stmt.elseIfBranches[${i}].statement);
// }`;
//         });

//         ifString += `
// `;

//         eval(ifString);

        return null;
    }

    visitLogicalExpr( /* Expr.Logical */ expr) {
        let /* Object */ left = this.evaluate(expr.left);

        if (expr.operator.type == TokenType.XOR) {
            return this.isTruthy(left) != this.isTruthy(this.evaluate(expr.right));
        } else if (expr.operator.type == TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    visitRepeatStmt( /* Stmt.Repeat */ stmt) {
        let /* Object */ num = this.evaluate(stmt.number);
        this.checkNumberOperand(null, num);

        let step = this.evaluate(stmt.step);

        let i = +num;
        while (i > 0) {
            i -= step;
            try {
                this.execute(stmt.body);
            } catch (error) {
                if (error instanceof Escape) {
                    if (error.type == Escape.types.BREAK) {
                        break;
                    } else {
                        continue;
                    }
                } else this.Plon.runtimeError(error);
            }
        }
    }

    visitReturnStmt(stmt) {
        let value;
        if (!!stmt.value) value = this.evaluate(stmt.value);

        throw new Return(stmt.keyword, value);
    }

    visitVarStmt( /* Stmt.Print */ stmt) {
        let /* Object */ value = null;
        if (stmt.initializer != null) {
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name.lexeme, value);
        return value;
    }

    visitWhileStmt( /* Stmt.While */ stmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            try {
                this.execute(stmt.body);
            } catch (error) {
                if (error instanceof Escape) {
                    if (stmt.isFor) {
                        this.execute(stmt.body.statements[stmt.body.statements.length - 1]);
                    }
                    if (error.type == Escape.types.BREAK) {
                        break;
                    } else {
                        continue;
                    }
                } else this.Plon.runtimeError(error);
            }
        }

        return null;
    }

    executeBlock( /* List<Stmt> */ statements, /* Environment */ environment) {
        let /* Environment */ previous = this.environment;
        try {
            this.environment = environment;

            for (let /* Stmt */ statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    isTruthy( /* Object */ object) {
        if (object == null) return false;
        if (typeof(object) == "boolean") return !!object;
        if (typeof(object) == "number" && +object == 0) return false;
        if (object.isTruthy)
            return object.isTruthy();
        if (!(object.toJSString?.() ?? this.toString(object))) return false;
        return true;
    }

    isEqual( /* Object */ a, /* Object */ b) {
        if (a == null && b == null) return true;
        if (a == null) return false;
        if (typeof(a) != typeof(b))
            return false;
        if (typeof(a) == "number" || typeof(a) == "boolean")
            return a == b;

        return a.eq?.(b) ?? a == b;
    }

    checkNumberOperand( /* Token */ operator, /* Object */ operand) {
        if (typeof operand == "number") return;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    checkNumberOperands( /* Token */ operator, /* Object */ left, /* Object */ right) {
        if (typeof left == "number" && typeof right == "number") return;

        throw new RuntimeError(operator, "Operands must be numbers.");
    }

    isString(value) {
        if (!(value instanceof StringInstance))
            return false;
    }

    asString(value) {
        if (value.toJSString)
            return value;

        return this.globals.values.get("String").call(this, [value]);
    }

    toString(value) {
        if (value?.toJSString)
            return value.toJSString();
        else if (value?.fields?.has("raw value")) {
            return value.fields?.get("raw value");
        } else if (typeof(value) == "string")
            return value;
        else if (typeof(value) == "number")
            return "" + value;
        return value?.toString?.() ?? "" + value;
    }
}