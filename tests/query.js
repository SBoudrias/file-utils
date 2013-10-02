'use strict';

var fquery = require('../lib/query');

var fs = require('fs');
var path = require('path');

var Tempfile = require('temporary/lib/file');
var Tempdir = require('temporary/lib/dir');

var tmpdir = new Tempdir();
fs.symlinkSync(path.resolve('tests/fixtures/octocat.png'), path.join(tmpdir.path, 'octocat.png'), 'file');
fs.symlinkSync(path.resolve('tests/fixtures/expand'), path.join(tmpdir.path, 'expand'), 'dir');

exports['file'] = {
  'exists': function(test) {
    test.expect(6);
    test.ok(fquery.exists('tests/fixtures/octocat.png'), 'files exist.');
    test.ok(fquery.exists('tests', 'fixtures', 'octocat.png'), 'should work for paths in parts.');
    test.ok(fquery.exists('tests/fixtures'), 'directories exist.');
    test.ok(fquery.exists(path.join(tmpdir.path, 'octocat.png')), 'file links exist.');
    test.ok(fquery.exists(path.join(tmpdir.path, 'expand')), 'directory links exist.');
    test.equal(fquery.exists('tests/fixtures/does/not/exist'), false, 'nonexistent files do not exist.');
    test.done();
  },
  'isLink': function(test) {
    test.expect(6);
    test.equals(fquery.isLink('tests/fixtures/octocat.png'), false, 'files are not links.');
    test.equals(fquery.isLink('tests/fixtures'), false, 'directories are not links.');
    test.ok(fquery.isLink(path.join(tmpdir.path, 'octocat.png')), 'file links are links.');
    test.ok(fquery.isLink(path.join(tmpdir.path, 'expand')), 'directory links are links.');
    test.ok(fquery.isLink(tmpdir.path, 'octocat.png'), 'should work for paths in parts.');
    test.equals(fquery.isLink('tests/fixtures/does/not/exist'), false, 'nonexistent files are not links.');
    test.done();
  },
  'isDir': function(test) {
    test.expect(6);
    test.equals(fquery.isDir('tests/fixtures/octocat.png'), false, 'files are not directories.');
    test.ok(fquery.isDir('tests/fixtures'), 'directories are directories.');
    test.ok(fquery.isDir('tests', 'fixtures'), 'should work for paths in parts.');
    test.equals(fquery.isDir(path.join(tmpdir.path, 'octocat.png')), false, 'file links are not directories.');
    test.ok(fquery.isDir(path.join(tmpdir.path, 'expand')), 'directory links are directories.');
    test.equals(fquery.isDir('tests/fixtures/does/not/exist'), false, 'nonexistent files are not directories.');
    test.done();
  },
  'isFile': function(test) {
    test.expect(6);
    test.ok(fquery.isFile('tests/fixtures/octocat.png'), 'files are files.');
    test.ok(fquery.isFile('tests', 'fixtures', 'octocat.png'), 'should work for paths in parts.');
    test.equals(fquery.isFile('tests/fixtures'), false, 'directories are not files.');
    test.ok(fquery.isFile(path.join(tmpdir.path, 'octocat.png')), 'file links are files.');
    test.equals(fquery.isFile(path.join(tmpdir.path, 'expand')), false, 'directory links are not files.');
    test.equals(fquery.isFile('tests/fixtures/does/not/exist'), false, 'nonexistent files are not files.');
    test.done();
  },
  'isPathAbsolute': function(test) {
    test.expect(5);
    test.ok(fquery.isPathAbsolute(path.resolve('/foo')), 'should return true');
    test.ok(fquery.isPathAbsolute(path.resolve('/foo') + path.sep), 'should return true');
    test.equal(fquery.isPathAbsolute('foo'), false, 'should return false');
    test.ok(fquery.isPathAbsolute(path.resolve('tests/fixtures/a.js')), 'should return true');
    test.equal(fquery.isPathAbsolute('tests/fixtures/a.js'), false, 'should return false');
    test.done();
  },
  'arePathsEquivalent': function(test) {
    test.expect(5);
    test.ok(fquery.arePathsEquivalent('/foo'), 'should return true');
    test.ok(fquery.arePathsEquivalent('/foo', '/foo/', '/foo/../foo/'), 'should return true');
    test.ok(fquery.arePathsEquivalent(process.cwd(), '.', './', 'tests/..'), 'should return true');
    test.equal(fquery.arePathsEquivalent(process.cwd(), '..'), false, 'should return false');
    test.equal(fquery.arePathsEquivalent('.', '..'), false, 'should return false');
    test.done();
  },
  'doesPathContain': function(test) {
    test.expect(6);
    test.ok(fquery.doesPathContain('/foo', '/foo/bar'), 'should return true');
    test.ok(fquery.doesPathContain('/foo/', '/foo/bar/baz', '/foo/bar', '/foo/whatever'), 'should return true');
    test.equal(fquery.doesPathContain('/foo', '/foo'), false, 'should return false');
    test.equal(fquery.doesPathContain('/foo/xyz', '/foo/xyz/123', '/foo/bar/baz'), false, 'should return false');
    test.equal(fquery.doesPathContain('/foo/xyz', '/foo'), false, 'should return false');
    test.ok(fquery.doesPathContain(process.cwd(), 'test', 'tests/fixtures', 'lib'), 'should return true');
    test.done();
  },
  'isPathCwd': function(test) {
    test.expect(8);
    test.ok(fquery.isPathCwd(process.cwd()), 'cwd is cwd');
    test.ok(fquery.isPathCwd('.'), 'cwd is cwd');
    test.equal(fquery.isPathCwd('tests'), false, 'subdirectory is not cwd');
    test.equal(fquery.isPathCwd(path.resolve('test')), false, 'subdirectory is not cwd');
    test.equal(fquery.isPathCwd('..'), false, 'parent is not cwd');
    test.equal(fquery.isPathCwd(path.resolve('..')), false, 'parent is not cwd');
    test.equal(fquery.isPathCwd('/'), false, 'root is not cwd (I hope)');
    test.equal(fquery.isPathCwd('nonexistent'), false, 'nonexistent path is not cwd');
    test.done();
  },
  'isPathInCwd': function(test) {
    test.expect(8);
    test.equal(fquery.isPathInCwd(process.cwd()), false, 'cwd is not IN cwd');
    test.equal(fquery.isPathInCwd('.'), false, 'cwd is not IN cwd');
    test.ok(fquery.isPathInCwd('tests'), 'subdirectory is in cwd');
    test.ok(fquery.isPathInCwd(path.resolve('tests')), 'subdirectory is in cwd');
    test.equal(fquery.isPathInCwd('..'), false, 'parent is not in cwd');
    test.equal(fquery.isPathInCwd(path.resolve('..')), false, 'parent is not in cwd');
    test.equal(fquery.isPathInCwd('/'), false, 'root is not in cwd (I hope)');
    test.equal(fquery.isPathInCwd('nonexistent'), false, 'nonexistent path is not in cwd');
    test.done();
  },
};
