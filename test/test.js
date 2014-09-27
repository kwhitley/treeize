var Treeize = require('../lib/treeize');
var treeize = new Treeize();
var should  = require('should');

var welldata1 = require('./data/welldata1');
var welldata2 = require('./data/welldata2');
var arraywelldata = require('./data/arraywelldata');
var arraywelldataNoHeaders = require('./data/arraywelldata-no-headers');
var classdata = require('./data/classdata');

describe('#getStats()', function() {
  var tree = new Treeize();
  var stats = tree.grow([
    { 'foo': 'bar', 'logs:a': 1 },
    { 'foo': 'bar', 'logs:a': 2 },
    { 'foo': 'baz', 'logs:a': 3 },
  ]).getStats();

  describe('.rows', function() {
    it('should return number of rows processed', function() {
      stats.rows.should.equal(3);
    });
  });

  describe('.sources', function() {
    it('should return number of sources/growth passes', function() {
      stats.sources.should.equal(1);
    });
  });
});


describe('#getOptions()', function() {
  it('should return options', function() {
    treeize.getOptions().log.should.be.false;
    treeize.getOptions().input.delimiter.should.equal(':');
  });
});


describe('#setOptions()', function() {
  it('should be chainable', function() {
    treeize.setOptions({ input: { uniformRows: false }}).should.be.type('object');
    treeize.setOptions({ input: { uniformRows: true }}).should.have.property('grow');
  });

  describe('input.delimiter', function() {
    it('should allow custom delimiters', function() {
      var tree = new Treeize();

      tree.setOptions({ input: { delimiter: '|' }}).grow([
        { 'foo': 'bar', 'logs|a': 1 },
        { 'foo': 'bar', 'logs|a': 2 },
        { 'foo': 'baz', 'logs|a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: [{ a: 1 }, { a: 2 }] },
        { foo: 'baz', logs: [{ a: 3 }]}
      ]);
    });

    it('should be able to be set from grow() options', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'logs|a': 1 },
        { 'foo': 'bar', 'logs|a': 2 },
        { 'foo': 'baz', 'logs|a': 3 },
      ], { input: { delimiter: '|' }}).getData().should.eql([
        { foo: 'bar', logs: [{ a: 1 }, { a: 2 }] },
        { foo: 'baz', logs: [{ a: 3 }]}
      ]);
    });
  });

  describe('input.detectCollections', function() {
    it('should force plural nodes into collections when enabled', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'logs:a': 1 },
        { 'foo': 'bar', 'logs:a': 2 },
        { 'foo': 'baz', 'logs:a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: [{ a: 1 }, { a: 2 }] },
        { foo: 'baz', logs: [{ a: 3 }]}
      ]);
    });

    it('should ignore plural nodes when disabled', function() {
      var tree = new Treeize();

      tree.setOptions({ input: { detectCollections: false } }).grow([
        { 'foo': 'bar', 'logs:a': 1 },
        { 'foo': 'bar', 'logs:a': 2 },
        { 'foo': 'baz', 'logs:a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: { a: 2 } },
        { foo: 'baz', logs: { a: 3 } },
      ]);
    });
  });

  describe('input.uniformRows', function() {
    it('should create unique row signature for each row when disabled (default)', function() {
      var fields = new Treeize();
      fields
        .grow(welldata1)
      ;

      fields.getData().should.eql([
        { code: 'RA',
          wells:
           [ { uwi: 'RA-001',
               log:
                [ { oilrate: 5000, date: '12/12/2014' },
                  { oilrate: 5050, date: '12/13/2014', wc: 0.5 } ],
               reservoirs: [ { code: 'LB' } ] },
             { uwi: 'RA-002',
               reservoir: 'UB',
               log: [ { oilrate: 4500, date: '12/12/2014' } ] } ],
          reservoirs: [ { code: 'LB' } ] },
        { code: 'SA',
          wells:
           [ { uwi: 'SA-032',
               log: [ { oilrate: 2050, date: '12/12/2014' } ],
               reservoirs: [ { code: 'MA' } ] } ],
          reservoirs: [ { code: 'MA' } ] }
      ]);
    });

    it('should use signature from first row when enabled', function() {
      var fields = new Treeize();
      fields
        .grow(welldata1, { input: { uniformRows: true }})
      ;

      fields.getData().should.eql([
        { code: 'RA',
          wells:
           [ { uwi: 'RA-001',
               log:
                [ { oilrate: 5000, date: '12/12/2014' },
                  { oilrate: 5050, date: '12/13/2014' } ],
               reservoirs: [ { code: 'LB' } ] },
             { uwi: 'RA-002',
               log: [ { oilrate: 4500, date: '12/12/2014' } ] } ],
          reservoirs: [ { code: 'LB' } ] },
        { code: 'SA',
          wells:
           [ { uwi: 'SA-032',
               log: [ { oilrate: 2050, date: '12/12/2014' } ],
               reservoirs: [ { code: 'MA' } ] } ],
          reservoirs: [ { code: 'MA' } ] }
      ]);
    });
  });

  describe('output.objectOverwrite', function() {
    var testDataOverwrite = [
      {
        'name*': 'dog',
        'fk':   1,
        'pet': 'Fido'
      },
      {
        'name': 'cat',
        'fk:a': 'A',
        'fk:b': 'B'
      },
      {
        'name*': 'dog',
        'fk:a': 'X',
        'fk:b': 'Y',
        'pet':  'Mittens'
      },
    ];

    it('should overwrite attribute/placeholder objects with real objects when enabled', function() {
      var tree = new Treeize();
      tree = tree
        .grow(testDataOverwrite)
        .getData()
      ;

      tree.should.eql([
        { name: 'dog', fk: { a: 'X', b: 'Y' }, pet: 'Mittens' },
        { name: 'cat', fk: { a: 'A', b: 'B' } }
      ]);
    });

    it('should not overwrite attribute/placeholder objects with real objects when disabled', function() {
      var tree = new Treeize();
      tree = tree
        .setOptions({ log: true, output: { objectOverwrite: false }})
        .grow(testDataOverwrite)
        .getData()
      ;

      tree.should.eql([
        { name: 'dog', fk: 1, pet: 'Mittens' },
        { name: 'cat', fk: { a: 'A', b: 'B' } }
      ]);
    });
  });

  describe('output.prune', function() {
    var pruneData = [
      { 'name': null, 'age': 1 },
      { 'name': 'Kevin', 'age': 12 },
      { foo: null, bar: null }
    ];

    it('should prune empty nodes when enabled', function() {
      var tree = new Treeize();
      tree
        .setOptions({ input: { uniformRows: false } })
        .grow(pruneData)
      ;

      tree.getData().should.have.a.length(2);
      tree.getData().should.eql([
        { age: 1 },
        { name: 'Kevin', age: 12 }
      ]);
    });

    it('should leave empty nodes when disabled', function() {
      var tree = new Treeize();
      tree
        .setOptions({ input: { uniformRows: false }, output: { prune: false } })
        .grow(pruneData)
      ;

      tree.getData().should.have.a.length(3);
      tree.getData().should.eql([
        { name: null, age: 1 },
        { name: 'Kevin', age: 12 },
        { foo: null, bar: null }
      ]);
    });
  });

  describe('output.resultsAsObject', function() {
    it('should create single root object instead of array results', function() {
      var testDataRootObject = [
        {
          'name': 'kevin',
          'pet': 'Fido'
        },
        {
          'age': 34,
        },
        {
          'comments:comment': 'I miss you',
          'comments:date': '2014/09/10'
        },
        {
          'comments:comment': 'I really miss you',
          'comments:date': '2014/09/11'
        }
      ];

      var tree = new Treeize();
      tree = tree
        .setOptions({ input: { uniformRows: false }, output: { resultsAsObject: true }})
        .grow(testDataRootObject)
        .getData()
      ;

      tree.should.be.type('object');
      tree.should.have.keys('name', 'pet', 'age', 'comments');
      tree.comments.should.have.a.lengthOf(2);
    });
  });
});


describe('#resetOptions()', function() {
  it('should be chainable', function() {
    treeize.resetOptions().should.be.type('object');
    treeize.resetOptions().should.have.property('grow');
  });

  it('should reset base options', function() {
    var baseOptions = treeize.getOptions();
    treeize.setOptions({ log: true });
    treeize.getOptions().should.not.eql(baseOptions);
    treeize.getOptions().log.should.be.true;
    treeize.resetOptions();
    treeize.getOptions().should.eql(baseOptions);
    treeize.getOptions().log.should.be.false;
  });
});


describe('#setSignature()', function() {
  it('should be chainable', function() {
    treeize.setSignature([]).should.be.type('object');
    treeize.setSignature([]).should.have.property('grow');
  });

  it('should force signature from a defined row', function() {
    var fields = new Treeize();
    fields
      .setSignature(welldata1[3])
      .grow(welldata1)
    ;

    fields.getData().should.eql([
      { code: 'RA',
        wells:
         [ { uwi: 'RA-001',
             log: [ { date: '12/12/2014' }, { date: '12/13/2014', wc: 0.5 } ],
             reservoirs: [ { code: 'LB' } ] },
           { uwi: 'RA-002', log: [ { date: '12/12/2014' } ] } ],
        reservoirs: [ { code: 'LB' } ] },
      { code: 'SA',
        wells:
         [ { uwi: 'SA-032',
             log: [ { date: '12/12/2014' } ],
             reservoirs: [ { code: 'MA' } ] } ],
        reservoirs: [ { code: 'MA' } ] }
    ]);
  });

  it('should work with array data', function() {
    var fields = new Treeize();
    fields
      .setSignature(['id','name:first','age'])
      .grow([
        [1, 'kevin', 34],
        [2, 'jimbo', 33],
      ])
    ;

    fields.getData().should.eql([
      { id: 1, name: { first: 'kevin' }, age: 34 },
      { id: 2, name: { first: 'jimbo' }, age: 33 }
    ]);
  });

  it('should persist between data sets when called manually', function() {
    var fields = new Treeize();
    fields
      .setSignature(welldata1[3])
      .grow(welldata1)
      .grow(welldata2)
    ;

    fields.getData().should.eql([
      { code: 'RA',
        wells:
         [ { uwi: 'RA-001',
             log: [ { date: '12/12/2014' }, { date: '12/13/2014', wc: 0.5 } ],
             reservoirs: [ { code: 'LB' } ] },
           { uwi: 'RA-002',
             log: [ { date: '12/12/2014' } ],
             reservoirs: [ { code: 'UB' } ] } ],
        reservoirs: [ { code: 'LB' }, { code: 'UB' } ] },
      { code: 'SA',
        wells:
         [ { uwi: 'SA-032',
             log:
              [ { date: '12/12/2014', wc: 0.1 },
                { wc: 0.2, date: '12/13/2014' } ],
             reservoirs: [ { code: 'MA' } ] } ],
        reservoirs: [ { code: 'MA' } ] }
    ]);
  });

  describe('modifiers', function() {
    it('-/+/* modifiers should only be stripped from head/tail of paths', function() {
      var testPlusMinus = [
        {
          'name': 'kevin',
          'owned-pets:name': 'Fido',
          'owned-pets:age': 12,
          'a+b': 'why not?',
          'log-ref+:date': '2014/1/1'
        },
        {
          'name': 'kevin',
          'owned-pets:name': 'Fido',
          'owned-pets:age': 12,
          'a+b': 'why not?',
          'log-ref+:date': '2014/1/2'
        },
      ];

      var tree = new Treeize();
      tree = tree
        .grow(testPlusMinus)
        .getData()
      ;

      tree.should.eql([ { name: 'kevin',
        'a+b': 'why not?',
        'log-ref': [ { date: '2014/1/1' }, { date: '2014/1/2' } ],
        'owned-pets': [ { name: 'Fido', age: 12 } ] } ]
      );
    });

    it('* modifier should define specific signature attributes', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo*': 'bar', 'age': 1 },
        { 'foo*': 'bar', 'age': 2 },
        { 'foo*': 'baz', 'age': 3 },
      ]).getData().should.have.length(2);
    });

    it('+ modifier should force collection', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'log+:a': 1 },
        { 'foo': 'bar', 'log+:a': 2 },
        { 'foo': 'baz', 'log+:a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', log: [{ a: 1 }, { a: 2 }] },
        { foo: 'baz', log: [{ a: 3 }]}
      ]);
    });

    it('+ modifier should work on deep nodes', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'log+:a:b': 1 },
        { 'foo': 'bar', 'log+:a:b': 2 },
        { 'foo': 'baz', 'log+:a:b': 3 },
      ]).getData().should.eql([
        { foo: 'bar', log: [{ a: { b: 1 } }, { a: { b: 2 } }] },
        { foo: 'baz', log: [{ a: { b: 3 } }]}
      ]);
    });

    it('+ modifier should work on deep edge (classdata) case', function() {
      var tree = new Treeize();

      tree.grow(classdata).getData().should.eql([
        { Name: 'Duke University',
          Subject:
           [ { Name: 'liberal-arts',
               Courses:
                [ { 'Date Added': '07/16/13',
                    Name: '9/11 and Its Aftermath -- Part I',
                    Description: 'Provided by Duke University, this course investigates the forces leading up to the 9/11 attacks and the policies adopted by the US afterwards.',
                    Link: 'https://www.coursera.org/course/911aftermath',
                    Media: 'full course',
                    Instructor: 'David Schanzer',
                    'Start Date': '09/09/13',
                    Duration: '7 weeks' } ] } ],
          Providers: [ { Name: 'Coursera' } ] },
        { Name: 'Wesleyan University',
          Subject:
           [ { Name: 'math',
               Courses:
                [ { 'Date Added': '07/16/13',
                    Name: 'Analysis of a Complex Kind',
                    Description: 'This course educates students on the subject of complex analysis, which is the study of functions that live in the complex plane.',
                    Link: 'https://www.coursera.org/course/complexanalysis',
                    Media: 'full course',
                    Instructor: 'Dr. Petra Bonfert-Taylor',
                    'Start Date': '10/21/13',
                    Duration: '6 weeks' } ] } ],
          Providers: [ { Name: 'Coursera' } ] }
      ]);
    });

    it('- modifier should force object (instead of collection) when plural name', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'logs-:a': 1 },
        { 'foo': 'bar', 'logs-:a': 2 },
        { 'foo': 'baz', 'logs-:a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: { a: 2 } },
        { foo: 'baz', logs: { a: 3 } }
      ]);
    });

    it('- modifier should work on deep nodes', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'logs-:a:b': 1 },
        { 'foo': 'bar', 'logs-:a:b': 2 },
        { 'foo': 'baz', 'logs-:a:b': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: { a: { b: 2 } } },
        { foo: 'baz', logs: { a: { b: 3 } } }
      ]);
    });
  });
});


describe('#grow()', function() {
  it('should be chainable', function() {
    treeize.grow().should.be.type('object');
    treeize.grow().should.have.property('grow');
  });

  it('passing options should not change global options (including input options)', function() {
    var pruneData = [
      { 'name': null, 'age': 1 },
      { 'name': 'Kevin', 'age': 12 },
      { foo: null, bar: null }
    ];

    var tree = new Treeize();
    tree
      .grow(pruneData, { input: { uniformRows: false }, output: { prune: false } })
      .getData()
      .should.eql([
        { name: null, age: 1 },
        { name: 'Kevin', age: 12 },
        { foo: null, bar: null }
      ])
    ;
  });

  it('passing options should not change global options', function() {
    var tree = new Treeize();
    tree.setOptions({ input: { delimiter: '&' } });
    tree.getOptions().input.delimiter.should.equal('&');

    tree.grow([], { input: { delimiter: '>' } });
    tree.getOptions().input.delimiter.should.equal('&');
  });

  it('passing options for signature reading should work', function() {
    var tree = new Treeize();
    tree.setOptions({ input: { delimiter: '&' } });
    tree.getOptions().input.delimiter.should.equal('&');

    tree.grow([], { input: { delimiter: '>' } });
    tree.getOptions().input.delimiter.should.equal('&');
  });

  it('should create new entry for each unique node signature', function() {
    var tree = new Treeize();

    tree.grow([
      { 'foo': 'bar', 'age': 1 },
      { 'foo': 'bar', 'age': 2 },
      { 'foo': 'baz', 'age': 3 },
    ]).getData().should.have.length(3);
  });

  it('should handle flat array data', function() {
    var fields = new Treeize();
    fields
      .grow(arraywelldata)
    ;

    fields.getData().should.eql([
      { code: 'RA',
        wells:
         [ { uwi: 'RA-001',
             log:
              [ { effluent: 5000, date: '12/12/2014' },
                { effluent: 5050, date: '12/13/2014' },
                { effluent: 6076, date: '12/14/2014' } ],
             reservoirs: [ { code: 'LB' } ] },
           { uwi: 'RA-002',
             log: [ { effluent: 4500, date: '12/12/2014' } ],
             reservoirs: [ { code: 'UB' } ] } ],
        reservoirs: [ { code: 'LB' }, { code: 'UB' } ] },
      { code: 'SA',
        wells:
         [ { uwi: 'SA-032',
             log: [ { effluent: 2050, date: '12/12/2014' } ],
             reservoirs: [ { code: 'MA' } ] },
           { uwi: 'SA-031',
             log: [ { effluent: 850, date: '12/11/2014' } ],
             reservoirs: [ { code: 'MA' } ] } ],
        reservoirs: [ { code: 'MA' } ] }
    ]);
  });

  it('should be able to merge multiple data sources/types together', function() {
    var fields = new Treeize();
    fields
      .setOptions({ input: { uniformRows: false } })
      .grow(welldata1)
      .grow(welldata2)
      .grow(arraywelldata)
    ;

    fields.getData().should.eql([
      { code: 'RA',
        wells:
         [ { uwi: 'RA-001',
             log:
              [ { oilrate: 5000, date: '12/12/2014', effluent: 5000 },
                { oilrate: 5050, date: '12/13/2014', wc: 0.5, effluent: 5050 },
                { effluent: 6076, date: '12/14/2014' } ],
             reservoirs: [ { code: 'LB' } ] },
           { uwi: 'RA-002',
             reservoir: 'UB',
             log: [ { oilrate: 4500, date: '12/12/2014', effluent: 4500 } ],
             reservoirs: [ { code: 'UB' } ] } ],
        reservoirs: [ { code: 'LB' }, { code: 'UB' } ] },
      { code: 'SA',
        wells:
         [ { uwi: 'SA-032',
             log:
              [ { oilrate: 2050, date: '12/12/2014', wc: 0.1, effluent: 2050 },
                { wc: 0.2, date: '12/13/2014' } ],
             reservoirs: [ { code: 'MA' } ] },
           { uwi: 'SA-031',
             log: [ { effluent: 850, date: '12/11/2014' } ],
             reservoirs: [ { code: 'MA' } ] } ],
        reservoirs: [ { code: 'MA' } ] }
    ]);
  });

  it('should handle deep object paths without existing definition', function() {
    var tree = new Treeize();

    tree.grow([
      {
        'id':1,
        'user:a:b:c:d:e': 'kevin',
        'user:age': 34
      },
      {
        'id':1,
        'user:a:b:c:def:e': 'jimbo',
        'user:age': 34
      },
      {
        'id':1,
        'user:a:b:c:d:efg': 'kelly',
        'user:age': 34
      }
    ]).getData().should.eql([
      { id: 1,
        user:
         { age: 34,
           a: { b: { c: { d: { e: 'kevin', efg: 'kelly' }, def: { e: 'jimbo' } } } } } }
    ]);
  });

  it('should handle signature-less root node insertion', function() {
    var tree = new Treeize();

    tree.grow([
      { 'foo:name': 'bar', 'foo:age': 1 },
      { 'foo:name': 'baz', 'foo:age': 3 },
    ]).getData().should.eql([
      { foo: { name: 'bar', age: 1 } },
      { foo: { name: 'baz', age: 3 } }
    ]);
  });
});
