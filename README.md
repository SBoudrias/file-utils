file-utils [![](https://travis-ci.org/SBoudrias/file-utils.png)](https://travis-ci.org/SBoudrias/file-utils)
==========

This is a Grunt.file forks to allow the creation of scoped file utilities and the ability to add write filters.

Same as Grunt.file, this is a set of _synchronous_ utility. As so, it should **never** be used on a Node.js server. This is meant for users/command line utilities.


ENV scope and filters
=========

### Creating an Env - file#createEnv([ options ]);

```javascript
var file = require('file-utils');

var env = file.createEnv({
  base: 'my/scoped/path'
});
```

`file-utils` root module options are inherited by the `Env` instance if not overwritten in the option hash.

Write Filters
---------

Write filters are applied on `env.write` and `env.copy`.

They're used to modifiy the content or the filepath of a file.

#### Add a write filter - `env.registerWriteFilter( name, filter )`

**options**
- `name` (String): The name under which registering the filter
- `filter` (Function): The filter function

The filter function take a file object as parameter. This file object is a hash containing a `path` and a `contents` property. You can modify these two property as you like and returning the modified object.

```javascript
env.registerWriteFilter( 'coffee', function( file ) {
  if (!path.extname(file) !== '.js') return file;

  file.path = file.path.replace(/(\.js)$/, '.coffee');
  file.content = convertJsToCoffee( file.contents );

  return file;
});
```

#### Remove a write filter - `env.removeWriteFilter( name )`

```javascript
env.removeWriteFilter('coffee');
```

#### Async filter

The filter can also be asynchronous. This is done by calling `this.async()` and passing the return value to the callback provided.

```javascript
env.registerWriteFilter( 'coffee', function( file ) {
  var done = this.async();

  // some process
  setTimeout(function() {
    done({ path: '/newfile', contents: 'filtered content' });
  }, 1000);
});
```

**Caution:** Using an asynchronous filter will change the way write and copy method are called to. This will make both of those method to run asynchronously too.

Validation Filters
----------

Validation filters are applied on `env.write` and `env.copy`.

They're used to allow or disallow the write action.

#### Add a validation filter - `env.registerValidationFilter( name, filter )`

**options**
- `name` (String): The name under which registering the filter
- `filter` (Function): The filter function

The filter function take a file object as parameter. This file object is a hash containing a `path` and a `contents` property.

Return `true` to allow the file to be written. Return `false` or an error message `String` to disallow the write action.

```javascript
env.registerWriteFilter( 'checkConflicts', function( toOutput ) {
  if ( file.exist(toOutput.path) ) {
    return 'file is already present';
  }
  return true;
});
```

Just like the write filters, [this filter can be asynchronous]().

#### Remove a write filter - `env.removeValidationFilter( name )`

```javascript
env.removeValidationFilter('checkConflicts');
```



File API
=========

Upcoming. Meanwhile, check [Grunt.file documentation](http://gruntjs.com/api/grunt.file).

#### Setting options - `file.option( name, [ value ])`

```
// Set option
file.option('write', false);

// Get option
file.option('write');
```

**Available Options**
- `write` (Boolean): If write is set to `false`, then no file will be written or deleted. Useful for test run without side effets.
- `logger` (Logger object): Used internally to log information to the console. **API still work in progress**
- `encoding` (String): Defaults `utf8`. Set the default encoding used for reading/writing. Note most methods allow you to overwridde it for a single run.
- `force` (Boolean): `force: true` Force the deletion of folders and file outside the utility scope (or CWD if no scope).

Todos
=========

- Real Logging system
- Scoping the destination when copying
