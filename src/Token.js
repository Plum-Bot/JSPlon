const TokenType = require("./TokenType");

/**
 * Represents a Token in code.
 */
module.exports = class Token {
    /**
     * @type {TokenType}
     */
    type;

    /**
     * @type {string}
     */
    lexeme;

    /**
     * @type {any}
     */
    literal;

    /**
     * @type {number}
     */
    line;

    /**
     * @type {number}
     */
    col;

    /**
     * Creates a new token.
     * @param {TokenType} type 
     * @param {string} lexeme 
     * @param {any} literal 
     * @param {number} line 
     * @param {number} col 
     */
    constructor(type, lexeme, literal, line, col) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
        this.col = col;
    }

    toString() {
        return this.type + " " + this.lexeme + " " + this.literal;
    }
}