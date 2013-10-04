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
      File.prototype[methodName].apply(this, args);
    };
  }.bind(this));
}

util.inherits(Env, File);

Env.prototype.fromBase = function( path ) {
  return path;
};
