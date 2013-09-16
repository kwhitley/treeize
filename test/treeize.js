var treeize = require('../lib/treeize');

var flatData1 = [
  {
    "name":             "Mittens",
    "age":              12,
    "toys:name":        "mouse",
    "toys:owner:name":  "Mittens"
  },
  {
    "name":             "Mittens",
    "age":              12,
    "toys:name":        "yarn",
    "toys:owner:name":  "Ms. Threadz"
  },
  {
    "name":             "Tiger",
    "age":              7,
    "toys:name":        "a stick",
    "toys:owner:name":  "Mother Nature"
  }
];

var treeData1 = [
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
      }
    ]
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
  'default .options() returns expected defaults': function (test) {
    test.expect(1);
    test.deepEqual(treeize.options(), {
      delimiter: ':',
      collections: {
        auto:  true
      }
    });
    test.done();
  },
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
  '.grow expands correctly': function (test) {
    test.expect(1);
    test.deepEqual(treeize.grow(flatData1), treeData1);
    test.done();
  },
  '.grow expands auto+manual declarations correctly': function (test) {
    test.expect(1);
    test.deepEqual(treeize.grow(flatDataNonPlural), treeDataMixed);
    test.done();
  },
  '.grow expands manual collection declarations correctly': function (test) {
    test.expect(1);
    treeize.options({ collections: { auto: false }});
    test.deepEqual(treeize.grow(flatDataNonPlural), treeDataManual);
    test.done();
  }
};
