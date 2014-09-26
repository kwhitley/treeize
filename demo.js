var util            = require('util');
var Treeize         = require('./lib/treeize');

var welldata1       = require('./test/data/welldata1');
var welldata2       = require('./test/data/welldata2');
var arraywelldata   = require('./test/data/arraywelldata');
var async           = require('async');
var CSV             = require('a-csv');
var _               = require('lodash');

var parseXlsx = require('excel');

var fields = new Treeize();
// fields
//       .setOptions({ input: { uniformRows: false } })
//       .grow(welldata1)
//       .grow(welldata2)
//       .grow(arraywelldata)
//     ;

    fields
      .setOptions({ input: { uniformRows: false } })
      .grow(welldata1)
      .grow(welldata2)
      .grow(arraywelldata)
    ;

// test node dependency

var testNodeDependency = [
  {
    'foo:name': 'kevin',
    'foo:age': 34
  }
];

// var test4 = new Treeize();
// test4
//   .setOptions({ log: true, input: { uniformRows: false } })
//   .grow(testNodeDependency)
// ;

// var keywords = new Treeize();
// keywords.grow(keywordsTest);

// console.log('BASE>', test4 + '');
// console.log('STATS>', util.inspect(test4.stats, false, null), "\n\n");

// parseXlsx('injection.xlsx', function(err, data) {
//     console.log('err', err);
//     if(err) throw err;
//     console.log('data read successfully');
//     // data is an array of arrays
// });





var csv = require('csv-parser');
var fs  = require('fs');

var data = [];

var options = {
  delimiter: "|",
  charset: "win1250"
};

// CSV.parse(__dirname + '/test/data/mooc2.csv', options, function (err, row, next) {
//   if (err) {
//     return console.log(err);
//   }

//   if (row) {
//     data.push(row);
//     return next();
//   }

//   if (!row) {
//     var universities = new Treeize();
//     universities
//       // .setOptions({ log: true })
//       .grow(data)
//     ;

//     console.log('BASE>', universities + '');
//     console.log('STATS>', util.inspect(universities.stats, false, null), "\n\n");
//   }
// });


var tree = new Treeize();

tree.setOptions({ log: true }).grow([
  { 'foo:name': 'bar', 'foo:age': 1 },
  { 'foo:name': 'baz', 'foo:age': 3 },
]);

// var tree = new Treeize();

// tree.setOptions({ log: true }).grow([
//   { 'foo': 'bar', 'logs:id': 'abc', 'logs:a:b': 1 },
//   { 'foo': 'bar', 'logs:id': 'abc', 'logs:a:b': 2 },
//   { 'foo': 'baz', 'logs:id': 'abc', 'logs:a:b': 3 },
// ]);

// tree.setOptions({ log: true }).grow([
//   { 'foo': 'bar', 'logs-:a:b:c': 1 },
//   { 'foo': 'bar', 'logs-:a:b:c': 2 },
//   { 'foo': 'baz', 'logs-:a:b:c': 3 },
// ]);

// tree.setOptions({ log: true }).grow([
//   { 'foo': 'bar', 'logs:a': 1 },
//   { 'foo': 'bar', 'logs:a': 2 },
//   { 'foo': 'baz', 'logs:a': 3 },
// ]);

console.log('BASE>', tree + '');
console.log('STATS>', util.inspect(tree.stats, false, null), "\n\n");

// console.log('KEYWORDS>', keywords + '');
// console.log('STATS>', util.inspect(keywords.stats, false, null));
