'use strict';

var path = require('path');
var fs = require('fs');
var file = require('..');
var _ = require('lodash');
var helpers = require('./helpers/helpers');
var defLogger = require('../lib/logger');

var Tempdir = require('temporary/lib/dir');
var tmpdir = new Tempdir();

exports['Env()'] = {
  'setUp': function(done) {
    this.fixtures = file.createEnv({ base: path.join(__dirname, 'fixtures') });
    this.env = file.createEnv({ base: path.join(tmpdir.path, '/env/scope') });
    done();
  },
  'inherits from global file config': function(test) {
    test.expect(3);
    var logger = { bar: 'foo' };
    file.option('logger', logger);
    file.option('write', false);
    var env = file.createEnv();
    test.deepEqual(env.option('logger'), logger, 'logger should be inherited');
    test.deepEqual(env.log, file.log, 'logger should be inherited');
    test.equal(env.option('write'), false, 'write state should be inherited');
    file.option('write', true);
    file.option('logger', defLogger);
    test.done();
  },
  'read': function(test) {
    test.expect(1);
    helpers.assertTextEqual(this.fixtures.read('utf8.txt'), 'Ação é isso aí\n', test, 'file should be read from base path.');
    test.done();
  },
  'readJSON': function(test) {
    test.expect(1);
    var obj = {foo: 'Ação é isso aí', bar: ['ømg', 'pønies']};
    var fileContent = this.fixtures.readJSON('utf8.json');
    test.deepEqual(fileContent, obj, 'file should be read from base path and parsed correctly.');
    test.done();
  },
  'write': function(test) {
    test.expect(1);
    var str = 'foo bar';
    this.env.write('write.txt', str);
    test.strictEqual(fs.readFileSync(path.join(tmpdir.path, '/env/scope', 'write.txt'), 'utf8'), str, 'file should be written in the root dir.');
    test.done();
  },
  'copy': function(test) {
    test.expect(1);
    var root = 'utf8.txt';
    var dest = path.join( tmpdir.path, 'copy.txt');
    this.fixtures.copy(root, dest);

    var initial = this.fixtures.read(root);
    var copied = fs.readFileSync(dest, 'utf8');

    test.strictEqual(initial, copied, 'File should be copied from the root dir');

    test.done();
  },
  'delete': function(test) {
    test.expect(3);
    this.env.write('delete.txt', 'foo');
    test.ok(file.exists(path.join(tmpdir.path, '/env/scope', 'delete.txt')), 'file should exist');
    test.ok(this.env.delete('delete.txt'), 'return true if it delete the file');
    test.ok(!file.exists(path.join(tmpdir.path, '/env/scope', 'delete.txt')), 'file should\'ve been deleted');
    test.done();
  },
  'mkdir': function(test) {
    test.expect(2);

    test.doesNotThrow(function() {
      this.env.mkdir('aa/bb/cc');
    }.bind(this), 'Should also not explode');
    test.ok(file.isDir(this.env.fromBase('aa/bb/cc')), 'path should have been created.');

    this.env.delete('aa/bb/cc');

    test.done();
  },
  'recurse': function(test) {
    test.expect(1);
    var rootdir = this.fixtures.fromBase('expand').replace(/\\/g, '/');
    var expected = {};
    expected[rootdir + '/css/baz.css'] = [rootdir, 'css', 'baz.css'];
    expected[rootdir + '/css/qux.css'] = [rootdir, 'css', 'qux.css'];
    expected[rootdir + '/deep/deep.txt'] = [rootdir, 'deep', 'deep.txt'];
    expected[rootdir + '/deep/deeper/deeper.txt'] = [rootdir, 'deep/deeper', 'deeper.txt'];
    expected[rootdir + '/deep/deeper/deepest/deepest.txt'] = [rootdir, 'deep/deeper/deepest', 'deepest.txt'];
    expected[rootdir + '/js/bar.js'] = [rootdir, 'js', 'bar.js'];
    expected[rootdir + '/js/foo.js'] = [rootdir, 'js', 'foo.js'];
    expected[rootdir + '/README.md'] = [rootdir, undefined, 'README.md'];

    var actual = {};
    this.fixtures.recurse('expand', function(abspath, rootdir, subdir, filename) {
      actual[abspath] = [rootdir.replace(/\\/g, '/'), subdir, filename];
    });

    test.deepEqual(actual, expected, 'paths and arguments should match.');
    test.done();
  }
};

exports['Env() write filters'] = {
  'setUp': function(done) {
    this.env = file.createEnv();
    done();
  },
  '.registerWriteFilter() synchronous and apply output': function(test) {
    test.expect(3);
    var env = file.createEnv({ base: tmpdir.path });
    env.registerWriteFilter('tmp', function(file) {
      test.equal(file.path, 'foo');
      test.equal(file.contents, 'bar');
      return { path: 'simple-filter', contents: 'test' };
    });
    env.write('foo', 'bar');
    var written = env.read('simple-filter');
    test.equal(written, 'test', 'should have written the filtered file and path');
    test.done();
  },
  'pipe all filters': function(test) {
    test.expect(4);
    var env = file.createEnv({ base: tmpdir.path });
    env.registerWriteFilter('1', function(file) {
      test.equal(file.path, 'foo');
      test.equal(file.contents, 'bar');
      return { path: 'piped-filter', contents: 'test' };
    });
    env.registerWriteFilter('2', function(file) {
      test.equal(file.path, 'piped-filter');
      test.equal(file.contents, 'test');
      return file;
    });
    env.write('foo', 'bar');
    test.done();
  },
  '.removeWriteFilter()': function(test) {
    test.expect(1);
    var env = file.createEnv({ base: tmpdir.path });
    env.registerWriteFilter('broke', function(file) {
      test.ok(false);
      return { path: 'broke', contents: 'broke' };
    });
    env.removeWriteFilter('broke');
    env.write('no-filter', 'bar');
    var written = env.read('no-filter');
    test.equal(written, 'bar', 'should have removed the filter');
    test.done();
  },
  'Async write filter': function(test) {
    test.expect(2);
    var env = file.createEnv({ base: tmpdir.path });
    env._actualWrite = function(filepath, contents) {
      test.equal(filepath, 'async-write');
      test.equal(contents, 'puts async');
      test.done();
    };

    env.registerWriteFilter('async', function() {
      var done = this.async();
      setTimeout(function() {
        done({ path: 'async-write', contents: 'puts async' });
      }, 10);
    });

    env.write('foo', 'bar');
  },
  '.registerValidationFilter - passing validation': function(test) {
    test.expect(3);
    var env = file.createEnv({ base: tmpdir.path });
    env.registerValidationFilter('tmp', function(file) {
      test.equal(file.path, 'foo');
      test.equal(file.contents, 'bar');
      return true;
    });
    env.write('foo', 'bar');
    var written = env.read('simple-filter');
    test.equal(written, 'test', 'should have written the filtered file and path');
    test.done();
  },
  '.registerValidationFilter - failing validation': function(test) {
    test.expect(2);
    var env = file.createEnv({
      base: tmpdir.path,
      logger: {
        write: function() {},
        error: function(msg) {
          test.equal(msg, 'writing to failing-filter haven\'t pass validation', 'default error message is log');
        }
      }
    });
    env.registerValidationFilter('tmp', function(file) {
      return false;
    });
    env.write('failing-filter', 'bar');
    test.ok(!file.exists(env.fromBase('failing-filter')), 'should have written the filtered file and path');
    test.done();
  },
  '.registerValidationFilter - failing validation and custom error message': function(test) {
    test.expect(2);
    var env = file.createEnv({
      base: tmpdir.path,
      logger: {
        write: function() {},
        error: function(msg) {
          test.equal(msg, 'a bad error', 'custom error message is log');
        }
      }
    });
    env.registerValidationFilter('tmp', function(file) {
      return 'a bad error';
    });
    env.write('failing-filter', 'bar');
    test.ok(!file.exists(env.fromBase('failing-filter')), 'should have written the filtered file and path');
    test.done();
  }
};
