var Treeize = require('../lib/treeize');
var should  = require('should');

var welldata1 = require('./data/welldata1');
var welldata2 = require('./data/welldata2');
var arraywelldata = require('./data/arraywelldata');

describe('OPTIONS', function() {
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
  });

  describe('input.uniformRows', function() {
    it('should use signature from first row when enabled (default)', function() {
      var fields = new Treeize();
      fields
        .grow(welldata1)
      ;

      fields.getData().should.eql([
        { code: 'RA',
          wells:
           [ { uwi: 'RA-001',
               log: [ { oilrate: 5000, date: '12/12/2014' }, { oilrate: 5050 } ],
               reservoirs: [ { code: 'LB' } ] },
             { uwi: 'RA-002', log: [ { oilrate: 4500 } ] } ],
          reservoirs: [ { code: 'LB' } ] },
        { code: 'SA',
          wells:
           [ { uwi: 'SA-032',
               log: [ { oilrate: 2050 } ],
               reservoirs: [ { code: 'MA' } ] } ],
          reservoirs: [ { code: 'MA' } ] }
      ]);
    });

    it('should create unique row signature for each row when disabled', function() {
      var fields = new Treeize();
      fields
        .grow(welldata1, { input: { uniformRows: false }})
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
  });

  describe('output.objectOverwrite', function() {
    it('should overwrite attribute/placeholder objects with real objects', function() {
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

      var tree = new Treeize();
      tree = tree
        .setOptions({ input: { uniformRows: false }, output: { objectOverwrite: true }})
        .grow(testDataOverwrite)
        .getData()
      ;

      tree.should.eql([
        { name: 'dog', fk: { a: 'X', b: 'Y' }, pet: 'Mittens' },
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

describe('grow()', function() {
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

    it('* modifier should set signature attributes', function() {
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

    it('- modifier should force object (instead of collection) when plural name', function() {
      var tree = new Treeize();

      tree.grow([
        { 'foo': 'bar', 'logs-:a': 1 },
        { 'foo': 'bar', 'logs-:a': 2 },
        { 'foo': 'baz', 'logs-:a': 3 },
      ]).getData().should.eql([
        { foo: 'bar', logs: { a: 1 } },
        { foo: 'baz', logs: { a: 3 } }
      ]);
    });
  });

  it('passing options should not change global options', function() {
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

  it('should be able to merge multiple data sources/types together', function() {
    var fields = new Treeize();
    fields
      .setOptions({ input: { uniformRows: false } })
      .grow(welldata1)
      .grow(welldata2)
      .clearSignature()
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
        reservoirs: [ { code: 'LB' }, { code: 'UB' } ]
      },
      { code: 'SA',
        wells:
         [ { uwi: 'SA-032',
             log: [ { oilrate: 2050, date: '12/12/2014', effluent: 2050 } ],
             reservoirs: [ { code: 'MA' } ] },
           { uwi: 'SA-031',
             log: [ { effluent: 850, date: '12/11/2014' } ],
             reservoirs: [ { code: 'MA' } ] } ],
        reservoirs: [ { code: 'MA' } ]
      }
    ]);
  });
});
