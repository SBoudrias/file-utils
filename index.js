var _ = require('lodash');
var File = require('./lib/file');
var Env = require('./lib/env');
var query = require('./lib/query');

var file = new File();
_.extend(file, query);

file.glob = require('glob');
file.minimatch = require('minimatch');
file.findup = require('findup-sync');

file.createEnv = function(opt) {
  return new Env(opt);
};

module.exports = file;
