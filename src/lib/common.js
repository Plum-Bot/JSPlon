const StringInstance = require("./string").instance;
const Instance = require("../Instance");

function stringify(interpreter, /* Object */ object) {
    // // console.log(object);
    // if (object == null) return "null";

    // if (object.toJSString || (object instanceof Instance && object.klass.isNative && object.klass.name == "String")) {
    //     return object.toJSString();
    // } else if (typeof(object) == "string") {
    //     return object;
    // } else if (typeof object == "number") {
    //     let text = object.toString();
    //     if (text.endsWith(".0")) {
    //         text = text.substring(0, text.length - 2);
    //     }
    //     return interpreter.asString(text);
    // } else {
    //     return interpreter.toString(object);
    // }

    // if (typeof object == "number") {
    //     let text = object.toString();
    //     if (text.endsWith(".0")) {
    //         text = text.substring(0, text.length - 2);
    //     }
    //     return interpreter.asString(text);
    // }

    // // if (object instanceof Instance && object.fields.has("##values_") && Array.isArray(object.fields.get("##values_"))) {
    // //     return `[ ${object.fields.get("##values_").map(stringify).join(", ")} ]`
    // // }
    // // if (object instanceof Instance && !!object.toString) {
    // //     return object.toString();
    // // }

    // // console.log(object, object.toString, object.toString())
    // if (object instanceof Instance) {
    //     return stringify(object.toString());
    // }

    // return stringify(object.toString(interpreter, []));
    if (object == null) return "null";

    if (typeof object == "number") {
        let text = object.toString();
        if (text.endsWith(".0")) {
            text = text.substring(0, text.length - 2);
        }
        return text;
    }

    // if (object instanceof Instance && object.fields.has("##values_") && Array.isArray(object.fields.get("##values_"))) {
    //     return `[ ${object.fields.get("##values_").map(stringify).join(", ")} ]`
    // }
    if (object.toString)
        return object.toJSString?.() ?? object.toString()

    // console.log(object, object.toString, object.toString())

    return object.toString();
}

function exists(value) {
    return value != null && value != undefined;
}

module.exports = {
    stringify,
    exists
}