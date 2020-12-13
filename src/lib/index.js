const Callable = require("../Callable");
const { question } = require("readline-sync");
const Class = require("../Class");
const Instance = require("../Instance");
const common = require("./common");
const Plon = require("../../plon");
const Embed = require("./discord/Embed");
const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");

function defineLibraryFunctions(interpreter) {
    interpreter.globals.define("clock", new Callable(() => process.uptime(), 0));
    // interpreter.globals.define("readFile", new Callable((interpreter, a, __) => {
    //     return interpreter.asString(readFileSync(join(interpreter.Plon.cwd, ...a.map(val => common.stringify(interpreter, val)))).toString())
    // }));

    var getClass = (name, methods) => {
        let m = new Map();
        methods.forEach(k => m.set(k.name, k.func));
        return new Class(name, m);
    }
    
    var consoleMethods = [
        {
            name: "print",
            func: new Callable((int, a) => {
                int.Plon.log(...a.map(val => {
                    let ret;
                    do {
                        let tos = interpreter.toString(val);
                        ret = val?.toJSString?.() ?? tos;
                        // console.log(val);
                    } while(typeof ret != "string");
                    return ret;
                }));
                return null;
            })
        },
        {
            name: "read",
            func: new Callable((_, a) => {
                try {
                    return interpreter.asString(question(a[0] || undefined))
                } catch {
                    return "";
                }
            })
        }
    ];
    const Console = getClass("Console", consoleMethods);
    
    var mathMethods = [];
    for (let math of ["sqrt", "cbrt", "cos", "sin", "tan", "cosh", "sinh", "tanh", "acos", "asin", "atan", "floor", "ceil", "round"]) {
        mathMethods.push({
            name: math,
            func: new Callable((_, a) => Math[math](...a), 0, true)
        });
    }
    const Math_ = getClass("Math", mathMethods);

    interpreter.globals.define("console", new Instance(Console, interpreter));
    interpreter.globals.define("Math", Math_);

    readdirSync(__dirname).forEach(file => {
        if (file == "index.js")
            return;
        let required = require("./" + file);
        if (!required?.class)
            return;

        let methods = new Map(Object.entries(required.class));
        let klass = new Class(file.substring(0, file.length - 3), methods);
        if (required.instance)
            klass.instanceClass = required.instance;
        interpreter.globals.define(klass.name, klass);
    })
}

module.exports = { defineLibraryFunctions, ...common };