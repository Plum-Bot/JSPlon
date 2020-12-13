const Callable = require("../Callable");
const Func = require("../Function");
const Instance = require("../Instance");
const common = require("./common");

const KEY = "##values_";

function isPlon(val) { return !!val?.fields?.has(KEY); }
function toJS(val) { return val.fields?.get(KEY) ?? val; }

function flattenDeep(arr1) {
    return toJS(arr1).reduce((acc, val) => {
        return Array.isArray(toJS(val)) ? acc.concat(flattenDeep(val)) : acc.concat(toJS(val));
    }, []);
}

module.exports.class = {
    new: new Callable((interpreter, args = [], instance) => {
        instance.fields.set(KEY, [...args]);

        return instance;
    }, 0),
    join: new Callable((interpreter, args, instance) => {
        return instance.fields.get(KEY).map(common.stringify.bind(null, interpreter)).join(args[0]);
    }, 0),
    flatten: new Callable((interpreter, args, instance) => {
        var arr = instance.fields.get(KEY);
        arr = flattenDeep(arr);
        instance.fields.set(KEY, arr);
        return instance;
    }, 0),
    forEach: new Callable((interpreter, args, instance) => {
        if (!args[0] || !(args[0] instanceof Func))
            Plon.runtimeError("<Array>.forEach requires a Function (or a lambda) to be passed as an argument.");
        
        instance.fields.get(KEY).forEach((el, index) => args[0].call(interpreter, [el, index]));
    }, 0),
    push: new Callable((interpreter, args, instance) => {
        instance.fields.get(KEY).push(args[0]);
        return instance.fields.get(KEY).length;
    }, 1),
    toString: new Callable((interpreter, __, inst) => {
        return `[ ${inst.fields.get(KEY).map(common.stringify.bind(null, interpreter)).join(", ")} ]`;
    }),
    length: new Callable((_, __, inst) => {
        return inst.fields.get(KEY).length;
    }),
    map: new Callable((interpreter, args, instance) => {
        if (!args[0] || !(args[0] instanceof Func))
            Plon.runtimeError("<Array>.map requires a Function (or a lambda) to be passed as an argument.");
        
        return [...instance.fields.get(KEY)].map((el, index) => args[0].call(interpreter, [el, index]));
    }, 0),
    remove: new Callable((interpreter, args, instance) => {
        if (!common.exists(args[0]))
            interpreter.Plon.runtimeError("<Array>.remove requires an item to be passed as an argument.");
        
        return instance.fields.set(KEY, instance.fields.get(KEY).filter(v => !interpreter.isEqual(args[0], v)));
    }, 0),
}

module.exports.instance = class ArrayInstance extends Instance {
    push(value) {
        this.fields.get(KEY).push(value);
    }
    
    get(index) {
        if (index == KEY) {
            return null;
        }
        if (typeof(index) != "number") {
            return super.get(index);
        }
        index = +index;
        if (index < 0) index += this.fields.get(KEY).length;
        return this.interpreter.asString(this.fields.get(KEY)[index]);
    }

    toJSString() {
        return module.exports.class.toString.func(this.interpreter, [], this)
    }
}