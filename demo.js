var util        = require('util');
var _           = require('lodash');
var inflection  = require('inflection');

function Treeize(options) {
  this.data = {
    signature: [],
    seed: [],
    tree: [],
  };

  this._options = {
    delimiter:    ':',
    data: {
      uniform:    true,
    },
    debug:        false,
  };

  this.stats = {
    time:     {
      total:  0,
      signatures: 0,
    },
    rows:     0,
    sources:  0,
    tA:       null,
    tB:       null,
  };

  if (options) {
    this.options(options);
  }

  return this;
}

Treeize.prototype.debug = function() {
  if (this.options().debug) {
    console.log.apply(this, arguments);
  }
};

Treeize.prototype.signature = function(row) {
  if (!row) {
    return this.data.signature;
  }

  // start timer
  this.stats.tA = (new Date()).getTime();

  var nodes         = this.data.signature = [];
  var isArray       = _.isArray(row);

  _.each(row, function(value, key) {
    // set up attribute
    var attr        = {}

    attr.key        = typeof key === 'number' ? key : key.replace(/[\*\+\-]/gi,'');
    attr.fullPath   = isArray ? value : key;
    attr.split      = attr.fullPath.split(this.options().delimiter);
    attr.path       = _.initial(attr.split).join(this.options().delimiter).replace(/[\*\+\-]/gi,'');
    attr.parent     = _.initial(attr.split, 2).join(this.options().delimiter).replace(/[\*\+\-]/gi,'');
    attr.attr       = _.last(attr.split).replace(/[\*\+\-]/gi,'');
    attr.node       = attr.split[attr.split.length - 2];
    attr.pk         = attr.node && attr.node.match(/\*/gi);


    if (attr.pk) {
      console.log('primary key detected in node "' + attr.node + '"');
    }

    // if (attr.node) {
    //   attr.node = attr.node.replace(/[\*\+\-]/gi,'');
    // }

    // set up node reference
    var node        = _.findWhere(nodes, { path: attr.path });
    if (!node) {
      node = { path: attr.path, attributes: [], blueprint: [] };
      nodes.push(node);
    }

    // if (target.node.match(/[\+\-]$/)) {
    //   isCollection = target.node.match(/\+$/) || isCollection;
    //   isCollection = isCollection && !target.node.match(/\-$/);

    //   target.node = target.node.replace(/[\+\-]$/, '');
    // }

    node.isCollection = !attr.node || inflection.pluralize(attr.node) === attr.node;

    var collectionFlag = attr.node && attr.node.match(/[\+\-]/gi);
    if (collectionFlag) {
      console.log('collection flag "' + collectionFlag + '" detected in node "' + attr.node + '"');
      node.flags = true;
      node.isCollection = attr.node.match(/\+/gi).length;
      attr.node = attr.node.replace(/[\*\+\-]/gi,''); // clean node
    }

    node.name         = attr.node;
    node.depth        = attr.split.length - 1;
    node.parent       = _.initial(attr.split, 2).join(this.options().delimiter);
    node.attributes.push({ name: attr.attr, key: attr.key });
    if (attr.pk) {
      node.blueprint.push({ name: attr.attr, key: attr.key });
    }
  }, this);

  nodes.sort(function(a, b) { return a.depth < b.depth ? -1 : 1; });

  // end timer and add time
  this.stats.tB = ((new Date()).getTime() - this.stats.tA);
  this.stats.time.signatures += this.stats.tB;
  this.stats.time.total += this.stats.tB;

  return this;
};


Treeize.prototype.grow = function(data, options) {
  var opt = _.extend(this.options(), options || {});

  this.debug('OPTIONS>', opt);

  var signature = this.signature();

  if (!signature.length) {
    this.signature(data[0]);

    if (_.isArray(data[0])) {
      // remove header row
      data.shift();
    }

    signature = this.signature();
  }

  console.log('SIGNATURE>', util.inspect(this.signature(), false, null));

  this.stats.sources++;
  this.stats.tA = (new Date()).getTime();

  _.each(data, function(row) {
    var trails = {}; // LUT for trails (find parent of new node in trails path)
    var trail = root = this.data.tree;
    var t = null;

    if (!opt.data.uniform) {
      // get signature from each row
      this.signature(row);
      console.log('SIGNATURE>', util.inspect(this.signature(), false, null));
    }

    this.stats.rows++;

    if (_.where(this.signature(), { flags: true }).length) {
      // flags detected within signature, clean attributes of row
      _.each(row, function(value, key) {

        if (typeof key === 'string') {
          var clean = key.replace(/[\*\+\-]/gi,'');
          if (clean !== key) {
            console.log('cleaning key "' + key + '" and embedding as "' + clean + '"');
            row[key.replace(/[\*\+\-]/gi,'')] = value; // simply embed value at clean path (if not already)
          }

        }
      });
    }

    _.each(this.signature(), function(node) {
      this.debug('PROCESSING NODE>', node);
      var blueprint = {};

      _.each(node.attributes, function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute.name;
        this.debug('KEY>', key, attribute.key);
        blueprint[attribute.name] = row[attribute.key];
      }, this);
      this.debug('BLUEPRINT>', blueprint);

      // ROOT CASE
      if (!(trail = trails[node.parent])) {
        this.debug('PARENT TRAIL NOT FOUND (ROOT?)');
        if (!(trail = _.findWhere(root, blueprint))) {
          root.push(trail = blueprint);
        }
        trails[node.path] = trail;
      } else {
        // NOT ROOT CASE
        if (node.isCollection) {
          // handle collection nodes
          if (!trail[node.name]) {
            // node attribute doesnt exist, create array with fresh blueprint
            trail[node.name] = [blueprint];
            trails[node.path] = blueprint;
          } else {
            // node attribute exists, find or inject blueprint
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
            trail[node.name] = blueprint;
            trails[node.path] = blueprint;
          } else {
            // node attribute exists, set path for next pass
            trails[node.path] = trail[node.path];
          }
        }
      }

    }, this);
  }, this);

  this.stats.tB = ((new Date()).getTime() - this.stats.tA);
  this.stats.time.total += this.stats.tB;

  // clear signature between growth sets
  this.signature([]);

  return this;
};



Treeize.prototype.options = function(options) {
  if (!options) {
    return _.extend({}, this._options);
  }

  _.extend(this._options, options);

  return this;
};

Treeize.prototype.toString = function treeToString() {
  return util.inspect(this.data.tree, false, null);
};

// var Treeize = require('./lib/treeize');


var flatData = [
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log+:oilrate":          5000,
    "wells:log+:date":             "12/12/2014",
  },
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log:oilrate":      5050,
    "wells:log:date":         "12/13/2014",
  },
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log:wc":      0.5,
    "wells:log:date":         "12/13/2014",
  },
  {
    "code":                 "RA",
    "reservoirs:code":            "UB",
    "wells:uwi":                  "RA-002",
    "wells:reservoirs:code":      "UB",
    "wells:log:oilrate":      4500,
    "wells:log:date":         "12/12/2014",
  },
  {
    "code":                 "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log:oilrate":      2050,
    "wells:log:date":         "12/12/2014",
  },
];

var arrayData = [
  ["code", "reservoirs:code", "wells:uwi", "wells:reservoirs:code", "wells:logs:oilrate", "wells:logs:date"],
  ["RA", "LB", "RA-001", "LB", 5000, "12/12/2014"],
  ["RA", "LB", "RA-001", "LB", 5050, "12/13/2014"],
  ["RA", "UB", "RA-002", "UB", 4500, "12/12/2014"],
  ["SA", "MA", "SA-032", "MA", 2050, "12/12/2014"],
];



var pets = new Treeize();
pets
  // .options({ processing: { uniform: false } })
  .grow(flatData)//, { data: { uniform: false }})
  // .grow(arrayData)
  // .signature(flatData[0])
  // .signature(["foo:bar:id", "foo:bar:baz", "id"])
  // .grow() // or .grow(flatData)
  // .grow(flatData) // or .grow(flatData)
  // .grow({ options: "options" }) // or .grow(flatData)
  // .grow({ options: "options" }) // or .grow(flatData)
  // .print()
;

console.log('FINAL>', pets + '');
console.log('STATS>', util.inspect(pets.stats, false, null));

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
