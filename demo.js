var util        = require('util');
var Treeize     = require('./lib/treeize');

var welldata1 = require('./test/data/welldata1');
var welldata2 = require('./test/data/welldata2');
var arraywelldata = require('./test/data/arraywelldata');

var keywordsTest = [
  {
    "code*":                       "RA",
    "reservoirs:code":            "UB",
    "wells:uwi":                  "RA-002",
    "wells:reservoirs:code":      "UB",
    "keywords+":                  "baz"
  },
  {
    "code*":                       "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log:wc":               0.1,
    "wells:log:date":             "12/12/2014",
    "keywords+":                  "bar"
  },
  {
    "code*":                       "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log:wc":               0.2,
    "wells:log:date":             "12/13/2014",
    "keywords+":                  "foo"
  }
];

var fields = new Treeize();
fields
  .setOptions({ log: true, data: { uniformRows: false, prune: true } })
  .setSignature(welldata1[3])
  .grow(welldata1)
  .grow(welldata2)
  .clearSignature()
  .grow(arraywelldata)
;

var testData = [
  {
    'name*': 'dog',
    'fk':   1,
    'pet': 'Fido'
  },
  {
    'name': 'cat',
    'fk:a': 'A',
    'fk:b': 'B'
  },
  {
    'name*': 'dog',
    'fk:a': 'X',
    'fk:b': 'Y',
    'pet':  'Mittens'
  },
];

var test = new Treeize();
test
  .setOptions({ log: true, data: { uniformRows: false, prune: true, objectOverwrite: true } })
  .grow(testData)
;

// var keywords = new Treeize();
// keywords.grow(keywordsTest);

// console.log('BASE>', fields + '');
// console.log('STATS>', util.inspect(fields.stats, false, null), "\n\n");

console.log('BASE>', test + '');
console.log('STATS>', util.inspect(test.stats, false, null), "\n\n");
// console.log('KEYWORDS>', keywords + '');
// console.log('STATS>', util.inspect(keywords.stats, false, null));
