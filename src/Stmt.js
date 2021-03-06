// DO NOT EDIT THIS FILE DIRECTLY! It is generated by generateAst.js 


class Stmt {
    accept(visitor) {}

    toString() {
        return "AST Node Superclass: Stmt"
    }
}

class Block extends Stmt {
    statements;

    constructor(statements) {
        super()
        this.statements = statements;
    }

    accept(visitor) {
        return visitor.visitBlockStmt(this);
    }

    toString() {
        return "AST Node: Stmt Block";
    }
}

class Class extends Stmt {
    name;
    methods;

    constructor(name, methods) {
        super()
        this.name = name;
        this.methods = methods;
    }

    accept(visitor) {
        return visitor.visitClassStmt(this);
    }

    toString() {
        return "AST Node: Stmt Class";
    }
}

class Const extends Stmt {
    name;
    initializer;

    constructor(name, initializer) {
        super()
        this.name = name;
        this.initializer = initializer;
    }

    accept(visitor) {
        return visitor.visitConstStmt(this);
    }

    toString() {
        return "AST Node: Stmt Const";
    }
}

class Expression extends Stmt {
    expression;

    constructor(expression) {
        super()
        this.expression = expression;
    }

    accept(visitor) {
        return visitor.visitExpressionStmt(this);
    }

    toString() {
        return "AST Node: Stmt Expression";
    }
}

class Function extends Stmt {
    name;
    params;
    body;
    isStatic;
    isGetter;

    constructor(name, params, body, isStatic, isGetter) {
        super()
        this.name = name;
        this.params = params;
        this.body = body;
        this.isStatic = isStatic;
        this.isGetter = isGetter;
    }

    accept(visitor) {
        return visitor.visitFunctionStmt(this);
    }

    toString() {
        return "AST Node: Stmt Function";
    }
}

class If extends Stmt {
    condition;
    thenBranch;
    elseIfBranches;
    elseBranch;

    constructor(condition, thenBranch, elseIfBranches, elseBranch) {
        super()
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseIfBranches = elseIfBranches;
        this.elseBranch = elseBranch;
    }

    accept(visitor) {
        return visitor.visitIfStmt(this);
    }

    toString() {
        return "AST Node: Stmt If";
    }
}

class Print extends Stmt {
    expression;

    constructor(expression) {
        super()
        this.expression = expression;
    }

    accept(visitor) {
        return visitor.visitPrintStmt(this);
    }

    toString() {
        return "AST Node: Stmt Print";
    }
}

class Repeat extends Stmt {
    number;
    step;
    body;

    constructor(number, step, body) {
        super()
        this.number = number;
        this.step = step;
        this.body = body;
    }

    accept(visitor) {
        return visitor.visitRepeatStmt(this);
    }

    toString() {
        return "AST Node: Stmt Repeat";
    }
}

class Return extends Stmt {
    keyword;
    value;

    constructor(keyword, value) {
        super()
        this.keyword = keyword;
        this.value = value;
    }

    accept(visitor) {
        return visitor.visitReturnStmt(this);
    }

    toString() {
        return "AST Node: Stmt Return";
    }
}

class Var extends Stmt {
    name;
    initializer;

    constructor(name, initializer) {
        super()
        this.name = name;
        this.initializer = initializer;
    }

    accept(visitor) {
        return visitor.visitVarStmt(this);
    }

    toString() {
        return "AST Node: Stmt Var";
    }
}

class While extends Stmt {
    condition;
    body;
    isFor;

    constructor(condition, body, isFor) {
        super()
        this.condition = condition;
        this.body = body;
        this.isFor = isFor;
    }

    accept(visitor) {
        return visitor.visitWhileStmt(this);
    }

    toString() {
        return "AST Node: Stmt While";
    }
}

module.exports = {
    Stmt,
    Block,
    Class,
    Const,
    Expression,
    Function,
    If,
    Print,
    Repeat,
    Return,
    Var,
    While
}
