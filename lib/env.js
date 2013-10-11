var path = require('path');
var util = require('util');
var _ = require('lodash');
var File = require('./file');

module.exports = Env;

function Env(opt) {
  File.apply(this, arguments);

  this._base = opt.base || '';
  this._writeFilters = [];
  this._writeFiltersMap = {};

  var methodsToPrefix = [ 'mkdir', 'recurse', 'read', 'readJSON', 'write', 'copy',
      'delete' ];

  // Prefix path arguments with this environment root dir
  methodsToPrefix.forEach(function(methodName) {
    this[methodName] = function() {
      var args = _.toArray(arguments);
      args[0] = this.fromBase(args[0]);
      return File.prototype[methodName].apply(this, args);
    };
  }.bind(this));

  var actualWrite = this.write;
  this.write = function(filepath, contents, options) {
    this.applyWriteFilters({ path: filepath, contents: contents }, actualWrite, options);
  };
}

util.inherits(Env, File);

// Return a path prefixed by the base (if not absolute)
Env.prototype.fromBase = function( filepath ) {
  if (this.isPathAbsolute(filepath)) {
    return filepath;
  }
  return path.join(this._base, filepath);
};

Env.prototype.registerWriteFilter = function(name, filter) {
  this._writeFiltersMap[ name ] = this._writeFilters.length;
  this._writeFilters.push(filter);
};

Env.prototype.removeWriteFilter = function(name) {
  this._writeFilters.splice(this._writeFiltersMap[name], 1);
  delete this._writeFiltersMap[name];
};

Env.prototype.applyWriteFilters = function(file, actualWrite, options) {
  if (!this._writeFilters.length) {
    return actualWrite.call(this, file.path, file.contents, options);
  }

  var i = 0;
  var output;
  var recurse = function(file) {
    i++;
    if (this._writeFilters[i]) {
      runAsync( this._writeFilters[i], recurse, file );
    } else {
      output = actualWrite.call(this, file.path, file.contents, options);
    }
  }.bind(this);

  runAsync( this._writeFilters[i], recurse, file );

  return output;
};


// ---
// util.inherits(
function runAsync( func, cb ) {
  var rest = [];
  var len = 1;

  while ( len++ < arguments.length ) {
    rest.push( arguments[len] );
  }

  var async = false;
  var returnValue = func.apply({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, rest );

  // Note: Call the callback synchronously to keep the sync flow by default
  if ( !async ) {
    cb(returnValue);
  }
}
