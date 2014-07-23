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
    format:             {
      detect:           true
    },
    fast:               false,
    prune:              false,
    collections: {
      auto:             true,
    }
  };

  this.options = this.setOptions = function(options) {
    if (options) {
      _.extend(globalOptions, options);

      return this;
    } else {
      return _.cloneDeep(globalOptions);
    }
  };

  this.removeFrom = function (object, key) {
    if (_.isArray(object)) {
      object.splice(key, 1);
    } else {
      delete object[key];
    }
  }

  this.grow = function(flatData, options) {
    var t1;
    options = _.extend(this.options(), options || {});

    var translated = options.appendTo || [];  // allows appending to previously grown results

    // optional benchmark
    if (options.benchmark.speed) {
      t1 = (new Date()).getTime();
    }

    if (!flatData || !flatData.length) {
      return translated;
    }

    // use original method when structure uncertain (slower)
    _.each(flatData, function(row, index) {
      var paths           = [];
      var trails          = {};
      var trail           = translated;
      var target          = null;

      // set up paths for processing
      _.each(row, function(value, attributePath) {
        console.log('processing path > ', attributePath, value);
        if (options.prune && (value === '' || _.isNull(value) || _.isUndefined(value) || (_.isObject(value) && _.isEmpty(value)))) {
          console.log('empty value "' + value + '" detected, skipping path injection...');

        } else {
          var splitPath = attributePath.split(options.delimiter);

          paths.push({
            splitPath:  _.initial(splitPath, 1),                          // ["a", "b", "c", "d"]
            fullPath:   _.initial(splitPath, 1).join(options.delimiter),  // "a:b:d"
            parentPath: _.initial(splitPath, 2).join(options.delimiter),  // "a:b"
            node:       splitPath[splitPath.length - 2],                  // "c"
            attribute:  _.last(splitPath),                                // "d"
            value:      value, // omit path injection if no value?
            processed:  false
          });
        }
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
        if (options.prune) { // roll this out to lessen iterations
          _.each(group, function(groupItem) {
            console.log('attempting to insert groupItem', groupItem);
            if (options.prune && (groupItem.value === '' || _.isNull(groupItem.value) || (_.isObject(groupItem.value) && _.isEmpty(groupItem.value)))) {
              console.log('not adding empty node "' + groupItem.attribute + '" to blueprint:', groupItem.value);
            } else {
              blueprint[groupItem.attribute] = groupItem.value;
            }
            groupItem.processed = true;
          });
        } else {
          _.each(group, function(groupItem) {
            blueprint[groupItem.attribute] = groupItem.value;
            groupItem.processed = true;
          });
        }

        console.log('BLUEPRINT:', blueprint);

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


    // output benchmark if enabled
    if (options.benchmark.speed) {
      console.log('[treeize]: translated ' + flatData.length + ' rows in ' + ((new Date()).getTime() - t1) + 'ms');
    }

    if (options.benchmark.size) {
      console.log('[treeize]: stringify size ' + Math.floor(JSON.stringify(flatData).length / 1024) + 'KB => ' + Math.floor(JSON.stringify(translated).length / 1024) + 'KB');
    }

    return translated;
  };
}

var treeize = module.exports = new Treeize();
