treeize
=======

Converts row data (in JSON/associative array format) to object/tree structure based on column naming conventions.

##Why?

Most of us still have our hands in traditional relational databases (e.g. MySQL).
While the normalized tables do a fine job of representing the parent/child
relationships, the joined SQL results do not.  In fact, they look more like an Excel
spreadsheet than anything.  This presents us with a
problem when trying to supply a nice deep object graph for applications.

Using a traditional ORM is slow (either many fragmented SQL
calls, slow object hydration of models, or both).  Beyond that, for a lightweight API,
you don't want to have to first pick an ORM and then model out all your relationships. For complex queries, especially where results are
filtered by multiple columns across multiple tables, it becomes even more troublesome,
or borderline impossible to use these model helpers.

The problem is, you can write the
complex deeply joined SQL call that has all the results you wanted - but you can't get it back into
an object graph so it looks/behaves like something other than data vomit.

Now you can.

## Installation

```
npm install treeize
```

## API

- `treeize.grow(flatData, options)` - takes your results/rows of flat associative data and returns a full object graph.
- `treeize.getOptions()` - returns global options for the lib.
- `treeize.setOptions(options)` - sets global options for the lib.  For example, to use a path delimiter of '>' instead of ':', call `treeize.setOptions({ delimiter: '>' })`

### Usage

To use `treeize`, simply pass flat "row data" into `treeize.grow()`.  Each
column/attribute of each row will dictate its own destination path using the following format:

```js
{
  "[path1]:[path2]:[pathX]:[attributeName]": [value]
}
```

Each "path" (up to n-levels deep) is optional and represents a single object node if the word is singular,
or a collection if the word is plural.  For example, a "favoriteMovie:name" path will
add a "favoriteMovie" object to its path - where "favoriteMovies:name" would add a collection
of movies (complete with a first entry) instead.  For root nodes, include only
the attribute name without any preceding paths.  If you were creating a final output of a
book collection for instance, the title of the book would likely be pathless as you would want the
value on the high-level collection `book` object.

It's important to note that each row will create or find its path within the newly
transformed output being created.  Your flat feed will have mass-duplication, the results
will not.

##### Pathing example

```js
{
  "title": "Ender's Game",                    // creates the first object with a title attribute of "Ender's Game"
  "author:name": "Orson Scott Card",          // adds an author object (with name) to the book "Ender's Game" (created above)
  "author:age":  21,                          // gives the author object an age attribute
  "author:otherBooks:name": "Ender's Shadow", // adds a collection named "otherBooks" to the author, with a first object of "name": "Ender's Shadow"
}
```

### Notes

- The column/attribute order is not important.  All attributes are sorted by depth before mapping.  This ensures parent nodes exist before children nodes are created within.
- Each attribute name of the flat data must consist of the full path to its node & attribute, seperated by the delimiter.  `id` suggests an `id` attribute on a root element, whereas `name:first` implies a `first` attribute on a `name` object within a root element.
- To imply a collection in the path/attribute-name, use a plural name (e.g. "subjects" instead of "subject").  Otherwise, use a singular name for a singular object.
- Use a `:` delimiter (default) to seperate path nodes.  To change this, use the `treeize.set([options])` function.

### Assumptions

This library has several assumptions that make it possible.

1. That each row represents a singular child item, that may contain many repeated ancestor columns.
2. That each element in a collection node (including the root) will have a unique identifying signature (necessary to prevent duplication).  This can be any one attribute, or the combination of any/all attributes.

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
for example).  This time we'll organize the data by directors, as you would for
and endpoint like `/api/directors`.

Notice the feed is left unchanged - only the attribute names have been modified to
define their new target path.  In this case, by changing the base node to the directors
name (instead of the movie name), we group everything by director at a high level.

```js
var treeize = require('treeize');

var moviesDump = [
    {
      "movies:title":      "The Prestige",
      "name":              "Christopher Nolan",
      "workedWith:name":   "Christian Bale",
      "workedWith:as":     "Alfred Borden"
    },
    {
      "movies:title":      "The Prestige",
      "name":              "Christopher Nolan",
      "workedWith:name":   "Hugh Jackman",
      "workedWith:as":     "Robert Angier"
    },
    {
      "movies:title":      "The Dark Knight Rises",
      "name":              "Christopher Nolan",
      "workedWith:name":   "Christian Bale",
      "workedWith:as":     "Bruce Wayne"
    },
    {
      "movies:title":      "The Departed",
      "name":              "Martin Scorsese",
      "workedWith:name":   "Leonardo DiCaprio",
      "workedWith:as":     "Billy"
    },
    {
      "movies:title":      "The Departed",
      "name":              "Martin Scorsese",
      "workedWith:name":   "Matt Damon",
      "workedWith:as":     "Colin Sullivan"
    }
  ];

var directors = treeize.grow(movieDump);

/*

  'directors' now contains the following:

  [
    {
      "name": "Christopher Nolan",
      "workedWith": [
        {
          "as": "Alfred Borden",
          "name": "Christian Bale"
        },
        {
          "as": "Robert Angier",
          "name": "Hugh Jackman"
        },
        {
          "as": "Bruce Wayne",
          "name": "Christian Bale"
        }
      ],
      "movies": [
        {
          "title": "The Prestige"
        },
        {
          "title": "The Dark Knight Rises"
        }
      ]
    },
    {
      "name": "Martin Scorsese",
      "workedWith": [
        {
          "as": "Billy",
          "name": "Leonardo DiCaprio"
        },
        {
          "as": "Colin Sullivan",
          "name": "Matt Damon"
        }
      ],
      "movies": [
        {
          "title": "The Departed"
        }
      ]
    }
  ]
*/
```
