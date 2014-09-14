var Treeize = require('../lib/treeize');
var should  = require('should');

var welldata1 = require('./data/welldata1');
var welldata2 = require('./data/welldata2');
var arraywelldata = require('./data/arraywelldata');

describe('OPTIONS', function() {
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
  it('passing options should not change global options', function() {
    var tree = new Treeize();
    tree.setOptions({ input: { delimiter: '&' } });
    tree.getOptions().input.delimiter.should.equal('&');

    tree.grow([], { input: { delimiter: '>' } });
    tree.getOptions().input.delimiter.should.equal('&');
  });

  it('should only trim -/+/* from head/tail of paths', function() {
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
});
