var _ = require('lodash');
var Env = require('./lib/file');
var query = require('./lib/query');

var file = new Env();
_.extend(file, query);

file.glob = require('glob');
file.minimatch = require('minimatch');
file.findup = require('findup-sync');

file.createEnv = function(opt) {
  return new Env(opt);
};

module.exports = file;
