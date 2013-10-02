'use strict';

var file = require('..');
var _ = require('lodash');

exports['file module'] = {
  'query interface': _.extend({},
    require('./query')['fquery'],
    {
      setUp: function(done) {
        this.fquery = file;
        done();
      },
      'test are running on the module': function(test) {
        test.expect(1);
        test.deepEqual(this.fquery, file);
        test.done();
      }
    }
  )
};
