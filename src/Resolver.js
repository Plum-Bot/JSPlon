const Plon = require("../plon");
const Stack = require("./Stack");
const Enum = require("./Enum");

const ClassType = Enum([
    'NONE', 'CLASS'
]);

var currentClass = ClassType.NONE;

module.exports = class Resolver {
    interpreter;

    /**
     * @type {{string: boolean}[]}
     */
    scopes = new Stack();

    constructor(interpreter, Plon) {
        this.interpreter = interpreter;
        this.Plon = Plon;
    }

    resolve(statements) {
        // console.log(statements);
        for (let statement of statements) {
            this.resolve_(statement);
        }
    }

    resolve_(stmt) {
        stmt.accept(this);
    }

    visitAssignExpr(expr) {
        this.resolve_(expr.value);
        this.resolveLocal(expr, expr.name);

        return null;
    }

    visitBinaryExpr(expr) {
        this.resolve_(expr.left);
        this.resolve_(expr.right);
        return null;
    }

    visitCallExpr(expr) {
        this.resolve_(expr.callee);
    
        for (let argument of expr.args) {
            this.resolve_(argument);
        }
    
        return null;
    }

    visitGetExpr(expr) {
        this.resolve_(expr.object);
        return null;
    }

    visitGroupingExpr(expr) {
        this.resolve_(expr.expression);
        return null;
    }

    visitLiteralExpr(expr) {
        return null;
    }

    visitLogicalExpr(expr) {
        this.resolve_(expr.left);
        this.resolve_(expr.right);
        return null;
    }

    visitPostfixExpr(expr) {
        this.resolve_(expr.left);
        return null;
    }

    visitSetExpr(expr) {
        this.resolve_(expr.value);
        this.resolve_(expr.object);
        return null;
    }

    visitSubscriptGetExpr(expr) {
        this.resolve_(expr.object);
        this.resolve_(expr.name);
        return null;
    }

    visitTernaryExpr(expr) {
        this.resolve_(expr.left);
        this.resolve_(expr.center);
        this.resolve_(expr.right);
        return null;
    }
    
    visitThisExpr(expr) {
        if (currentClass == ClassType.NONE) {
            this.Plon.error(expr.keyword,
                "You can't use 'this' outside of a class.");
            return null;
        }

        this.resolveLocal(expr, expr.keyword);
        return null;
    }

    visitUnaryExpr(expr) {
        this.resolve_(expr.right);
        return null;
    }

    visitVariableExpr(expr) {
        if (!!this.scopes.length && this.scopes.peek()[expr.name.lexeme] == false) {
            this.Plon.error(expr.name,
                "Cannot read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
        return null;
    }

    visitBlockStmt(stmt) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
        return null;
    }

    visitClassStmt(stmt) {
        let enclosingClass = currentClass;
        currentClass = ClassType.CLASS;

        this.declare(stmt.name);
        this.define(stmt.name);

        this.beginScope();
        this.scopes.peekSet("this", true);

        for (let method of stmt.methods) {
            this.resolveFunction(method); 
        }

        this.endScope();

        currentClass = enclosingClass;
        return null;
    }

    visitExpressionStmt(stmt) {
        this.resolve_(stmt.expression);
    }

    visitFunctionStmt(stmt) {
        this.declare(stmt.name);
        this.define(stmt.name);
    
        this.resolveFunction(stmt);
        return null;
    }

    resolveFunction(func) {
        this.beginScope();
        for (let param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolve(func.body);
        this.endScope();
    }

    visitIfStmt(stmt) {
        this.resolve_(stmt.condition);
        this.resolve_(stmt.thenBranch);
        stmt.elseIfBranches.forEach((elseif) => {
            this.resolve_(elseif.condition);
            this.resolve_(elseif.statement);
        });
        if (stmt.elseBranch != null) this.resolve_(stmt.elseBranch);
        return null;
    }

    visitRepeatStmt(stmt) {
        this.resolve_(stmt.number);
        this.resolve_(stmt.step);
        this.resolve_(stmt.body);
        return null;
    }

    visitReturnStmt(stmt) {
        if (stmt.value != null) {
            this.resolve_(stmt.value);
        }
    
        return null;
    }

    visitVarStmt(stmt) {
        this.declare(stmt.name);
        if (stmt.initializer != null) {
            this.resolve_(stmt.initializer);
        }
        this.define(stmt.name);
        return null;
    }

    visitWhileStmt(stmt) {
        this.resolve_(stmt.condition);
        this.resolve_(stmt.body);
        return null;
    }

    declare(name) {
        if (!this.scopes.length)
            return;

        if (this.scopes.peek()[name.lexeme] != undefined) {
            Plon.error(name, "You can't declare an already declared variable.");
        }

        this.scopes.peekSet(name.lexeme, false);
    }

    define(name) {
        if (!this.scopes.length) return;
        this.scopes.peekSet(name.lexeme, true);
    }

    resolveLocal(expr, name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (!!this.scopes.get(i)[name.lexeme]) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }

        // Not found. Assume it is global.
    }

    beginScope() {
        this.scopes.push({});
    }

    endScope() {
        this.scopes.pop();
    }
}