#!/usr/bin/env node

const { readFileSync } = require("fs");
const { createInterface } = require("readline");

const Escape = require("./src/throw/Escape.js");
const Interpreter = require("./src/Interpreter.js");
const Parser = require("./src/Parser.js");
const Scanner = require("./src/Scanner.js");
const TokenType = require("./src/TokenType.js");
const RuntimeError = require("./src/errors/RuntimeError.js");
const Return = require("./src/throw/Return.js");
const Resolver = require("./src/Resolver.js");
const Token = require("./src/Token.js");
const lib = require("./src/lib");
const path = require("path");

class Plon {

    /**
     * If the compiler noticed an error in the user's code.
     */
    static hadError = false;

    /**
     * If the compiler noticed an error in running the user's code.
     */
    static hadRuntimeError = false;

    static interpreter = new Interpreter(Plon);

    static runtimeErrorStr = "";

    static source;

    static MAX_RUN_TIME = Infinity;
    static bufferMode = false;

    static stdout = "";
    static stderr = "";

    /**
     * The cwd of the script.
     *
     * @static
     * @memberof Plon
     */
    static cwd = "";

    /**
     * Run a file from source.
     * @param {string} filename 
     */
    static runFile(filename) {
        const source = readFileSync(filename).toString()

        let cwd = path.resolve(filename).split(path.sep);
        Plon.cwd = cwd.slice(0, cwd.length - 1).join(path.sep);

        Plon.run(source);

        if (Plon.hadError) process.exit(65)
        if (Plon.hadRuntimeError) process.exit(70)
    }

    /**
     * Activates a REPL interface.
     */
    static runPrompt() {
        Plon.cwd = process.cwd();
        console.log(`Welcome to the Plon REPL.
Evaluate any Plon expression or type ##EXIT to exit.`);

        let rl = createInterface({
            input: process.stdin,
            output: process.stdout
        });

        function REPL() {
            rl.question("> ", (code) => {
                if (code.trim() == "##EXIT") {
                    process.exit()
                };
                Plon.run(code);
                Plon.hadError = false;
                REPL();
            });
        }
        REPL();
    }

    /**
     * Parses code and returns a list of tokens.
     * @param {string} source The source code to tokenize.
     * @returns {Token[]} The tokens.
     */
    static tokenize(source) {
        let scanner = new Scanner(source, Plon);
        return scanner.scanTokens();
    }

    static tree(tokens) {
        let parser = new Parser(tokens, Plon);
        return parser.parse();
    }

    /**
     * JSPlon's juice: runs code.
     * @param {string} source 
     */
    static run(source) {
        Plon.source = source;
        Plon.start = Date.now();

        let tokens = Plon.tokenize(source);
        let statements = Plon.tree(tokens);

        if (Plon.hadError) return;

        let resolver = new Resolver(Plon.interpreter, Plon);
        resolver.resolve(statements);

        Plon.interpreter.interpret(statements);
    }

    // Error handling
    /**
     * 
     * @param {number} line 
     * @param {number} col 
     * @param {string} message 
     * @static
     */
    static error(line, col, message) {
        if (!message) {
            return Plon.error_(line, col);
        }
        Plon.report(line, col, "", message);
    }

    static error_(token, message) {
        if (token.type == TokenType.EOF) {
            Plon.report(token.line, token.col, " at end", message, token.lexeme?.length ?? 1);
        } else {
            Plon.report(token.line, token.col, ` at '${token.lexeme}'`, message, token.lexeme?.length ?? 1);
        }
    }

    static report(line, col, where, message, length = 1) {
        Plon.err(`[${line}:${col}] Error${where}: ${message}`);
        let before = line > 1 ? Plon.prettyLine(line - 1) : "";
        let after = line + 1 <= Plon.source.split("\n").length ? Plon.prettyLine(line + 1) : "";
        Plon.err(`
        ${before}
        ${Plon.prettyLine(line)}
        ${" ".repeat(line.toString().length)} | ${" ".repeat(col - length)}${"^".repeat(length)}
        ${after}
        `);
        Plon.hadError = true;
    }

    static prettyLine(line) {
        return (`${line} | ${Plon.source.split("\n")[line-1]}`);
    }

    static rawError(message) {
        Plon.err(message);
    }

    static runtimeError( /* RuntimeError */ error) {
        if (error instanceof RuntimeError) {
            let str = `[${error.token.line}:${error.token.col}] ${error.message}`;
            Plon.err(str);
            Plon.runtimeErrorStr = str;
            Plon.hadRuntimeError = true;
        } else if (error instanceof Escape || error instanceof Return) {
            let str = `[${error.token.line}:${error.token.col}] Illegal '${error.type.toString().toLowerCase()}' statement.`;
            Plon.err(str);
            Plon.runtimeErrorStr = str;
            Plon.hadRuntimeError = true;
        } else {
            Plon.err("raw error", error);
        };
    }

    static log(...data) {
        if (Plon.bufferMode) {
            Plon.stdout += data.join(" ");
            Plon.stdout += "\n";
        } else {
            console.log(...data);
        }
    }

    static err(...data) {
        if (Plon.bufferMode) {
            Plon.stderr += data.join(" ");
            Plon.stderr += "\n";
        } else {
            console.error(...data);
        }
    }
}

// node ./plon file
if (process.argv.some(a => a == "--cmd")) {
    if (process.argv.filter(a => a != "--cmd").length > 3) {
        console.log('Usage: plon [script]')
    } else if (process.argv.length < 3) {
        Plon.runPrompt();
    } else {
        Plon.runFile(process.argv[2]);
    }
}

module.exports = Plon;