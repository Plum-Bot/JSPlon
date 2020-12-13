const Interpreter = require("./Interpreter");
const Callable = require("./Callable");
const Instance = require("./Instance");
const Func = require("./Function");
const RuntimeError = require("./errors/RuntimeError");
const Enum = require("./Enum");

/**
 * A runtime representation of a Class object in Plon.
 * @template T extends Instance
 */
module.exports = class Class extends Callable {
    /**
     * The string that names this class.
     * @type {string}
     */
    name;

    /**
     * The methods this class has.
     * @type {Map<string, Func>}
     */
    methods = new Map();

    /**
     * The Lox class used to instantiate new instances of this Plon Class.
     * @type {T}
     */
    instanceClass = Instance;

    /**
     * Returns a runtime representation of a class.
     * @param {string} name The string that names this class.
     * @param {Map<string, Func>} methods The methods this class has.
     */
    constructor(name, methods) {
        super(null, null);
        this.name = name;
        this.methods = methods;
    }

    /**
     * @returns {string} The string that's shown to the user when they print a class.
     */
    toString() {
        return `<class ${this.name}>`;
    }

    /**
     * Called when a new instance is created with `<class>();`
     * @param {Interpreter} interpreter The instance of Interpreter.
     * @param {any[]} args The arguments passed to the class constructor.
     * 
     * @returns {T}
     */
    call(interpreter, args) {
        let instance = new this.instanceClass(this, interpreter);

        let initializer = this.findMethod("new");
        if (initializer) {
            initializer.bind(instance).call(interpreter, args);
        }

        return instance;
    }

    /**
     * Returns the number of arguments defined in the class' constructor.
     * @returns {number}
     */
    getArity() {
        let initializer = this.findMethod("new");
        if (initializer) return initializer.getArity();
        return 0;
    }

    /**
     * 
     * @param {string} name The name to look up the method with
     */
    findMethod(name) {
        if (this.methods.has(name) && !this.methods.get(name).isStatic) {
          return this.methods.get(name);
        }
    
        return null;
    }

    get(name) {
        if (this.methods.has(name.lexeme) && this.methods.get(name.lexeme).isStatic) {
            return this.methods.get(name.lexeme);
        }
        console.log(this.methods, name.lexeme, this.methods.get(name.lexeme));

        throw new RuntimeError(name,
            `Undefined static method '${this.name}.${name.lexeme}'.`);
    }

    set(name) {
        
    }
}