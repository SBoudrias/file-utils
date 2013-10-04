var path = require('path');
var util = require('util');
var _ = require('lodash');
var File = require('./file');

module.exports = Env;

function Env() {
  File.apply(this, arguments);

  var methodsToPrefix = [ 'mkdir', 'recurse', 'read', 'readJSON', 'write', 'copy',
      'delete' ];

  // Prefix path arguments with this environment root dir
  methodsToPrefix.forEach(function( methodName ) {
    this[methodName] = function() {
      var args = _.toArray(arguments);
      args[0] = this.fromBase(args[0]);
      return File.prototype[methodName].apply(this, args);
    };
  }.bind(this));
}

util.inherits(Env, File);

Env.prototype.fromBase = function( filepath ) {
  if (this.isPathAbsolute(filepath)) {
    return filepath;
  }
  return path.join(this.option('base'), filepath);
};
