const Callable = require("./Callable");
const Environment = require("./Environment");
const Return = require("./throw/Return");
const Interpreter = require("./Interpreter");

module.exports = class Func extends Callable {
    declaration;
    closure;
    isStatic;
    isInitializer;
    isGetter;
    
    /**
     * 
     * @param {*} declaration 
     * @param {*} closure 
     * @param {boolean} isStatic 
     */
    constructor(declaration, closure, isStatic = false, isInitializer = false, isGetter = false) {
        super(null, declaration.params.length);
        this.declaration = declaration;
        this.closure = closure;
        this.isStatic = isStatic;
        this.isInitializer = isInitializer;
        this.isGetter = isGetter;
    }

    /**
     * Calls the function and returns any eventual value.
     * @param {Interpreter} interpreter The current interpreter.
     * @param {any[]} args The argunents of the function.
     * @returns {any?} The return value of the function.
     */
    call(interpreter, args) {
        let environment = new Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (error) {
            if (!(error instanceof Return)) {
                throw error;
            }
            return error.value;
        }
    }

    toString() {
        if (this.declaration.name)
            return `<function ${this.declaration.name}>`;

        // lambda
        return "<lambda function>";
    }

    getArity() {
        return super.getArity();
    }

    bind(instance) {
        let environment = new Environment(this.closure);
        environment.define("this", instance);
        return new Func(this.declaration, environment, this.isStatic, this.isInitializer);
    }
}