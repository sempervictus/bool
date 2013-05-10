var assert = require('assert');
var lexer = require('../lib/lexer');
// Install our own parseError function that doesn't depend on the parser.
lexer.parseError = function(message, hash) {
  throw new Error(message);
};

function lex() {
  return [lexer.lex(), lexer.yytext];
}

describe('Lexer', function() {
  it('tokenizes a feature keyword', function() {
    lexer.setInput("  \n  Feature:");

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
  });

  it('tokenizes tags', function() {
    lexer.setInput("@foo @bar @zap\n\n");

    assert.deepEqual([ 'TOKEN_TAG', '@foo' ], lex());
    assert.deepEqual([ 'TOKEN_TAG', '@bar' ], lex());
    assert.deepEqual([ 'TOKEN_TAG', '@zap' ], lex());
    assert.deepEqual(['INITIAL', 'TAGS'], lexer.conditionStack);
    lex();
    lex();
    assert.deepEqual(['INITIAL'], lexer.conditionStack);
  });

  it('tokenizes a named feature with given when', function() {
    lexer.setInput("Feature:     Hello\n" +
                   "  Given I have 4 cukes in my belly\n" +
                   "  When I go shopping\n"
                   );

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'Hello' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'Given ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'I have 4 cukes in my belly' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'When ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'I go shopping' ], lex());
  });

  it('tokenizes a named feature with description', function() {
    lexer.setInput("Feature:     Hello\n" +
                   "  This is a description\n" +
                   "  and so is this");

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'Hello' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'This is a description' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'and so is this' ], lex());
  });

  it('does not recognise a spaceless keyword', function() {
    lexer.setInput("Feature: Hello\n" +
                   "  Whenny is not a keyword\n"
                   );

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'Hello' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'Whenny is not a keyword' ], lex());
  });

  it ('tokenizes descriptions and given when then even when description is long', function() {
    lexer.setInput("Feature:     Hello\n" +
                   "  this is a longer description than the given step\n" +
                   "  Given a step");

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'Hello' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'this is a longer description than the given step' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'Given ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'a step' ], lex());
  });

  it ('tokenizes descriptions and given/when/then when the steps are longer than the descriptions', function() {
    lexer.setInput("Feature:     Hello\n" +
                   "  description\n" +
                   "more\n" +
                   "  Given a reasonably long step\n" +
                   "  When I do something interesting\n" +
                   "  Then stuff happens"
                   );

    assert.deepEqual([ 'TOKEN_FEATURE', 'Feature:' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'Hello' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'description' ], lex());
    assert.deepEqual([ 'TOKEN_DESCRIPTION_LINE', 'more' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'Given ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'a reasonably long step' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'When ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'I do something interesting' ], lex());
    assert.deepEqual([ 'TOKEN_STEP', 'Then ' ], lex());
    assert.deepEqual([ 'TOKEN_NAME', 'stuff happens' ], lex());
  });

  it ('lexes a DocString', function() {
    lexer.setInput("  \"\"\"  \n" +
                   "  This is\n" +
                   "   a DocString\n" +
                   "  \"\"\"\n" +
                   "Given something\n" +
                   "  \"\"\"  \n" +
                   "  The next\n" +
                   "DocString\n" +
                   "  \"\"\"\n"
                   );

    assert.deepEqual([ 'TOKEN_DOC_STRING_LINE', "  This is\n" ], lex());
    assert.deepEqual([ 'TOKEN_DOC_STRING_LINE', "   a DocString\n" ], lex());      
    assert.deepEqual([ 'TOKEN_STEP', "Given " ], lex());
    assert.deepEqual([ 'TOKEN_NAME', "something" ], lex());
    assert.deepEqual([ 'TOKEN_DOC_STRING_LINE', "  The next\n" ], lex());
  });

  it ('lexes cells', function() {
    lexer.setInput("|foo|bar|  \n  ");

    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_CELL', 'foo' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_CELL', 'bar' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|  ' ], lex());
    assert.deepEqual([ 'TOKEN_EOL', '\n' ], lex());
  });

  it ('lexes empty cells', function() {
    lexer.setInput("|||\n");

    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_EOL', '\n' ], lex());
  });

  it ('lexes rows of cells', function() {
    lexer.setInput("  | aaa | |\n  || ddd |\n");

    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_CELL', ' aaa ' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '| ' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_EOL', '\n' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '| ' ], lex());
    assert.deepEqual([ 'TOKEN_CELL', 'ddd ' ], lex());
    assert.deepEqual([ 'TOKEN_PIPE', '|' ], lex());
    assert.deepEqual([ 'TOKEN_EOL', '\n' ], lex());
  });
});

