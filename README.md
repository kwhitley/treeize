# Treeize v2.0.0

[![Build Status via Travis CI](https://travis-ci.org/kwhitley/treeize.svg?branch=feature%2Fmulti-format)](https://travis-ci.org/kwhitley/treeize)

Converts row data (in JSON/associative array format or flat array format) to object/tree structure based on simple column naming conventions.

## Why?

Because APIs usually require data in a deep object graph/collection form, but SQL results, excel, csv, and other flat data sources that we're often forced to drive our applications from represent data in a very "flat" way.  Treeize takes this flattened data and based on simple column/attribute naming conventions, remaps it into a deep object graph - all without the overhead/hassle of a traditional ORM.

## Installation

```
npm install treeize
```

## Quick Example

```js

var Treeize = require('treeize');

// data sources may be arrays of flat associative (key/value)
// objects or flat array of array data (usually with header row
// as first row)

var dataSource1 = require('./data/source1.js');
var dataSource2 = require('./data/source2.js');

var tree = new Treeize();

tree
  .setOptions({ input: { delimiter: '|' } }) // default delimiter is ':'
  .grow(dataSource1)
  .grow(dataSource2)
;

// get/print current deep data from Treeize instantiation
console.log(tree.getData());

// optional display of data using in built-in toString functions
console.log(tree + '');

```

#### Path Naming

Each column/attribute of each row will dictate its own destination path
using the following format:

```js
{
  "[path1]:[path2]:[pathX]:[attributeName]": [value]
}
```

Each "path" (up to n-levels deep) is optional and represents a single object node if the word is singular, or a collection if the word is plural (with optional +/- override modifiers).  For example, a "favoriteMovie:name" path will add a "favoriteMovie" object to its path - where "favoriteMovies:name" would add a collection of movies (complete with a first entry) instead.  For root nodes, include only the attribute name without any preceding paths.  If you were creating a final output of a book collection for instance, the title of the book would likely be pathless as you would want the value on the high-level collection `book` object.

It's important to note that each row will create or find its path within the newly transformed output being created.  Your flat feed may have mass-duplication, but the results will not.

---

## API Index

##### 1. get/set options (optional)

- [`options([options])`](#options) - getter/setter for options
- [`setOptions(options)`](#setOptions) - merges new `[options]` with existing
- [`resetOptions()`](#resetOptions) - resets options to defaults

##### 2a. set data signature manually if needed (optional)

- [`signature([row], [options])`](#signature) - getter/setter for signature definitions
- [`setSignature(row, [options])`](#setSignature) - sets signature using a specific row of data/headers (preserves signature between data sets if uniformity option is enabled)
- [`clearSignature([row], [options])`](#clearSignature) - clear signature between data sets (only needed when previously defined a uniform signature via `setSignature`)

##### 2b. grow tree from data set(s)

- [`grow(data, [options])`](#grow) - grow flat `data`, with optional local `[options]`

##### 3. retrieve transformed data

- [`getData()`](#getData) - gets current tree data

##### * misc/internal methods

- [`getOptions()`](#getOptions) - returns options
- [`getSignature()`](#getSignature) - returns currently defined signature
- [`getStats()`](#getStats) - returns object with growth statistics
- [`toString()`](#toString) - uses `util` to return data in visually formatted object graph

---

# API

### .setOptions([options])<a name="options" /><a name="setOptions" />

Sets options globally for the Treeize instance.  Default options are as follows:

```js
{
  input: {
    delimiter:          ':',    // delimiter between path segments, defaults to ':'
    detectCollections:  true,   // when true, plural path segments become collections
    uniformRows:        false,  // set to true if each row has identical signatures
  },
  output: {
    prune:              true,   // remove blank/null values and empty nodes
    objectOverwrite:    true,   // incoming objects will overwrite placeholder ids
    resultsAsObject:    false,  // root structure defaults to array (instead of object)
  },
  log:                  false,  // enable logging
}
```

For example, to change the delimiter and enable output logging, you would use the following:

```js
.setOptions({ log: true, input: { delimiter: '|' }});
```

#### Available Options

`input.delimiter`
This sets the delimiter to be used between path segments (e.g. the ":" in "children:mother:name").
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L51-58)

`input.detectCollections`
Enables/disables the default behavior of turning plural path segments (e.g. "subjects" vs. "subject") into collections instead of object paths.  **Note:** In order to properly merge multiple rows into the same collection item, the collection must have a base-level attribute(s) acting as a signature.
[View test example (enabled)](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L79-86) | [or (disabled)](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L92-99)

`input.uniformRows`
By default row uniformity is disabled to allow the most flexible data merging.  This means each and every row of data that is processed (unless flat array-of-array data) will be analyzed and mapped individually into the final structure.  If your data rows have uniform attributes/columns, disable this for a performance increase.

`output.prune`
Removes blank/empty nodes in the structure.  This is enabled by default to prevent sparse data sets from injecting blanks and nulls everywhere in your final output.  If nulls are important to preserve, disable this.
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L207-240)

`output.objectOverwrite`
To allow for merging objects directly onto existing placeholder values (e.g. foreign key ids), this is enabled by default.
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L159-203)

`output.resultsAsObject`
This creates a single root object (instead of the default array of objects).
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L245-278)

`log`
Setting to true enables traversal information to be logged to console during growth process.




Applies the function `iterator` to each item in `arr`, in parallel.
The `iterator` is called with an item from the list, and a callback for when it
has finished. If the `iterator` passes an error to its `callback`, the main
`callback` (for the `each` function) is immediately called with the error.

Note, that since this function applies `iterator` to each item in parallel,
there is no guarantee that the iterator functions will complete in order.

__Arguments__

* `arr` - An array to iterate over.
* `iterator(item, callback)` - A function to apply to each item in `arr`.
  The iterator is passed a `callback(err)` which must be called once it has
  completed. If no error has occurred, the `callback` should be run without
  arguments or with an explicit `null` argument.
* `callback(err)` - A callback which is called when all `iterator` functions
  have finished, or an error occurs.







#### Configuration (first value is default)

```js

treeize.options([options]); // universal getter/setter for options.  Returns self.

// default options are as follows:

{
  delimiter:        ':',          // Path delimiter, as in "foo:bar:baz"
  benchmark: {
    speed:          false,        // Enable/Disable performance logging
    size:           false         // Enable/Disable compression logging
  },
  fast:             false,        // Enable/Disable Fast Mode (see below)
  prune:            false,        // Enable/Disable empty/null pruning (see below)
  collections: {
    auto:           true          // Defaults to pluralized detection for collections.
                                  // Setting to false requires + operators for
                                  // every collection.
  }
}
```



##### How to manually override the default pluralization scheme for collection-detection

In the rare (but possible) case that plural/singular node names are not enough to properly
detect collections, you may add specific overrides to the node name, using the `+` and `-`
indicators.

```js
{
  "name":                 "Bird",
  "attributes:legs":      2,
  "attributes:hasWings":  true
}

// would naturally return

[
  {
    name: "Bird",
    attributes: [
      {
        legs: 2,
        hasWings: true
      }
    ]
  }
]

// to tell treeize that the node (detected as a plural collection)
// is NOT a collection, add a - to the path

{
  "name":                 "Bird",
  "attributes-:legs":      2,
  "attributes-:hasWings":  true
}

// results in

[
  {
    name: "Bird",
    attributes: {
      legs: 2,
      hasWings: true
    }
  }
]

// conversely, add a + to a path to force it into a collection

```


##### Pathing example

```js
{
  "title": "Ender's Game",                      // creates the first object with a title attribute of "Ender's Game"
  "author:name": "Orson Scott Card",            // adds an author object (with name) to the book "Ender's Game" (created above)
  "author:age":  21,                            // gives the author object an age attribute
  "author:otherBooks:title": "Ender's Shadow",  // adds a collection named "otherBooks" to the author, with a first object of "title": "Ender's Shadow"
}

// creates the following...

[
  {
    title: "Ender's Game",
    author: {
      name: "Orson Scott Card",
      age: 21,
      otherBooks: [
        { title: "Ender's Shadow" }
      ]
    }
  }
]
```

### Notes

- The column/attribute order is not important.  All attributes are sorted by depth before mapping.  This ensures parent nodes exist before children nodes are created within.
- Each attribute name of the flat data must consist of the full path to its node & attribute, seperated by the delimiter.  `id` suggests an `id` attribute on a root element, whereas `name:first` implies a `first` attribute on a `name` object within a root element.
- To imply a collection in the path/attribute-name, use a plural name (e.g. "subjects" instead of "subject").  Otherwise, use a singular name for a singular object.
- Use a `:` delimiter (default) to seperate path nodes.  To change this, use the `treeize.set([options])` function.

### Fast Mode

Setting the option `{ fast: true }` enables Fast Mode.  In this mode, the column/attribute signature is
pulled from the first row and applied to all other rows.  This makes the algorithm about 30% faster for a large
data set by not having to fully analyze the pathing of each row.  Only use this when you are certain
each row contains identical column/attribute names.

_This is set to `false` by default for backwards compatibility, and to embrace more complicated
data sets (where the attributes may be different for each row)._

### Node Pruning

Setting the option `{ prune: true }` enables Pruning Mode, courtesy of [@EvanK](https://github.com/EvanK).  As he points out, complex joins
can often leave a slew of blank or nulled branches.  Enabling Prune Mode removes those, leaving only populated fields.
Big thanks for the complete PR (with tests)!

## Examples

In this short series of examples, we'll take a standard "join dump", originally keyed
(via attribute names) to organize by movie - and demonstrate how other organizations can
be easily derived from the same original feed... by simply modifying the column/attribute
names in the output.

#### Example 1

In this example, we'll take our dump (as if from a CSV or SQL result) - and name the keys to
group by movies (as if for an `/api/movies`).

```js
var treeize = require('treeize');

var movieDump = [
  {
    "title":             "The Prestige",
    "director":          "Christopher Nolan",
    "actors:name":       "Christian Bale",
    "actors:as":         "Alfred Borden"
  },
  {
    "title":             "The Prestige",
    "director":          "Christopher Nolan",
    "actors:name":       "Hugh Jackman",
    "actors:as":         "Robert Angier"
  },
  {
    "title":             "The Dark Knight Rises",
    "director":          "Christopher Nolan",
    "actors:name":       "Christian Bale",
    "actors:as":         "Bruce Wayne"
  },
  {
    "title":             "The Departed",
    "director":          "Martin Scorsese",
    "actors:name":       "Leonardo DiCaprio",
    "actors:as":         "Billy"
  },
  {
    "title":             "The Departed",
    "director":          "Martin Scorsese",
    "actors:name":       "Matt Damon",
    "actors:as":         "Colin Sullivan"
  }
];

var movies = treeize.grow(movieDump);

/*

  'movies' now contains the following:

  [
    {
      "director": "Christopher Nolan",
      "title": "The Prestige",
      "actors": [
        {
          "as": "Alfred Borden",
          "name": "Christian Bale"
        },
        {
          "as": "Robert Angier",
          "name": "Hugh Jackman"
        }
      ]
    },
    {
      "director": "Christopher Nolan",
      "title": "The Dark Knight Rises",
      "actors": [
        {
          "as": "Bruce Wayne",
          "name": "Christian Bale"
        }
      ]
    },
    {
      "director": "Martin Scorsese",
      "title": "The Departed",
      "actors": [
        {
          "as": "Billy",
          "name": "Leonardo DiCaprio"
        },
        {
          "as": "Colin Sullivan",
          "name": "Matt Damon"
        }
      ]
    }
  ]

*/
```

#### Example 2

Taking the same feed, but modifying the target paths through the attribute/column
names we can completely transform the data (as you would for another API endpoint,
for example).  This time we'll organize the data by actors, as you would for
and endpoint like `/api/actors`.

Notice the feed is left unchanged - only the attribute names have been modified to
define their new target path.  In this case, by changing the base node to the actor
name (instead of the movie name), we group everything by actor at a high level.

```js
var treeize = require('treeize');

var moviesDump = [
  {
    "movies:title":     "The Prestige",
    "movies:director":  "Christopher Nolan",
    "name":             "Christian Bale",
    "movies:as":        "Alfred Borden"
  },
  {
    "movies:title":     "The Prestige",
    "movies:director":  "Christopher Nolan",
    "name":             "Hugh Jackman",
    "movies:as":        "Robert Angier"
  },
  {
    "movies:title":     "The Dark Knight Rises",
    "movies:director":  "Christopher Nolan",
    "name":             "Christian Bale",
    "movies:as":        "Bruce Wayne"
  },
  {
    "movies:title":     "The Departed",
    "movies:director":  "Martin Scorsese",
    "name":             "Leonardo DiCaprio",
    "movies:as":        "Billy"
  },
  {
    "movies:title":     "The Departed",
    "movies:director":  "Martin Scorsese",
    "name":             "Matt Damon",
    "movies:as":        "Colin Sullivan"
  }
];

var actors = treeize.grow(movieDump);

/*

  'actors' now contains the following:

  [
    {
      "name": "Christian Bale",
      "movies": [
        {
          "as": "Alfred Borden",
          "director": "Christopher Nolan",
          "title": "The Prestige"
        },
        {
          "as": "Bruce Wayne",
          "director": "Christopher Nolan",
          "title": "The Dark Knight Rises"
        }
      ]
    },
    {
      "name": "Hugh Jackman",
      "movies": [
        {
          "as": "Robert Angier",
          "director": "Christopher Nolan",
          "title": "The Prestige"
        }
      ]
    },
    {
      "name": "Leonardo DiCaprio",
      "movies": [
        {
          "as": "Billy",
          "director": "Martin Scorsese",
          "title": "The Departed"
        }
      ]
    },
    {
      "name": "Matt Damon",
      "movies": [
        {
          "as": "Colin Sullivan",
          "director": "Martin Scorsese",
          "title": "The Departed"
        }
      ]
    }
  ]

*/
```
