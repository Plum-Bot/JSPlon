const common = require("./common");
const Callable = require("../Callable");
const Instance = require("../Instance");
const RuntimeError = require("../errors/RuntimeError");

const KEY = "raw data";
module.exports.class = {
    new: new Callable((_, args, inst) => {
        inst.fields.set(KEY, common.exists(args[0]) ? args[0].toString() : "");
    }, 1),
    toString: new Callable((_, __, inst) => {
        return inst.fields.get(KEY);
    }),
    length: new Callable((_, __, inst) => {
        return inst.fields.get(KEY).length;
    }),
    split: new Callable((interpreter, [del], inst) => {
        del = common.stringify(interpreter, del);

        let split = inst.fields.get(KEY).split(del)
            .map(chunk => interpreter.asString(chunk));
        return interpreter.globals.values.get("Array").call(interpreter, split);
    }),
    trim: new Callable((interpreter, [], inst) => {
        return inst.fields.get(KEY)?.trim();
    })
}

module.exports.instance = class StringInstance extends Instance {
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
        return this.fields.get(KEY);
    }

    eq(other) {
        // console.log("StringInstance#eq", this.fields.get(KEY), other.fields.get(KEY));
        return this.fields.get(KEY) == other.fields.get(KEY);
    }

    isTruthy() {
        // console.log(this, !!this.fields.get(KEY))
        return !!this.fields.get(KEY)
    }
}