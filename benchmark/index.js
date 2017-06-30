var util            = require('util');
var TreeizeStable   = require('./treeize-previous');
var TreeizeUnstable = require('../lib/treeize');

var welldata1       = require('../test/data/welldata1');
var welldata2       = require('../test/data/welldata2');
var arraywelldata   = require('../test/data/arraywelldata');
var classdata       = require('../test/data/classdata');
var Benchmark       = require('benchmark');
var _               = require('lodash');

var suite           = new Benchmark.Suite;

console.log('Benchmarking Stable vs Unstable...')

// add tests
suite
  .add('Treeize[Unstable]', function() {
    var fields = new TreeizeUnstable();
    fields
      .grow(welldata1)
      .grow(welldata2)
      .grow(arraywelldata)
    ;
  })
  .add('Treeize[Stable]', function() {
    var fields = new TreeizeStable();
    fields
      .grow(welldata1)
      .grow(welldata2)
      .grow(arraywelldata)
    ;
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ 'async': true })
;

// console.log('KEYWORDS>', keywords + '');
// console.log('STATS>', util.inspect(keywords.stats, false, null));
