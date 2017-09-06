# Treeize.js

[![Build Status via Travis CI](https://travis-ci.org/kwhitley/treeize.svg)](https://travis-ci.org/kwhitley/treeize)

Converts row data (in JSON/associative array format or flat array format) to object/tree structure based on simple column naming conventions.

## Installation

```
npm install treeize
```

## Why?

Because APIs usually require data in a deep object graph/collection form, but SQL results (especially heavily joined data), excel, csv, and other flat data sources that we're often forced to drive our applications from represent data in a very "flat" way.  Treeize takes this flattened data and based on simple column/attribute naming conventions, remaps it into a deep object graph - all without the overhead/hassle of hydrating a traditional ORM.

#### What it does...

```js
// Treeize turns flat associative data (as from SQL queries) like this:
var peopleData = [
  {
    'name': 'John Doe',
    'age': 34,
    'pets:name': 'Rex',
    'pets:type': 'dog',
    'pets:toys:type': 'bone'
  },
  {
    'name': 'John Doe',
    'age': 34,
    'pets:name': 'Rex',
    'pets:type': 'dog',
    'pets:toys:type': 'ball'
  },
  {
    'name': 'Mary Jane',
    'age': 19,
    'pets:name': 'Mittens',
    'pets:type': 'kitten',
    'pets:toys:type': 'yarn'
  },
  {
    'name': 'Mary Jane',
    'age': 19,
    'pets:name': 'Fluffy',
    'pets:type': 'cat'
  }
];


// ...or flat array-of-values data (as from CSV/excel) like this:
var peopleData = [
  ['name', 'age', 'pets:name', 'pets:type', 'pets:toys:type'], // header row
  ['John Doe', 34, 'Rex', 'dog', 'bone'],
  ['John Doe', 34, 'Rex', 'dog', 'ball'],
  ['Mary Jane', 19, 'Mittens', 'kitten', 'yarn'],
  ['Mary Jane', 19, 'Fluffy', 'cat', null]
];


// ...via a dead-simple implementation:
var Treeize   = require('treeize');
var people    = new Treeize();

people.grow(peopleData);


// ...into deep API-ready object graphs like this:
people.getData() == [
  {
    name: 'John Doe',
    age: 34,
    pets: [
      {
        name: 'Rex',
        type: 'dog',
        toys: [
          { type: 'bone' },
          { type: 'ball' }
        ]
      }
    ]
  },
  {
    name: 'Mary Jane',
    age: 19,
    pets: [
      {
        name: 'Mittens',
        type: 'kitten',
        toys: [
          { type: 'yarn' }
        ]
      },
      {
        name: 'Fluffy',
        type: 'cat'
      }
    ]
  }
];
```


# API Index

##### 1. get/set options (optional)

- [`options([options])`](#options) - getter/setter for options
- [`getOptions()`](#getOptions) - returns options
- [`setOptions(options)`](#setOptions) - merges new `[options]` with existing
- [`resetOptions()`](#resetOptions) - resets options to defaults

##### 2a. set data signature manually if needed (optional)

- [`signature([row], [options])`](#signature) - getter/setter for signature definitions
- [`getSignature()`](#getSignature) - returns currently defined signature
- [`setSignature(row, [options])`](#setSignature) - sets signature using a specific row of data/headers (preserves signature between data sets if uniformity option is enabled)
- [`clearSignature()`](#clearSignature) - clear signature between data sets (only needed when previously defined a uniform signature via `setSignature`)

##### 2b. grow tree from data set(s)

- [`grow(data, [options])`](#grow) - grow flat `data`, with optional local `[options]`

##### 3. retrieve transformed data

- [`getData()`](#getData) - gets current tree data
- [`getSeedData()`](#getSeedData) - gets original, flat data

##### * misc/internal methods

- [`getStats()`](#getStats) - returns object with growth statistics

# API

### .options([options])<a name="options" />

[Getter](#getOptions)/[Setter](#setOptions) for options.  If options object is passed, this is identical to [.setOptions(options)](#setOptions) and returns self (chainable).  If no options are passed, this is identical to [.getOptions()](#getOptions) and returns current options as object.


### .setOptions(options)<a name="setOptions" />

Sets options globally for the Treeize instance.  This is an alias for `.options(options)`. Default options are as follows:

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
  }
}
```

For example, to change the delimiter and enable output logging, you would use the following:

```js
.setOptions({ input: { delimiter: '|' }});
```

#### Available Options

`input.delimiter`<a name="optionsInputDelimiter" />
This sets the delimiter to be used between path segments (e.g. the ":" in "children:mother:name").
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L51-58)

`input.detectCollections`<a name="optionsInputDetectCollections" />
Enables/disables the default behavior of turning plural path segments (e.g. "subjects" vs. "subject") into collections instead of object paths.  **Note:** In order to properly merge multiple rows into the same collection item, the collection must have a base-level attribute(s) acting as a signature.
[View test example (enabled)](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L79-86) | [or (disabled)](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L92-99)

`input.uniformRows`<a name="optionsInputUniformRows" />
By default row uniformity is disabled to allow the most flexible data merging.  This means each and every row of data that is processed (unless flat array-of-array data) will be analyzed and mapped individually into the final structure.  If your data rows have uniform attributes/columns, disable this for a performance increase.

`output.prune`<a name="optionsOutputPrune" />
Removes blank/empty nodes in the structure.  This is enabled by default to prevent sparse data sets from injecting blanks and nulls everywhere in your final output.  If nulls are important to preserve, disable this.
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L207-240)

`output.objectOverwrite`<a name="optionsOutputObjectOverwrite" />
To allow for merging objects directly onto existing placeholder values (e.g. foreign key ids), this is enabled by default.
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L159-203)

`output.resultsAsObject`<a name="optionsOutputResultsAsObject" />
This creates a single root object (instead of the default array of objects).
[View test example](https://github.com/kwhitley/treeize/blob/feature/multi-format/test/test.js#L245-278)

### .getOptions()<a name="getOptions" />

Returns the current global options (as object).
[View example format](#setOptions)


### .resetOptions(options)<a name="resetOptions" />

Resets all global options to [original defaults](#setOptions) and returns self (chainable).

### .signature([row], [options])<a name="signature" />

[Getter](#getSignature)/[Setter](#setSignature) for row signatures.  If options object is passed, this is identical to [.setSignature(options)](#setSignature) and returns self (chainable).  If no options are passed, this is identical to [.getSignature()](#getSignature) and returns currently defined signature as object.


### .setSignature(row, [options])<a name="setSignature" />

Manually defines the signature for upcoming data sets from argument `row`, with optional `options`.  The row may be either in object (key/value) form or flat array form (array of paths). This method is only required if sharing a single signature across multiple data sources (when merging homogeneous data sets), or when the data itself has no header information (for instance, with bulk flat array-of-values data).  Returns self (chainable).

```js
// May be set from a single row of associative data
.setSignature({
  'id': 1,
  'name:first': 'Kevin',
  'name:last': 'Whitley',
  'hobbies:name': 'photography'
  'hobbies:years': 12
})

// Or from header row of flat array data
.setSignature(['id', 'name:first', 'name:last', 'hobbies:name', 'hobbies:years'])
```

### .getSignature()<a name="getSignature" />

Returns currently defined signature. _For internal use only._

### .clearSignature()<a name="clearSignature" />

Clears currently-defined signature if previously set via [`setSignature(row)`](#setSignature), and returns self (chainable).  This is only required between data sets if signature auto-detection should be re-enabled.  It is unlikely that you will need to use this.

### .getData()<a name="getData" />

Returns current data tree.

```js
var tree = new Treeize();

tree.grow([
  { 'foo': 'bar', 'logs:a': 1 },
  { 'foo': 'bar', 'logs:a': 2 },
  { 'foo': 'baz', 'logs:a': 3 },
]);

console.log(tree.getData());

/*
[
  { foo: 'bar', logs: [{ a: 1 }, { a: 2 }] },
  { foo: 'baz', logs: [{ a: 3 }]}
]
*/
```

### .getSeedData()<a name="getSeedData" />

Returns original, flat data.

```js
var tree = new Treeize();

tree.grow([
  { 'foo': 'bar', 'logs:a': 1 },
  { 'foo': 'bar', 'logs:a': 2 },
  { 'foo': 'baz', 'logs:a': 3 }
]);

console.log(tree.getSeedData());

/*
[
  { 'foo': 'bar', 'logs:a': 1 },
  { 'foo': 'bar', 'logs:a': 2 },
  { 'foo': 'baz', 'logs:a': 3 }
]
*/
```

### .getStats()<a name="getStats" />

Returns current growth statistics (e.g. number of sources process, number of rows, etc). _Output and format subject to change - use at your own risk._

---

### .grow(data, [options])<a name="grow" />

The `grow(data, [options])` method provides the core functionality of Treeize.  This method expands flat data (of one or more sources) into the final deep tree output.  Each attribute path is analyzed for injection into the final object graph.

#### Path Naming

Each column/attribute of each row will dictate its own destination path
using the following format:

```js
{
  'path1:path2:pathX:attributeName': [value]
}
```

Each "path" (up to n-levels deep) is optional and represents a single object node if the word is singular, or a collection if the word is plural (with optional +/- override modifiers).  For example, a "favoriteMovie:name" path will add a "favoriteMovie" object to its path - where "favoriteMovies:name" would add a collection of movies (complete with a first entry) instead.  For root nodes, include only the attribute name without any preceding paths.  If you were creating a final output of a book collection for instance, the title of the book would likely be pathless as you would want the value on the high-level `books` collection.

It's important to note that each row will create or find its path within the newly transformed output being created.  Your flat feed may have mass-duplication, but the results will not.

##### Merging Multiple Data Sources

Treeize was designed to merge from multiple data sources of both attribute-value and array-of-value format (as long as signatures are provided in some manner), including ones with varying signatures.

```js
var Treeize         = require('treeize');
var arrayOfObjects  = require('somesource1.js');
var arrayOfValues   = require('somesource2.js');

var tree = new Treeize();

tree
  .grow(arrayOfObjects)
  .grow(arrayOfValues) // assumes header row as first row
;

// tree.getData() == final merged results
```

##### How to manually override the default pluralization scheme for collection-detection

In the rare (but possible) case that plural/singular node names are not enough to properly detect collections, you may add specific overrides to the node name, using the `+` (for collections) and `-` (for singular objects) indicators.

```js
{
  'name':                 'Bird',
  'attributes:legs':      2,
  'attributes:hasWings':  true
}

// would naturally return

[
  {
    name: 'Bird',
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
  'name':                 'Bird',
  'attributes-:legs':      2,
  'attributes-:hasWings':  true
}

// results in

[
  {
    name: 'Bird',
    attributes: {
      legs: 2,
      hasWings: true
    }
  }
]

// conversely, add a + to a path to force it into a collection

```

##### Specifying Your Own Key/Blueprint For Collections

By default, all known attributes of a collection node level define a "blueprint" by which to match future rows.  For example, in a collection of people, if both `name` and `age` attributes are defined within each row, future rows will require both the `name` and `age` values to match for the additional information to be merged into that record.  To override this default behavior and specify your own criteria, simply _mark each required attribute with a leading or tailing `*` modifier._

```js
[
  {
    'date': '1/1/2014',
    'temperatureF': 90,
    'temperatureC': 32
  },
  {
    'date': '1/1/2014',
    'humidity': .1
  }
]

// ...would normally grow into:
[
  {
    date: '1/1/2014',
    temperatureF: 90,
    temperatureC: 32
  },
  {
    date: '1/1/2014',
    humidity: 0.1
  }
]

// ...but by specifying only the "date" attribute as the blueprint/key
[
  {
    'date*': '1/1/2014',
    'temperatureF': 90,
    'temperatureC': 32
  },
  {
    'date*': '1/1/2014',
    'humidity': .1
  }
]

// ...the data merges appropriately
[
  {
    date: '1/1/2014',
    temperatureF: 90,
    temperatureC: 32,
    humidity: 0.1
  }
]
```

### Notes

- Each attribute name of the flat data must consist of the full path to its node & attribute, seperated by the delimiter.  `id` suggests an `id` attribute on a root element, whereas `name:first` implies a `first` attribute on a `name` object within a root element.
- To imply a collection in the path/attribute-name, use a plural name (e.g. "subjects" instead of "subject").  Otherwise, use a singular name for a singular object.
- Use a `:` delimiter (default) to seperate path segments.  To change this, modify the [`input.delimiter`](#optionsInputDelimiter) option.

---

# Examples

In this short series of examples, we'll take a standard "join dump", originally keyed
(via attribute names) to organize by movie - and demonstrate how other organizations can
be easily derived from the same original feed... by simply modifying the column/attribute
names in the output.

#### Example 1

In this example, we'll take our dump (as if from a CSV or SQL result) - and name the keys to
group by movies (as if for an `/api/movies`).

```js
var movieData = [
  {
    'title':             'The Prestige',
    'director':          'Christopher Nolan',
    'actors:name':       'Christian Bale',
    'actors:as':         'Alfred Borden'
  },
  {
    'title':             'The Prestige',
    'director':          'Christopher Nolan',
    'actors:name':       'Hugh Jackman',
    'actors:as':         'Robert Angier'
  },
  {
    'title':             'The Dark Knight Rises',
    'director':          'Christopher Nolan',
    'actors:name':       'Christian Bale',
    'actors:as':         'Bruce Wayne'
  },
  {
    'title':             'The Departed',
    'director':          'Martin Scorsese',
    'actors:name':       'Leonardo DiCaprio',
    'actors:as':         'Billy'
  },
  {
    'title':             'The Departed',
    'director':          'Martin Scorsese',
    'actors:name':       'Matt Damon',
    'actors:as':         'Colin Sullivan'
  }
];

var Treeize = require('treeize');
var movies  = new Treeize();

movies.grow(movieData);

/*

  'movies.getData()' now results in the following:

  [
    {
      'director': 'Christopher Nolan',
      'title': 'The Prestige',
      'actors': [
        {
          'as': 'Alfred Borden',
          'name': 'Christian Bale'
        },
        {
          'as': 'Robert Angier',
          'name': 'Hugh Jackman'
        }
      ]
    },
    {
      'director': 'Christopher Nolan',
      'title': 'The Dark Knight Rises',
      'actors': [
        {
          'as': 'Bruce Wayne',
          'name': 'Christian Bale'
        }
      ]
    },
    {
      'director': 'Martin Scorsese',
      'title': 'The Departed',
      'actors': [
        {
          'as': 'Billy',
          'name': 'Leonardo DiCaprio'
        },
        {
          'as': 'Colin Sullivan',
          'name': 'Matt Damon'
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
var moviesDump = [
  {
    'movies:title':     'The Prestige',
    'movies:director':  'Christopher Nolan',
    'name':             'Christian Bale',
    'movies:as':        'Alfred Borden'
  },
  {
    'movies:title':     'The Prestige',
    'movies:director':  'Christopher Nolan',
    'name':             'Hugh Jackman',
    'movies:as':        'Robert Angier'
  },
  {
    'movies:title':     'The Dark Knight Rises',
    'movies:director':  'Christopher Nolan',
    'name':             'Christian Bale',
    'movies:as':        'Bruce Wayne'
  },
  {
    'movies:title':     'The Departed',
    'movies:director':  'Martin Scorsese',
    'name':             'Leonardo DiCaprio',
    'movies:as':        'Billy'
  },
  {
    'movies:title':     'The Departed',
    'movies:director':  'Martin Scorsese',
    'name':             'Matt Damon',
    'movies:as':        'Colin Sullivan'
  }
];

var Treeize = require('treeize');
var actors  = new Treeize();

actors.grow(moviesData);

/*

  'actors.getData()' now results in the following:

  [
    {
      'name': 'Christian Bale',
      'movies': [
        {
          'as': 'Alfred Borden',
          'director': 'Christopher Nolan',
          'title': 'The Prestige'
        },
        {
          'as': 'Bruce Wayne',
          'director': 'Christopher Nolan',
          'title': 'The Dark Knight Rises'
        }
      ]
    },
    {
      'name': 'Hugh Jackman',
      'movies': [
        {
          'as': 'Robert Angier',
          'director': 'Christopher Nolan',
          'title': 'The Prestige'
        }
      ]
    },
    {
      'name': 'Leonardo DiCaprio',
      'movies': [
        {
          'as': 'Billy',
          'director': 'Martin Scorsese',
          'title': 'The Departed'
        }
      ]
    },
    {
      'name': 'Matt Damon',
      'movies': [
        {
          'as': 'Colin Sullivan',
          'director': 'Martin Scorsese',
          'title': 'The Departed'
        }
      ]
    }
  ]

*/
```

# Changelog

- **2.0.1** - performance tuning... ~400% performance boost over 2.0.0
- **2.0.2** - added `.getSeedData()` to retrieve original, flat data
- **2.0.3** - internal variable renaming to avoid deprecation error
- **2.1.0** - major (> 3x) performance improvement - required dropping support for .toString() and internal logging, removed lodash as a dependency
- **2.1.1** - rollback to lodash dependency to solve edge case in mapping
- **2.1.2** - solves issue in edge case with attributes named "length"
