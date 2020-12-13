const Instance = require("./Instance");
const Interpreter = require("./Interpreter");

module.exports = class Callable {
    arity;
    func;

    /**
     * Creates an instance of Callable.
     * @param {(interpreter: Interpreter, args: any[], instance?: Instance) => any} func
     * @param {*} arity
     * @param {boolean} [isStatic=false]
     */
    constructor(func, arity, isStatic = false) {
        this.func = func;
        this.arity = arity;
        this.isStatic = isStatic;
    }

    /**
     * Used to skip arity checks
     */
    get isNative() {
        return !!this.func;
    }

    /**
     * How many arguments the function expects.
     */
    getArity() {
        return this.arity || 0;
    }

    /**
     * Calls the native function.
     * @param {Interpreter} interpreter The current instance of Interpreter.
     * @param {any[]} args The arguments the user passed to the function.
     */
    call(interpreter, args) {
        let retVal = this.func(interpreter, args, this.instance);
        if (typeof retVal == "string")
            return interpreter.toString(retVal);

        return retVal;
    }

    toString() {
        return "<native function>";
    }

    bind(instance) {
        this.instance = instance;
        return this;
    }
}