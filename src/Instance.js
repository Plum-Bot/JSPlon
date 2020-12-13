const Class = require("./Class");
const RuntimeError = require("./errors/RuntimeError");
const Interpreter = require("./Interpreter");

/**
 * Represents an instance of a class.
 */
module.exports = class Instance {
    /**
     * @type {Class}
     */
    klass;

    /**
     * @type {Map<string, object>}
     */
    fields = new Map();

    /**
     * Returns an instance of Instance.
     * @param {Class<*>} klass The class this instance is of.
     * @param {Interpreter} interpreter The interpreter that instantiated this.
     */
    constructor(klass, interpreter) {
        this.klass = klass;
        this.interpreter = interpreter;
    }

    /**
     * Returns a field of this instance.
     * @param {Token} name The name of the field.
     */
    get(name) {
        if (this.fields.has(name.lexeme)) {
            return this.fields.get(name.lexeme);
        }

        let method = this.klass.findMethod(name.lexeme);
        if (method) return method.bind(this);

        throw new RuntimeError(name,
            "Undefined property '" + name.lexeme + "'.");
    }

    /**
     * Sets a field on this instance, or creates it if it doesn't exist.
     * @param {Token} name The name of the field that's being set.
     * @param {any} value The value that's being set into the field.
     */
    set(name, value) {
        this.fields.set(name.lexeme, value);
    }

    toString() {
        let defined = this.klass.findMethod("toString");
        if (defined && !defined.isStatic) {
            return defined.bind(this).call(this.interpreter, []);
        }
        return `<instance of ${this.klass.name}>`
    }
}