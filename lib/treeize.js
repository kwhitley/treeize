var util        = require('util');
var _           = require('lodash');
var inflection  = require('inflection');

function Treeize(options) {
  this.data = {
    signature: {
      nodes: [],
    },
    seed: [],
    tree: [],
  };

  this._options = {
    delimiter:    ':',
    data: {
      uniform:    true,
      prune:      true,
    },
    debug:        true,
  };

  this.stats = {
    time:     {
      total:  0,
      signatures: 0,
    },
    rows:     0,
    sources:  0,
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

Treeize.prototype.signature = function(row, auto) {
  if (!row) {
    return this.data.signature;
  }

  // start timer
  var t1 = (new Date()).getTime();
  this.data.signature.isFixed = auto !== true;

  var nodes         = this.data.signature.nodes = [];
  var isArray       = _.isArray(row);

  _.each(row, function(value, key) {
    // set up attribute
    var attr        = {}

    attr.key        = typeof key === 'number' ? key : key.replace(/[\*\+\-]/gi,'');
    attr.fullPath   = isArray ? value : key;
    attr.split      = attr.fullPath.split(this.options().delimiter);
    attr.path       = _.initial(attr.split).join(this.options().delimiter).replace(/[\*\+\-]/gi,'');
    attr.parent     = _.initial(attr.split, 2).join(this.options().delimiter).replace(/[\*\+\-]/gi,'');
    attr.node       = attr.split[attr.split.length - 2];
    attr.attr       = _.last(attr.split);

    if (attr.attr.match(/\*/gi)) {
      attr.attr = attr.attr.replace(/[\*]/gi,'');
      attr.pk = true;
    }

    if (attr.pk) {
      console.log('primary key detected in node "' + attr.attr + '"');
    }

    // set up node reference
    var node        = _.findWhere(nodes, { path: attr.path });
    if (!node) {
      node = { path: attr.path, attributes: [], blueprint: [] };
      nodes.push(node);
    }

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
      console.log('adding node to blueprint');
      node.flags = true;
      node.blueprint.push({ name: attr.attr, key: attr.key });
    }
  }, this);

  // backfill blueprint when not specifically defined
  _.each(nodes, function(node) {
    if (!node.blueprint.length) {
      node.blueprint = node.attributes;
    }
  });

  nodes.sort(function(a, b) { return a.depth < b.depth ? -1 : 1; });

  // end timer and add time
  var t2 = ((new Date()).getTime() - t1);
  this.stats.time.signatures += t2;
  this.stats.time.total += t2;

  return this;
};


Treeize.prototype.grow = function(data, options) {
  var opt = _.extend(this.options(), options || {});

  this.debug('OPTIONS>', opt);

  // locate existing signature (when sharing signatures between data sources)
  var signature = this.signature();

  if (!signature.nodes.length) {
    // set signature from first row
    signature = this.signature(data[0], true).signature();

    // remove header row in flat array data (avoids processing headers as actual values)
    if (_.isArray(data[0])) {
      data.shift();
    }
  }

  console.log('SIGNATURE>', util.inspect(this.signature(), false, null));

  this.stats.sources++;
  var t1 = (new Date()).getTime();

  _.each(data, function(row) {
    var trails = {}; // LUT for trails (find parent of new node in trails path)
    var trail = root = this.data.tree;
    var t = null;

    if (!opt.data.uniform) {
      // get signature from each row
      this.signature(row, true);
      console.log('SIGNATURE>', util.inspect(this.signature(), false, null));
    }

    this.stats.rows++;

    if (_.where(this.signature().nodes, { flags: true }).length) {
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

    _.each(this.signature().nodes, function(node) {
      this.debug('PROCESSING NODE>', node);
      var blueprint = {};
      var blueprintExtended = {};

      // create blueprint for locating existing nodes
      _.each(node.blueprint, function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute.name;
        blueprint[attribute.name] = row[attribute.key];
      }, this);

      // create full node signature for insertion/updating
      _.each(node.attributes, function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute.name;
        var value = row[attribute.key];

        // insert extended blueprint attributes when not empty (or not pruning)
        if (!opt.data.prune || (value !== null && value !== undefined)) {
          blueprintExtended[attribute.name] = row[attribute.key];
        }
      }, this);

      this.debug('EXTENDED BLUEPRINT>', blueprintExtended);
      this.debug('BLUEPRINT>', blueprint);

      // ONLY INSERT IF NOT PRUNED
      if (!opt.data.prune || !_.isEmpty(blueprintExtended)) {
        // ROOT CASE
        if (!(trail = trails[node.parent])) {
          this.debug('PARENT TRAIL NOT FOUND (ROOT?)');
          if (!(trail = _.findWhere(root, blueprint))) {
            root.push(trail = blueprintExtended);
          } else {
            _.extend(trail, blueprintExtended);
          }
          trails[node.path] = trail;
        } else {
          // NOT ROOT CASE
          if (node.isCollection) {
            // handle collection nodes
            if (!trail[node.name]) {
              // node attribute doesnt exist, create array with fresh blueprint
              trail[node.name] = [blueprintExtended];
              trails[node.path] = blueprintExtended;
            } else {
              // node attribute exists, find or inject blueprint
              var t;
              if (!(t = _.findWhere(trail[node.name], blueprint))) {
                trail[node.name].push(trail = blueprintExtended);
              } else {
                _.extend(t, blueprintExtended);
              }
              trails[node.path] = t || trail;
            }
          } else {
            // handle non-collection nodes
            if (!trail[node.name]) {
              // node attribute doesnt exist, create object
              trail[node.name] = blueprintExtended;
              trails[node.path] = blueprintExtended;
            } else {
              // node attribute exists, set path for next pass
              // TODO: extend trail??
              trails[node.path] = trail[node.path];
            }
          }
        }
        // END PRUNE PASS
      }
    }, this);
  }, this);

  var t2 = ((new Date()).getTime() - t1);
  this.stats.time.total += t2;

  // clear signature between growth sets - TODO: consider leaving this wipe pass off if processing multiple identical sources (add)
  if (!signature.isFixed) {
    this.signature([]);
  }

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

module.exports = Treeize;
