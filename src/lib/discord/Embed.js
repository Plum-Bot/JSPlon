const Class = require("../../Class");
const Callable = require("../../Callable");
const Instance = require("../../Instance");
const stringify = require("../common");
const Plon = require("../../../plon");
const Func = require("../../Function");

/**
 * A key that can't be called in code.
 */
const HIDDEN_KEY = "##json_";

const Embed = new Class("Embed", new Map()
    .set("new", new Callable((interpreter, args, instance) => {
        instance.fields.set(HIDDEN_KEY, {
            title: "",
            type: "rich",
            description: "",
            url: null,
            timestamp: null,
            color: process.env.COLOR,
            footer: {
                text: "Plum",
                icon_url: null,
            },
            fields: [],
            author: {
                name: "Plum",
                icon_url: null
            }
        });
    }, 0))
    .set("addField", new Callable((interpreter, args, instance) => {
        if (args.length != 3 || args[0] == null || args[1] == null || typeof(args[2]) != "boolean")
            interpreter.Plon.runtimeError("<Embed>.addField requires exactly 3 arguments to be passed.");

        instance.fields.get(HIDDEN_KEY).fields.push({
            name: stringify(interpreter, args[0]),
            value: stringify(interpreter, args[1]),
            inline: !!args[2]
        });

        return instance;
    }, 3))
    // .set("flatten", new Callable((interpreter, args, instance) => {
    //     var arr = instance.fields.get(HIDDEN_KEY);
    //     arr = flattenDeep(arr);
    //     instance.fields.set(HIDDEN_KEY, arr);
    //     return instance;
    // }, 0))
    // .set("forEach", new Callable((interpreter, args, instance) => {
    //     if (!args[0] || !(args[0] instanceof Func))
    //         Plon.runtimeError("<Array>.forEach requires a Function (or a lambda) to be passed as an argument.");
        
    //     instance.fields.get(HIDDEN_KEY).forEach((el, index) => args[0].call(interpreter, [el, index]));
    // }, 0))
    // .set("push", new Callable((interpreter, args, instance) => {
    //     instance.fields.get(HIDDEN_KEY).push(args[0]);
    //     return instance.fields.get(HIDDEN_KEY).length;
    // }, 1))
);

class EmbedInstance extends Instance {
    // get(name) {
    //     if (!isNaN(name)) {
    //         if (name < 0)
    //             name += this.values.length;
    //         return this.values[name];
    //     }
        
    //     return super.get(name);
    // }

    // get values() {
    //     return this.fields.get(HIDDEN_KEY);
    // }
}

module.exports = {
    Embed,
    EmbedInstance,
    HIDDEN_KEY
}