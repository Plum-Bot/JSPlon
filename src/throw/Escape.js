const Enum = require("../Enum");
const types = Enum([
    'BREAK', 'CONTINUE'
]);

module.exports = class Escape {
    type;
    token;

    static types = types;

    constructor(type, token) {
        if (![types.BREAK, types.CONTINUE].some(t => type != t)) {
            throw new TypeError("Type must be a member of Error.types");
        }
        this.type = type;
        this.token = token;
    }
}