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
    test.expect(2);
    var logger = { bar: 'foo' };
    file.option('logger', logger);
    file.option('write', false);
    var env = file.createEnv();
    test.deepEqual(env.option('logger'), logger, 'logger should be inherited');
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
