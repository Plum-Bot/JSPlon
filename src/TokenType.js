const Enum = require("./Enum");

module.exports = Enum([
  // Single-character tokens.
  'LEFT_PAREN', 'RIGHT_PAREN', 'LEFT_BRACK', 'RIGHT_BRACK', 'LEFT_BRACE', 'RIGHT_BRACE', 
  'COMMA', 'DOT', 'DOUBLE_DOT', 'MINUS', 'PLUS', 'SEMICOLON', 'SLASH', 'STAR', 'STAR_STAR',
  'PERCENT',

  // *fix operators
  'MINUS_MINUS', 'PLUS_PLUS', 

  // Ternary operators
  'QUESTION', 'COLON', 

  // Bitwise operators
  'BW_LSHIFT', 'BW_RSHIFT', 'BW_AND', 'BW_OR', 'BW_XOR', 

  // One or two character tokens.
  'BANG', 'BANG_EQUAL', 
  'EQUAL', 'EQUAL_EQUAL', 
  'GREATER', 'GREATER_EQUAL', 
  'LESS', 'LESS_EQUAL', 
  'PLUS_EQUAL', 'MINUS_EQUAL', 
  'SLASH_EQUAL', 'STAR_EQUAL', 
  'STAR_STAR_EQUAL', 'BW_AND_EQUAL', 
  'BW_OR_EQUAL', 'BW_XOR_EQUAL', 
  'ARROW', 

  // Literals.
  'IDENTIFIER', 'STRING', 'NUMBER', 

  // Keywords.
  'AND', 'CLASS', 'ELSE', 'FALSE', 'FUNCTION', 'FOR', 'IF', 'LAMBDA', 'NULL', 
  'OR', 'RETURN', 'REPEAT', 'SUPER', 'STATIC', 'THIS', 'TRUE', 'VAR', 'WHILE', 'XOR',

  // Loop escapes
  'BREAK', 'CONTINUE',

  'EOF'
])