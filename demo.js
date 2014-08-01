var util        = require('util');
var Treeize     = require('./lib/treeize');

var flatData = [
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log+:oilrate":          5000,
    "wells:log+:date*":             "12/12/2014",
  },
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log+:oilrate":          5000,
    "wells:log+:date*":             "12/12/2014",
  },
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log+:oilrate":      5050,
    "wells:log+:*date":         "12/13/2014",
  },
  {
    "code":                       "RA",
    "reservoirs:code":            "LB",
    "wells:uwi":                  "RA-001",
    "wells:reservoirs:code":      "LB",
    "wells:log+:wc":      0.5,
    "wells:log+:*date":         "12/13/2014",
  },
  {
    "code":                 "RA",
    "reservoirs:code":            "UB",
    "wells:uwi":                  "RA-002",
    "wells:reservoirs:code":      "UB",
    // "wells:log+:oilrate":         4500,
    // "wells:log+:*date":           "12/12/2014",
  },
  {
    "code":                       "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log+:oilrate":         2050,
    "wells:log+:*date":           "12/12/2014",
  },
];

var additionalFlatData = [
  {
    "code":                       "RA",
    "reservoirs:code":            "UB",
    "wells:uwi":                  "RA-002",
    "wells:reservoirs:code":      "UB",
    // "wells:log+:wc":              0.6,
    // "wells:log+:*date":           "12/14/2014",
  },
  {
    "code":                       "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log:wc":               0.1,
    "wells:log:date":             "12/12/2014",
  },
  {
    "code":                       "SA",
    "reservoirs:code":            "MA",
    "wells:uwi":                  "SA-032",
    "wells:reservoirs:code":      "MA",
    "wells:log:wc":               0.2,
    "wells:log:date":             "12/13/2014",
  }
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
  // .grow(flatData)
  .grow(flatData, { data: { uniform: true, prune: true }})
  .grow(arrayData)
;

console.log('FINAL>', pets + '');
console.log('STATS>', util.inspect(pets.stats, false, null));
