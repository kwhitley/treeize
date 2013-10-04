var _           = require('lodash');
var inflection  = require('inflection');

function Treeize(options) {
  var globalOptions = {
    delimiter:          ':',
    debug:              false,
    benchmark:          {
      speed:            true,
      size:             true
    },
    fast:               false,
    collections: {
      auto:             true,
    }
  };

  this.options = this.setOptions = function(options) {
    if (options) {
      _.extend(globalOptions, options);

      return this;
    } else {
      return globalOptions;
    }
  };

  this.getSignatures = function(row, options) {
    var paths         = [];
    var signatures    = [];
    var localOptions  = globalOptions;
    var target        = null;

    _.each(row, function(value, attributePath) {
      var splitPath = attributePath.split(localOptions.delimiter);

      paths.push({
        path:       attributePath,
        splitPath:  splitPath,
        node:       splitPath[splitPath.length - 2],
        processed:  false
      });
    });

    // sort paths to prepare for processing
    paths.sort(function(a, b) {
      return a.splitPath.length < b.splitPath.length ? -1 : 1;
    });

    while (target = _.findWhere(paths, { processed: false })) {
      // get associated group
      var group = _.where(paths, { node: target.node, processed: false });

      // build blueprint for current group
      var blueprint = [];
      _.each(group, function(groupItem) {
        blueprint.push(groupItem.path);
        groupItem.processed = true;
      });

      signatures.push(blueprint);
    }

    return signatures;
  }

  this.grow = function(flatData, config) {
    var t1;
    var localOptions  = _.extend(this.options(), config || {});
    var translated    = [];

    // optional benchmark
    if (localOptions.benchmark.speed) {
      t1 = (new Date()).getTime();
    }

    if (!flatData || !flatData.length) { return flatData; }

    if (localOptions.fast) {
      var signatures = this.getSignatures(flatData[0]);

      _.each(flatData, function(row, index) {
        var paths           = [];
        var trails          = {};
        var trail           = translated;
        var target          = null;

        // set up paths for processing
        _.each(row, function(value, attributePath) {
          var splitPath = attributePath.split(localOptions.delimiter);

          paths[attributePath] = {
            fullPath:   _.initial(splitPath, 1).join(localOptions.delimiter),
            parentPath: _.initial(splitPath, 2).join(localOptions.delimiter),
            node:       splitPath[splitPath.length - 2],
            attribute:  _.last(splitPath),
            value:      value
          };
        });

        // proccess each unprocessed path in the row
        _.each(signatures, function(signature) {
          // set target to first node of group
          var target  = paths[signature[0]];

          // build blueprint for current group
          var blueprint = {};
          _.each(signature, function(item) {
            blueprint[paths[item].attribute] = paths[item].value;
          });

          // set up first node, everythign else should have parent path
          if (!(trail = trails[target.parentPath])) {
            if (!(trail = _.findWhere(translated, blueprint))) {
              translated.push(trail = blueprint);
            }
            trails[target.parentPath] = trail;
          }

          // trail is now at parent node, standing by for current node injection
          if (target.node) { // should skip root
            var isCollection;

            // if collection auto detection is on, default to pluralization
            isCollection = globalOptions.collections.auto && target.node === inflection.pluralize(target.node);

            // manual overrides work both with and without collection auto detection
            // [nodename]- indicates non collection
            // [nodename]+ indicates collection
            if (target.node.match(/[\+\-]$/)) {
              isCollection = target.node.match(/\+$/) || isCollection;
              isCollection = isCollection && !target.node.match(/\-$/);

              target.node = target.node.replace(/[\+\-]$/, '');
            }

            var node = trail[target.node] = (trail[target.node] || (isCollection ? [blueprint] : blueprint));

            if (isCollection && !(node = _.findWhere(trail[target.node], blueprint))) {
              node = blueprint;
              trail[target.node].push(node);
            }

            trails[target.fullPath] = node;
          }
        });
      });
    } else {
      // use original method when structure uncertain (slower)

      _.each(flatData, function(row, index) {
        var paths           = [];
        var trails          = {};
        var trail           = translated;
        var target          = null;

        // set up paths for processing
        _.each(row, function(value, attributePath) {
          var splitPath = attributePath.split(localOptions.delimiter);

          paths.push({
            splitPath:  _.initial(splitPath, 1),
            fullPath:   _.initial(splitPath, 1).join(localOptions.delimiter),
            parentPath: _.initial(splitPath, 2).join(localOptions.delimiter),
            node:       splitPath[splitPath.length - 2],
            attribute:  _.last(splitPath),
            value:      value,
            processed:  false
          });
        });

        // sort paths to prepare for processing
        paths.sort(function(a, b) {
          return a.splitPath.length < b.splitPath.length ? -1 : 1;
        });

        // proccess each unprocessed path in the row
        while (target = _.findWhere(paths, { processed: false })) {
          // get associated group
          var group = _.where(paths, { parentPath: target.parentPath, node: target.node, processed: false });

          // build blueprint for current group
          var blueprint = {};
          _.each(group, function(groupItem) {
            blueprint[groupItem.attribute] = groupItem.value;
            groupItem.processed = true;
          });

          // set up first node, everythign else should have parent path
          if (!(trail = trails[target.parentPath])) {
            if (!(trail = _.findWhere(translated, blueprint))) {
              translated.push(trail = blueprint);
            }
            trails[target.parentPath] = trail;
          }

          // trail is now at parent node, standing by for current node injection
          if (target.node) { // should skip root
            var isCollection;

            // if collection auto detection is on, default to pluralization
            isCollection = globalOptions.collections.auto && target.node === inflection.pluralize(target.node);

            // manual overrides work both with and without collection auto detection
            // [nodename]- indicates non collection
            // [nodename]+ indicates collection
            if (target.node.match(/[\+\-]$/)) {
              isCollection = target.node.match(/\+$/) || isCollection;
              isCollection = isCollection && !target.node.match(/\-$/);

              target.node = target.node.replace(/[\+\-]$/, '');
            }

            var node = trail[target.node] = (trail[target.node] || (isCollection ? [blueprint] : blueprint));

            if (isCollection && !(node = _.findWhere(trail[target.node], blueprint))) {
              node = blueprint;
              trail[target.node].push(node);
            }

            trails[target.fullPath] = node;
          }
        }
      });
    }

    // output benchmark if enabled
    if (localOptions.benchmark.speed) {
      console.log('[treeize]: translated ' + flatData.length + ' rows in ' + ((new Date()).getTime() - t1) + 'ms');
    }

    if (localOptions.benchmark.size) {
      console.log('[treeize]: stringify size ' + Math.floor(JSON.stringify(flatData).length / 1024) + 'KB => ' + Math.floor(JSON.stringify(translated).length / 1024) + 'KB');
    }

    return translated;
  };
}

var treeize = module.exports = new Treeize();
