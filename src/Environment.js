const RuntimeError = require("./errors/RuntimeError");

module.exports = class Environment {

    /**
     * @type {Map<string, any>}
     */
    values = new Map();

    /**
     * @type {Environment}
     */
    enclosing;

    /**
     * Creates a new Environment in which variables reside.
     * @param {Environment} enclosing The `Environment` within which this one is wrapped.
     */
    constructor(enclosing= null) {
        this.enclosing = enclosing;
    }

    define(name, value, mutable = true) {
        this.values.set(name, value);
    }

    get(name) {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        if (this.enclosing) return this.enclosing.get(name);
    
        throw new RuntimeError(name,
            "Undefined variable '" + name.lexeme + "'.");
    }

    getAt(distance, name) {
        return this.ancestor(distance).values.get(name);
    }

    ancestor(distance) {
        let environment = this;
        for (let i = 0; i < distance; i++) {
          environment = environment.enclosing; 
        }
    
        return environment;
    }

    assign(name, value) {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return value;
        }

        if (!!this.enclosing) {
            this.enclosing.assign(name, value);
            return;
        }
    
        throw new RuntimeError(name,
            "Undefined variable '" + name.lexeme + "'.");
    }

    assignAt(distance, name, value) {
        this.ancestor(distance).values.set(name.lexeme, value);
    }
}