const Token = require("./Token");
const TokenType = require("./TokenType");

const keywords = new Map();
keywords.set("class", TokenType.CLASS);
keywords.set("else", TokenType.ELSE);
keywords.set("false", TokenType.FALSE);
keywords.set("for", TokenType.FOR);
keywords.set("function", TokenType.FUNCTION);
keywords.set("if", TokenType.IF);
keywords.set("lambda", TokenType.LAMBDA);
keywords.set("null", TokenType.NULL);
keywords.set("repeat", TokenType.REPEAT);
keywords.set("return", TokenType.RETURN);
keywords.set("static", TokenType.STATIC);
keywords.set("super", TokenType.SUPER);
keywords.set("this", TokenType.THIS);
keywords.set("true", TokenType.TRUE);
keywords.set("var", TokenType.VAR);
keywords.set("while", TokenType.WHILE);

/**
 * Scans the user's code and generates an array of `Token`s.
 */
module.exports = class Scanner {
    /**
     * @type {string}
     */
    source;
    /**
     * @type {Token[]}
     */
    tokens = [];

    start = 0;
    current = 0;
    line = 1;
    column = 0;

    /**
     * The current Plon "instance" (but it's static).
     */
    Plon;

    /**
     * If set, all the characters that errored.
     * @type {{line: number, column: number, char: string}[]}
     */
    charErrors = [];

    constructor(source, Plon) {
        this.Plon = Plon;
        this.source = source;
    }

    scanTokens() {
        while (!this.isAtEnd()) {
            // We are at the beginning of the next lexeme.
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line, this.column));
        return this.tokens;
    }

    isAtEnd() {
        // console.log(this.current >= this.source.length);
        return this.current >= this.source.length;
    }

    scanToken() {
        var c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '[': this.addToken(TokenType.LEFT_BRACK); break;
            case ']': this.addToken(TokenType.RIGHT_BRACK); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(this.match('.') ? TokenType.DOUBLE_DOT : TokenType.DOT); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '%': this.addToken(TokenType.PERCENT); break;
            case '-': {
                if (this.peek() == "=") {
                    this.addToken(TokenType.MINUS_EQUAL)
                } else if (this.match('>')) {
                    this.addToken(TokenType.ARROW);
                    break;
                }
                this.addToken(this.match('-') ? TokenType.MINUS_MINUS : TokenType.MINUS); break;
            }
            case '+': {
                if (this.peek() == "=") {
                    this.addToken(TokenType.PLUS_EQUAL)
                }
                this.addToken(this.match('+') ? TokenType.PLUS_PLUS : TokenType.PLUS); break;
            }
            case '*': {
                if (this.peekNext() == "=") {
                    this.addToken(this.match('*') ? TokenType.STAR_STAR_EQUAL : TokenType.STAR_EQUAL)
                }
                this.addToken(this.match('*') ? TokenType.STAR_STAR : TokenType.STAR); break;
            }
            case '/': {
                if (this.peek() == "=") {
                    this.addToken(TokenType.SLASH_EQUAL)
                } else if (this.peek() == "*") {
                    this.advance();
                    while(!(this.peek() == "*" && this.peekNext() == "/")) {
                        if (this.peek() == "\n") {
                            this.line++;
                            this.column = 0;
                        }
                        this.advance();
                        if (this.isAtEnd()) {
                            this.Plon.error(this.line, this.column, "Unterminated comment");
                            return;
                        }
                    }
                    // Consume the "*/"
                    this.advance();
                    this.advance();
                } else if (this.peek() == "/") {
                    while(this.peek() != "\n" && !this.isAtEnd())
                        this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            }
            case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG); break;
            case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;
            case '&': this.addToken(this.match('&') ? TokenType.AND : TokenType.BW_AND); break;
            case '|': this.addToken(this.match('|') ? TokenType.OR : TokenType.BW_OR); break;
            case '^': this.addToken(this.match('^') ? TokenType.XOR : TokenType.BW_XOR); break;
            case '<': {
                if (this.match('<')) {
                    this.addToken(TokenType.BW_LSHIFT);
                    break;
                }
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            }
            case '>': {
                if (this.match('>')) {
                    this.addToken(TokenType.BW_RSHIFT);
                    break;
                }
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            }
            case '?': this.addToken(TokenType.QUESTION); break;
            case ':': this.addToken(TokenType.COLON); break;
            case '#': {
                if (this.peek() == "!" && this.line == 1) {
                    while (this.peek() != "\n") {
                        this.advance();
                    }
                }
            }

            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace.
                break;

            case '\n':
                this.line++;
                this.column = 0;
                break;

            case '"': this.string(); break;
            case "'": this.singleLineString(); break;

            default: {
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    this.Plon.error(this.line, this.column, `Unexpected character '${c}'.`);
                }
            }
        }
    }

    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();
    
        // See if the identifier is a reserved word.
        var text = this.source.substring(this.start, this.current);

        var type = keywords.get(text);
        if (!type) type = TokenType.IDENTIFIER;
        this.addToken(type);
    }

    number() {
        while (this.isDigit(this.peek())) this.advance();
    
        // Look for a fractional part.
        if ((this.peek() == '.'/*  || this.peek() == ',' */) && this.isDigit(this.peekNext())) {
          // Consume the "."
          this.advance();
    
          while (this.isDigit(this.peek())) this.advance();
        }
    
        this.addToken(TokenType.NUMBER,
            parseFloat(this.source.substring(this.start, this.current).replace(",", ".")));
    }

    string() {
        while (!(this.peek() == '"') && !this.isAtEnd()) {
            if (this.peek() == '\n') {
                this.line++;
                this.current = 1;
            }
            this.advance();
        }
    
        // Unterminated string.
        if (this.isAtEnd()) {
          this.Plon.error(this.line, this.column, "Unterminated string.");
          return;
        }
    
        // The closing ".
        this.advance();
    
        // Trim the surrounding quotes.
        var value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, this.escapeSequence(value));
    }

    singleLineString() {
        while (this.peek() != "'" && !this.isAtEnd()) {
            if (this.peek() == '\n') {
                this.Plon.error(this.line, this.column, "Unterminated string.");
                return;
            }
            this.advance();
        }

        // Unterminated string.
        if (this.isAtEnd()) {
            this.Plon.error(this.line, this.column, "Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
        var value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, this.escapeSequence(value));
    }

    /**
     * Replaces the escape sequences with the escaped sequences.
     * @param {string} string The string;
     * @returns {string} The string with all the escape sequences, well... escaped.
     */
    escapeSequence(string) {
        let vals = {
            // "'": "'",
            // '"': '"',
            "n": "\n",
            "\n": "",
            "t": "\t",
            "r": "\r"
        };
        var s = string.split("\\\\").join("\\");
        for (const esc in vals) {
            if (vals.hasOwnProperty(esc)) {
                const value = vals[esc];
                s = s.split(`\\${esc}`).join(value);
            }
        }
        return s;
    }

    advance() {
        this.current++;
        this.column++;
        return this.source[this.current - 1];
    }

    /**
     * Adds a token to the token stack (`<Scanner>.tokens`).
     * @param {TokenType} type 
     * @param {any} literal 
     */
    addToken(type, literal = null) {
        if (type instanceof Function) {
            throw new Error();
        }
        var text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line, this.column));
    }

    /**
     * Returns `true` if the next character is `expected`.
     * @param {String} expected The character that should be next to the current one in order for this to return `true`.
     */
    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.source[this.current] != expected[0]) return false;
    
        this.current++;
        this.column++;
        return true;
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }

    isAlpha(c) {
        return (code(c) >= code('a') && code(c) <= code('z')) ||
               (code(c) >= code('A') && code(c) <= code('Z')) ||
               c == '_' || c == '$' || c == "€";
    }

    isDigit(char) {
        return code(char) >= code('0') && code(char) <= code('9');
    }
    
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
}

/**
 * Utility method that returns the code point of the first character of `char`.
 * @param {string} char A 1-length string (a character).
 */
function code(char) {
    return char.charCodeAt(0);
}