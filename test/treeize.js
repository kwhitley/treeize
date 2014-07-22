var treeize = require('../lib/treeize');
var _       = require('lodash');

var arrayData = [
  ["name", "age", "toys:name", "toys:owner:name"],  // header row
  ["Mittens", 12, "mouse", "Mittens"],              // data row 1
  ["Mittens", 12, "yarn", "Ms. Threadz"],           // data row 2
  ["Tiger", 7, "a stick", "Mother Nature"]          // data row 3
];

var flatData = [
  {
    "name":             "Mittens",
    "age":              12,
    "remove":           null,
    "toys:name":        "mouse",
    "toys:owner:name":  "Mittens",
  },
  {
    "name":             "Mittens",
    "age":              12,
    "remove":           null,
    "toys:name":        "yarn",
    "toys:owner:name":  "Ms. Threadz",
  },
  {
    "name":             "Tiger",
    "age":              7,
    "toys:name":        "a stick",
    "toys:owner:name":  "Mother Nature",
  },
  {
    "name":             "Tiger",
    "age":              7,
    "prune:remove1":    "",
    "prune:remove2":    null,
    "prune:remove3":    undefined,
    "toys:name":        null,
  }
];

var originalData = _.cloneDeep(flatData);
var originalOptions = treeize.options();

var treeData = [
  {
    "name": "Mittens",
    "age": 12,
    "remove": null,
    "toys": [
      {
        "name": "mouse",
        "owner": {
          "name": "Mittens"
        }
      },
      {
        "name": "yarn",
        "owner": {
          "name": "Ms. Threadz"
        }
      }
    ]
  },
  {
    "name": "Tiger",
    "age": 7,
    "toys": [
      {
        "name": "a stick",
        "owner": {
          "name": "Mother Nature"
        }
      },
      { "name": null }
    ],
    "prune": {
      "remove1":          "",
      "remove2":          null,
      "remove3":          undefined,
    }
  }
];

var treeDataPruned = [
  {
    "name": "Mittens",
    "age": 12,
    "toys": [
      {
        "name": "mouse",
        "owner": {
          "name": "Mittens"
        }
      },
      {
        "name": "yarn",
        "owner": {
          "name": "Ms. Threadz"
        }
      }
    ]
  },
  {
    "name": "Tiger",
    "age": 7,
    "toys": [
      {
        "name": "a stick",
        "owner": {
          "name": "Mother Nature"
        }
      },
    ],
  }
];

var flatDataNonPlural = [
  {
    "name":             "Mittens",
    "age":              12,
    "toy+:name":        "mouse",
    "toy+:owners:name":  "Mittens"
  },
  {
    "name":             "Mittens",
    "age":              12,
    "toy+:name":        "yarn",
    "toy+:owners:name":  "Ms. Threadz"
  },
  {
    "name":             "Tiger",
    "age":              7,
    "toy+:name":        "a stick",
    "toy+:owners:name":  "Mother Nature"
  }
];

var treeDataManual = [
  {
    "name": "Mittens",
    "age": 12,
    "toy": [
      {
        "name": "mouse",
        "owners": {
          "name": "Mittens"
        }
      },
      {
        "name": "yarn",
        "owners": {
          "name": "Ms. Threadz"
        }
      }
    ]
  },
  {
    "name": "Tiger",
    "age": 7,
    "toy": [
      {
        "name": "a stick",
        "owners": {
          "name": "Mother Nature"
        }
      }
    ]
  }
];

var treeDataMixed = [
  {
    "name": "Mittens",
    "age": 12,
    "toy": [
      {
        "name": "mouse",
        "owners": [{
          "name": "Mittens"
        }]
      },
      {
        "name": "yarn",
        "owners": [{
          "name": "Ms. Threadz"
        }]
      }
    ]
  },
  {
    "name": "Tiger",
    "age": 7,
    "toy": [
      {
        "name": "a stick",
        "owners": [{
          "name": "Mother Nature"
        }]
      }
    ]
  }
];


module.exports = {
  '.options() correctly sets options': function (test) {
    treeize.setOptions({ delimiter: '+' });
    test.expect(1);
    test.equal(treeize.options().delimiter, '+');
    test.done();
  },
  'globalOptions should remain set': function (test) {
    test.expect(1);
    test.equal(treeize.options().delimiter, '+');
    test.done();
  },
  '.options() returns self': function (test) {
    test.expect(1);
    test.ok(treeize.options({ delimiter: ':' }).grow);
    test.done();
  },
  'deepEqual ignores attribute order': function (test) {
    test.expect(1);
    test.deepEqual({ id: 1, foo: 'bar' }, { foo: 'bar', id: 1});
    test.done();
  },
  '.grow expands correctly': function (test) {
    test.expect(1);
    test.deepEqual(treeize.grow(flatData), treeData);
    test.done();
  },
  '.grow expands auto+manual declarations correctly': function (test) {
    test.expect(1);
    test.deepEqual(treeize.grow(flatDataNonPlural), treeDataMixed);
    test.done();
  },
  // '.grow expands manual collection declarations correctly': function (test) {
  //   test.expect(1);
  //   test.deepEqual(treeize.grow(flatDataNonPlural, { collections: { auto: false }}), treeDataManual);
  //   console.log('TREEIZE GLOBAL OPTIONS:', treeize.options());
  //   console.log('TREEIZE original OPTIONS:', treeize.options());
  //   test.done();
  // },
  '.grow options to not override global options': function (test) {
    test.expect(1);
    test.deepEqual(treeize.options(), originalOptions);
    test.done();
  },
  '.grow does not modify original data': function (test) {
    test.expect(1);
    test.deepEqual(flatData, originalData);
    test.done();
  },
  // '.treeize merges as expected': function (test) {
  //   var a = { name: 'cat', toys: [{ name: 'ball' }]};
  //   var b = { name: 'cat', toys: [{ name: 'mouse' }]};
  //   var c = [{ name: 'dog', age: 12 }];

  //   var results1 = [
  //     { name: 'cat', toys: [{ name: 'ball' }, { name: 'mouse' }]}
  //   ];

  //   var results2 = [
  //     { name: 'cat', toys: [{ name: 'ball' }, { name: 'mouse' }]},
  //     { name: 'dog', age: 12 }
  //   ];

  //   test.expect(1);
  //   test.deepEqual(treeize.grow(a,b), results1);
  //   test.done();
  // },

  '.grow pruned correctly': function (test) {
    test.expect(1);
    test.deepEqual(treeize.grow(flatData, { prune: true }), treeDataPruned);
    test.done();
  },
  // '.grow removes nulls correctly with prune option': function (test) {
  //   test.expect(2);
  //   treeize.options({ collections: { auto: true }});
  //   test.deepEqual(treeize.grow(flatDataPruneable), treeDataPruneable);
  //   test.deepEqual(treeize.grow(flatDataPruneable, { prune: true }), treeDataPruned);
  //   test.done();
  // }
};
