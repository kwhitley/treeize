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

var flatDataPruneable = [
  {
    "prop1": "val1",
    "items:foo": null,
    "items:bar": null
  },
  {
    "prop2": null,
    "items:foo": 0,
    "items:bar": "",
    "items:baz": false,
    "items:bob": undefined,
    "items:boyd": null
  },
  {
    "prop3": null,
    "group1:lorem": 0,
    "group1:ipsum:alpha": null,
    "group1:ipsum:bravo": null,
    "group1:dolor+:0": "charlie",
    "group1:dolor+:1": "delta",
    "group1:dolor+:2": null,
    "group1:dolor+:3": "echo"
  },
  {
    "prop4": null,
    "group2:sit":null,
    "group2:amet":null
  }
];

var treeDataPruneable = [
  {
    "prop1": "val1",
    "items": [
      {
        "bar": null,
        "foo": null
      }
    ]
  },
  {
    "prop2": null,
    "items": [
      {
        "boyd": null,
        "bob": undefined,
        "baz": false,
        "bar": "",
        "foo": 0,
      }
    ]
  },
  {
    "prop3": null,
    "group1": {
      "lorem": 0,
      "dolor": [
        {
          "0": "charlie",
          "1": "delta",
          "2": null,
          "3": "echo"
        }
      ],
      "ipsum": {
        "bravo": null,
        "alpha": null
      }
    }
  },
  {
    "prop4": null,
    "group2": {
      "amet": null,
      "sit": null
    }
  }
];

var treeDataPruned = [
  {
    "prop1": "val1",
    "items": []
  },
  {
    "items": [
      {
        "baz": false,
        "bar": "",
        "foo": 0
      }
    ]
  },
  {
    "group1": {
      "lorem": 0,
      "dolor": [
        {
          "0": "charlie",
          "1": "delta",
          "3": "echo"
        }
      ]
    }
  }
];

module.exports = {
  'default .options() returns expected defaults': function (test) {
    test.expect(1);
    test.deepEqual(treeize.options(), {
      delimiter: ':',
      debug:              false,
      benchmark: {
        speed:            true,
        size:             true
      },
      fast:               false,
      prune:              false,
      collections: {
        auto:             true,
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
  },
  '.grow removes nulls correctly with prune option': function (test) {
    test.expect(2);
    treeize.options({ collections: { auto: true }});
    test.deepEqual(treeize.grow(flatDataPruneable), treeDataPruneable);
    test.deepEqual(treeize.grow(flatDataPruneable,{prune:true}), treeDataPruned);
    test.done();
  }
};
