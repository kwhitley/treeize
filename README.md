treeize
=======

Converts row data (in JSON/associative array format) to object/tree structure based on column naming conventions.

##Why?

Most of us still have our hands in traditional relational databases (e.g. MySQL).
While the normalized tables do a fine job of representing the parent/child
relationships, the joined SQL results do not.  In fact, they look more like an Excel
spreadsheet than anything

## Installation

```
npm install treeize
```

## API

- `treeize.grow(flatData, options)` - takes your results/rows of flat associative data and returns a full object graph.
- `treeize.getOptions()` - returns global options for the lib.
- `treeize.setOptions(options)` - sets global options for the lib.  For example, to use a path delimiter of '>' instead of ':', call `treeize.setOptions({ delimiter: '>' })`

### Notes

- The column/attribute order is not important.  All attributes are sorted by depth before mapping.  This ensures parent nodes exist before children nodes are created within.
- Each attribute name of the flat data must consist of the full path to its node & attribute, seperated by the delimiter.  `id` suggests an `id` attribute on a root element, whereas `name+first` implies a `first` attribute on a `name` object within a root element.
- To imply a collection in the path/attribute-name, use a plural name (e.g. "subjects" instead of "subject").  Otherwise, use a singular name for a singular object.
- Use a `:` delimiter (default) to seperate path nodes.  To change this, use the `treeize.set([options])` function.

### Assumptions

This library has several assumptions that make it possible.

1. That each row represents a singular child item, that may contain many repeated ancestor columns.
2. That each element in a collection node (including the root) will have a unique identifying signature (necessary to prevent duplication).  This can be any one attribute, or the combination of any/all attributes.

### Examples

In this short series of examples, we'll take a standard "join dump", originally keyed
(via attribute names) to organize by movie - and demonstrate how other organizations can
be easily derived from the same original feed... by simply modifying the column/attribute
names in the output.

#### Example 1

```
var treeize = require('treeize');

var movieDump = [
  {
    "title":             "The Prestige",
    "director":          "Christopher Nolan",
    "genre":             "drama",
    "actors:name":       "Christian Bale",
    "actors:as":         "Alfred Borden"
  },
  {
    "title":             "The Prestige",
    "director":          "Christopher Nolan",
    "genre":             "drama",
    "actors:name":       "Hugh Jackman",
    "actors:as":         "Robert Angier"
  },
  {
    "title":             "The Dark Knight Rises",
    "director":          "Christopher Nolan",
    "genre":             "action",
    "actors:name":       "Christian Bale",
    "actors:as":         "Bruce Wayne"
  },
  {
    "title":             "The Departed",
    "director":          "Martin Scorsese",
    "genre":             "thriller",
    "actors:name":       "Leonardo DiCaprio",
    "actors:as":         "Billy"
  },
  {
    "title":             "The Departed",
    "director":          "Martin Scorsese",
    "genre":             "thriller",
    "actors:name":       "Matt Damon",
    "actors:as":         "Colin Sullivan"
  }
];

var movies = treeize.grow(movieDump);

/*

  'movies' now contains the following:

  [
    {
      "genre": "drama",
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
      "genre": "action",
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
      "genre": "thriller",
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
