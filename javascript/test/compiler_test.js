var assert = require('assert');
var fs = require('fs');
var path = require('path');
var parser = require('../lib').parser;
var Compiler = require('../lib/compiler');

describe('Compiler', function() {
  it('compiles background', function() {
    var source = fs.readFileSync(path.join(__dirname, '../../testdata/with_background.feature'), 'UTF-8');
    var feature = parser.parse(source);
    var units = new Compiler().compile(feature);
    assert.equal(2, units.length);
    assert.equal(2, units[0].steps.length);
    assert.equal('a background step', units[0].steps[0].name.value);
    assert.equal('I have 3 more cukes in my belly', units[0].steps[1].name.value);
  });
});
