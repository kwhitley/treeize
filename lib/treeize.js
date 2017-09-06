var inflection  = require('inflection')
var merge       = require('object-merge')
var _           = require('lodash')

var isArray = function(item) {
  return _.isArray(item)
}

var isEmpty = function(item) {
  return !item || (typeof item === 'object' && !Object.keys(item).length)
}

var where = function(collection, props) {
  return collection.filter(item => {
    for (var attribute in props) {
      let value = props[attribute]

      if (item[attribute] !== value) {
        return false
      }
    }

    return true
  })
}

var findWhere = function(collection, props) {
  return _.find(collection, props)
}

function Treeize(options) {
  this.baseOptions = {
    input: {
      delimiter:          ':',
      detectCollections:  true,
      uniformRows:        false,
    },
    output: {
      prune:              true,
      objectOverwrite:    true,
      resultsAsObject:    false,
    },
    log:                  false,
  }

  this.data = {
    signature: {
      nodes: [],
      type: null,
    },
    seed: [],
    tree: [],
  }

  this.stats = {
    time:     {
      total:      0,
      signatures: 0,
    },
    rows:         0,
    sources:      0,
  }

  // set default options (below)
  this.resetOptions()

  if (options) {
    this.options(options)
  }

  return this
}

Treeize.prototype.log = function() {
  if (this._options.log) {
    console.log.apply(this, arguments)
  }

  return this
}

Treeize.prototype.getData = function() {
  return this.data.tree
}

Treeize.prototype.getSeedData = function() {
  return this.data.seed
}

Treeize.prototype.getStats = function() {
  return this.stats
}

/*
  Reads the signature from a given row to determine path mapping.  If passed without params, assumes
  a forced reading which will last
 */
Treeize.prototype.signature = function(row, options, auto) {
  if (!row) {
    return this.data.signature
  }

  // start timer
  var t1 = (new Date()).getTime()

  // sets the signature as fixed (or not) when manually set
  this.data.signature.isFixed = auto !== true

  var nodes         = this.data.signature.nodes = []
  var isRowAnArray  = isArray(row)
  var opt           = merge(this._options, options || {})

  this.data.signature.type = isArray ? 'array' : 'object'

  for (var key in row) {
    let value = row[key]
    var attr        = {}

    attr.key        = typeof key === 'number' ? key : key//.replace(/^[\*\-\+]|[\*\-\+]$/g,'')
    attr.fullPath   = isRowAnArray ? value : key
    attr.split      = attr.fullPath.split(opt.input.delimiter)
    attr.path       = attr.split.slice(0,attr.split.length-1).join(opt.input.delimiter)
    attr.parent     = attr.split.slice(0,attr.split.length-2).join(opt.input.delimiter)//.replace(/^[\*\-\+]|[\*\-\+]$/g,'')
    attr.node       = attr.split[attr.split.length - 2]
    attr.attr       = attr.split[attr.split.length - 1]

    if (attr.attr.match(/\*/gi)) {
      attr.attr = attr.attr.replace(/[\*]/gi,'')
      attr.pk = true
    }

    if (attr.pk) {
      this.log('primary key detected in node "' + attr.attr + '"')
    }

    // set up node reference
    var node = findWhere(nodes, { path: attr.path })
    if (!node) {
      node = { path: attr.path, attributes: [], blueprint: [] }
      nodes.push(node)
    }

    node.isCollection = !attr.node || (opt.input.detectCollections && inflection.pluralize(attr.node) === attr.node)

    var collectionFlag = attr.node && attr.node.match(/^[\-\+]|[\-\+]$/g)
    if (collectionFlag) {
      //this.log('collection flag "' + collectionFlag + '" detected in node "' + attr.node + '"')
      node.flags = true
      node.isCollection = attr.node.match(/^\+|\+$/g)
      attr.node = attr.node.replace(/^[\*\-\+]|[\*\-\+]$/g,'') // clean node
    }

    node.name         = attr.node
    node.depth        = attr.split.length - 1
    node.parent       = attr.split.slice(0, attr.split.length - 2).join(opt.input.delimiter)
    node.attributes.push({ name: attr.attr, key: attr.key })
    if (attr.pk) {
      //this.log('adding node to blueprint')
      node.flags = true
      node.blueprint.push({ name: attr.attr, key: attr.key })
    }
  }

  // backfill blueprint when not specifically defined
  nodes.forEach(function(node) {
    if (!node.blueprint.length) {
      node.blueprint = node.attributes
    }
  })

  nodes.sort(function(a, b) { return a.depth < b.depth ? -1 : 1 })

  // end timer and add time
  var t2 = ((new Date()).getTime() - t1)
  this.stats.time.signatures += t2
  this.stats.time.total += t2

  return this
}

Treeize.prototype.getSignature = function() {
  return this.signature()
}

Treeize.prototype.setSignature = function(row, options) {
  return this.signature(row, options)
}

Treeize.prototype.setSignatureAuto = function(row, options) {
  return this.signature(row, options, true)
}

Treeize.prototype.clearSignature = function() {
  this.data.signature = { nodes: [], type: null }
  this.data.signature.isFixed = false

  return this
}


Treeize.prototype.grow = function(data, options) {
  var opt = merge(this._options, options || {})
  // chain past if no data to grow
  if (typeof data !== 'object' || !data.length) {
    return this
  }

  //this.log('OPTIONS>', opt)

  // locate existing signature (when sharing signatures between data sources)
  var signature = this.getSignature()

  // set data uniformity (locally) to true to avoid signature fetching on data rows
  if (isArray(data[0])) {
    opt.input.uniformRows = true
  }

  if (!signature.nodes.length) {
    //this.log('setting signature from first row of data (auto)')
    // set signature from first row
    signature = this.setSignatureAuto(data[0], options).getSignature()

    // remove header row in flat array data (avoids processing headers as actual values)
    if (isArray(data[0])) {
      var originalData = data
      data = []

      // copy data without original signature row before processing
      originalData.forEach(function(row, index) {
        if (index > 0) {
          data.push(row)
        }
      })
    }
  }

  if (opt.output.resultsAsObject && isArray(this.data.tree)) {
    this.data.tree = {}
  }

  //this.log('SIGNATURE>', util.inspect(this.getSignature(), false, null))

  this.stats.sources++
  var t1 = (new Date()).getTime()

  data.forEach(function(row) {
    this.data.seed.push(row)
    var trails = {} // LUT for trails (find parent of new node in trails path)
    var trail = base = this.data.tree // OPTIMIZATION: do we need to reset this trail for each row?
    //this.log('CURRENT TRAIL STATUS>', trail)
    var t = null

    // set initial base object path for non-array datasets
    if (opt.output.resultsAsObject) {
      trails[''] = trail
    }

    if (!this.data.signature.isFixed && !opt.input.uniformRows) {
      //this.log('setting signature from new row of data (auto)')
      // get signature from each row
      this.setSignatureAuto(row, opt)
      //this.log('SIGNATURE>', util.inspect(this.getSignature(), false, null))
    }

    this.stats.rows++

    if (where(this.signature().nodes, { flags: true }).length) {
      // flags detected within signature, clean attributes of row
      for (var key in row) {
        let value = row[key]

        if (typeof key === 'string') {
          var clean = key.replace(/^[\*\-\+]|[\*\-\+]$/g,'')
          if (clean !== key) {
            //this.log('cleaning key "' + key + '" and embedding as "' + clean + '"')
            row[key.replace(/^[\*\-\+]|[\*\-\+]$/g,'')] = value // simply embed value at clean path (if not already)
          }
        }
      }
    }

    this.signature().nodes.forEach(function(node) {
      //this.log('PROCESSING NODE>', node)
      var blueprint = {}
      var blueprintExtended = {}

      // create blueprint for locating existing nodes
      node.blueprint.forEach(function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute.name
        blueprint[attribute.name] = row[attribute.key]
        //this.log('creating attribute "' + attribute.name + '" within blueprint', row[attribute.key])
      }, this)

      // create full node signature for insertion/updating
      node.attributes.forEach(function(attribute) {
        var key = (node.path ? (node.path + ':') : '') + attribute.name
        var value = row[attribute.key]

        // insert extended blueprint attributes when not empty (or not pruning)
        if (!opt.output.prune || (value !== null && value !== undefined)) {
          //this.log('creating attribute "' + attribute.name + '" within extended blueprint', row[attribute.key])
          blueprintExtended[attribute.name] = row[attribute.key]
        }
      }, this)

      //this.log('EXTENDED BLUEPRINT>', blueprintExtended)
      //this.log('BLUEPRINT>', blueprint)

      // ONLY INSERT IF NOT PRUNED
      if (!opt.output.prune || !isEmpty(blueprintExtended)) {
        // IF 0 DEPTH AND RESULTSASOBJECT, EXTEND base
        if (opt.output.resultsAsObject && node.depth === 0) {
          Object.assign(trails[node.path] = trail = base, blueprintExtended)
          //this.log('extending blueprint onto base>', trail)

        // IF base TRAIL IS NOT YET MAPPED
        } else if (node.isCollection && !(trail = trails[node.parent])) {
          //this.log('PARENT TRAIL NOT FOUND (base?)')
          // set up target node if doesn't exist
          if (!(trail = findWhere(base, blueprint))) {
            base.push(trail = blueprintExtended)
          } else {
            Object.assign(trail, blueprintExtended)
          }
          trails[node.path] = trail

        // NORMAL NODE TRAVERSAL
        } else {
          // NOT base CASE
          if (node.isCollection) {
            // handle collection nodes
            //this.log('inserting into collection node', trail)
            if (!trail[node.name]) {
              // node attribute doesnt exist, create array with fresh blueprint
              trail[node.name] = [blueprintExtended]
              trails[node.path] = blueprintExtended
            } else {
              // node attribute exists, find or inject blueprint
              var t
              if (!(t = findWhere(trail[node.name], blueprint))) {
                trail[node.name].push(trail = blueprintExtended)
              } else {
                Object.assign(t, blueprintExtended)
              }
              trails[node.path] = t || trail
            }
          } else {
            // handle non-collection nodes
            if (trail == base && node.parent === '') {
              base.push(trails[node.parent] = trail = {})
              //this.log('base insertion')
            }
            trail = trails[node.parent]

            // ON DEEP NODES, THE PARENT WILL BE TOO LONG AND FAIL ON THE NEXT IF STATEMENT BELOW
            // ASSUMPTION: in deep nodes, no signatures will be present, so entries will simply be pushed onto collections defined within

            if (!trail) { // do something to fix a broken trail (usually from too deep?)
              // backtrack from parent trail segments until trail found, then create creadcrumbs
              var breadcrumbs = []
              var segments = node.parent.split(':')
              var numSegments = segments.length
              var pathAttempt = node.parent
              var segmentsStripped = 0

              //this.log('path MISSING for location "' + pathAttempt + '"')
              while (!(trail = trails[pathAttempt])) {
                segmentsStripped++
                pathAttempt = segments.slice(0,numSegments-segmentsStripped).join(':')
                //this.log('..attempting path location for "' + pathAttempt + '"')

                //infinite loop kickout
                if (segmentsStripped > 15) break
              }
              //this.log('path FOUND for location for "' + pathAttempt + '" after removing ' + segmentsStripped + ' segments')

              // create stored nodes if they don't exist.
              segments.slice(numSegments - segmentsStripped).forEach(function(segment) {
                var isCollection = ((inflection.pluralize(segment) === segment) || segment.match(/^\+|\+$/)) && (!segment.match(/^\-|\-$/))
                // TODO: add modifier detection
                //this.log('creating or trailing path segment ' + (isCollection ? '[collection]' : '{object}') + ' "' + segment + '"')

                segment = segment.replace(/^[\*\-\+]|[\*\-\+]$/g,'')
                if (isCollection) {
                  // retrieve or set collection segment and push new trail onto it
                  (trail[segment] = trail[segment] || []).push(trail = {})
                } else {
                  trail = trail[segment] = trail[segment] || {}
                }
              })
            }

            //this.log('inserting into non-collection node')
            //if (!trail[node.name]) { // TODO: CONSIDER: add typeof check to this for possible overwriting
            if (!trail[node.name] || (opt.output.objectOverwrite && (typeof trail[node.name] !== typeof blueprintExtended))) {
              // node attribute doesnt exist, create object
              //this.log('create object')
              trail[node.name] = blueprintExtended
              trails[node.path] = blueprintExtended
            } else {
              // node attribute exists, set path for next pass
              // TODO: extend trail??
              //this.log('object at node "' + node.name + '" exists as "' + trail[node.name] + '", skipping insertion and adding trail')
              if (typeof trail[node.name] === 'object') {
                trail[node.name] = merge(trail[node.name], blueprintExtended)
              }
              //this.log('trail[node.name] updated to "' + trail[node.name])
              trails[node.path] = trail[node.path]
            }
          }
        }
        // END PRUNE PASS
      }
    }, this)
  }, this)

  var t2 = ((new Date()).getTime() - t1)
  this.stats.time.total += t2

  // clear signature between growth sets - TODO: consider leaving this wipe pass off if processing multiple identical sources (add)
  if (!signature.isFixed) {
    this.signature([])
  }

  return this
}

/*
  .[get|set]options (options)

  Get and sets global options.
 */

Treeize.prototype.options = function(options) {
  if (!options) {
    return merge({}, this._options)
  }

  this._options = merge(this._options, options)

  return this
}

Treeize.prototype.getOptions = function() {
  return this._options
}

Treeize.prototype.setOptions = function(options) {
  return this.options(options)
}

Treeize.prototype.resetOptions = function() {
  this._options = merge({}, this.baseOptions)

  return this
}

Treeize.prototype.toString = function treeToString() {
  return 'WARNING: .toString() method of Treeize is deprecated'
}

module.exports = Treeize
