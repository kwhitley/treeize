var util        = require('util');
var _           = require('lodash');
var inflection  = require('inflection');

function Treeize(options) {
  this.data = {
    signature: {
      attributes: [],
      nodes:      [],
    },
    seed: [],
    tree: [],
  };

  this._options = {
    delimiter: ':',
    processing: {
      allowEmpty: true,
      uniform:    true,
    }
  };

  if (options) {
    this.options(options);
  }

  return this;
}


Treeize.prototype.signature = function(row) {
  if (!row) {
    return this.data.signature;
  }

  var attributes    = this.data.signature.attributes = [];
  var nodes         = this.data.signature.nodes = [];
  var isArray       = _.isArray(row);

  _.each(row, function(value, key) {

    // set up attribute
    var attr        = {}

    attr.key        = key;
    attr.fullPath   = isArray ? value : key;
    attr.split      = attr.fullPath.split(this.options().delimiter);
    attr.path       = _.initial(attr.split).join(this.options().delimiter);
    attr.parent     = _.initial(attr.split, 2).join(this.options().delimiter);
    attr.attr       = _.last(attr.split);
    attr.node       = attr.split[attr.split.length - 2];

    // set up node reference
    var node        = _.findWhere(nodes, { path: attr.path });
    if (!node) {
      node = { path: attr.path, attributes: [] };
      nodes.push(node);
    }

    node.name         = attr.node;
    node.depth        = attr.split.length - 1;
    node.isCollection = !attr.path || inflection.pluralize(attr.path) === attr.path;
    node.parent       = attr.parent;
    node.attributes.push(attr.attr);

    attributes.push(attr);
  }, this);

  attributes.sort(function(a, b) { return a.split.length < b.split.length ? -1 : 1; });
  nodes.sort(function(a, b) { return a.depth < b.depth ? -1 : 1; });

  return this;
};


Treeize.prototype.grow = function(data) {
  var d = data || this.data.seed || [];
  var opt = this.options();

  if (!this.data.signature.length) {
    this.signature(d[0]);
  }

  var signature = this.signature();
  // console.log('SIGNATURE>', typeof signature);
  //
  console.log(signature.nodes);

  _.each(this.data.seed, function(row) {
    var trails = {}; // LUT for trails (find parent of new node in trails path)
    var trail = root = this.data.tree;
    var t = null;

    if (!opt.processing.uniform) {
      // get signature from each row
      signature = this.signature(row).data.signature;
      console.log('SIGNATURE>', signature);
    }

    _.each(signature.nodes, function(node) {
      console.log('PROCESSING NODE>', node);
      var blueprint = {};

      _.each(node.attributes, function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute;
        console.log('KEY>', key);
        blueprint[attribute] = row[key];
      });
      console.log('BLUEPRINT>', blueprint);

      // ROOT CASE
      if (!(trail = trails[node.parent])) {
        console.log('PARENT TRAIL NOT FOUND (ROOT?)');
        if (!(trail = _.findWhere(root, blueprint))) {
          root.push(trail = blueprint);
        }
        // console.log('ROOT TRAIL>', trail);
        trails[node.path] = trail;
      } else {
        // NOT ROOT CASE
        // console.log('PARENT TRAIL FOUND', trail);
        if (node.isCollection) {
          // handle collection nodes
          if (!trail[node.name]) {
            // node attribute doesnt exist, create array with fresh blueprint
            console.log('creating attribute "' + node.name + '" as collection with blueprint');
            trail[node.name] = [blueprint];
            trails[node.path] = blueprint;
          } else {
            console.log('collection attribute "' + node.name + '" found');
            // node attribute exists, find or inject blueprint
            // trail = _.findWhere(trail[node.name], blueprint) || trail[node.name].push(trail = blueprint);
            var t;
            if (!(t = _.findWhere(trail[node.name], blueprint))) {
              trail[node.name].push(trail = blueprint);
            }
            trails[node.path] = t || trail;
          }
        } else {
          // handle non-collection nodes
          if (!trail[node.name]) {
            // node attribute doesnt exist, create object
            console.log('creating attribute "' + node.name + '" as blueprint');
            trail[node.name] = blueprint;
            trails[node.path] = blueprint;
          } else {
            console.log('found attribute "' + node.name + '" and storing in trails table');
            // node attribute exists, set path for next pass
            trails[node.path] = trail[node.path];
          }
        }
      }

      // find or inject attribute

      // trail = trail[node.path] = trail[node.path] || (node.isCollection ? [blueprint] : blueprint)

      /*

        1. find or create parent node, set trail
        2. add node (or find if existing), set trail in table
        3. extend blueprint (or push if collection)

       */

      // if (_.isArray(trail)) {
      //   // find or push new node
      // } else {

      // }

      // if (node.path) {
      //   // set up path
      //   trail = trail[node.path] = trail[node.path] || (node.isCollection ? [blueprint] : blueprint);
      //   trail = blueprint;
      // } else {
      //   var t = _.findWhere(trail, blueprint);
      //   trail = t || trail.push(trail = blueprint);
      // }

      console.log('TREE>', this.data.tree);
      // console.log('TRAIL>', trail);

      // if (!(t = _.findWhere(trail, blueprint))) {
      //   trail.push(trail = blueprint); // trail traverses inside to pushed blueprint
      //   console.log('TRAIL AT>', trail);
      // }

    }, this);
  }, this);

  return this;
};



Treeize.prototype.options = function(options) {
  if (!options) {
    return this._options;
  }

  _.extend(this._options, options);

  return this;
};

Treeize.prototype.seed = function(data) {
  this.data.seed = data;

  return this;
};

Treeize.prototype.toString = function treeToString() {
  return util.inspect(this.data.tree, false, null);
};

// var Treeize = require('./lib/treeize');


var flatData = [
  {
    "toys:name":                  "mouse",
    "toys:owner:name":            "Mittens",
    "toys:type":                  "stuffed animal",
    "toys:histories:modified":    "10/12/2014",
    "name":                       "Mittens",
    "age":                        12,
  },
  {
    "toys:name":                  "mouse",
    "toys:owner:name":            "Mittens",
    "toys:type":                  "stuffed animal",
    "toys:histories:modified":    "1/1/2015",
    "name":                       "Mittens",
    "age":                        12,
  },
  {
    "name":             "Mittens",
    "age":              12,
    "toys:name":        "yarn",
    "toys:histories:modified":    "12/25/2002",
    "toys:owner:name":  "Ms. Threadz",
    // "toys:type":                  "misc",
  },
  {
    "name":             "Tiger",
    "age":              7,
    "toys:name":        "a stick",
    "toys:owner:name":  "Mother Nature",
    "toys:lastBorrowedBy":  "Mittens",
  },
  // {
  //   "name":             "Tiger",
  //   "age":              7,
  // }
];



var pets = new Treeize({ debug: "false" });
pets
  .options({ processing: { uniform: false } })
  .seed(flatData)
  // .signature(flatData[0])
  // .signature(["foo:bar:id", "foo:bar:baz", "id"])
  .grow() // or .grow(flatData)
  // .grow(flatData) // or .grow(flatData)
  // .grow({ options: "options" }) // or .grow(flatData)
  // .grow({ options: "options" }) // or .grow(flatData)
  // .print()
;

console.log('FINAL>', pets + '');

/*

{
  this.data {
    seed: [],
    tree: []
  }
}

OPTIONS(options) {
  extend global options
}

SEED(data) {
  set initial data
}

 */
