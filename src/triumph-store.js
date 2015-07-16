/**
 * This software is released under the terms of the MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * @copyright  2015 Roberto Perpuly
 * @license    http://www.opensource.org/licenses/mit-license.php The MIT License
 */

var AstWalker = require('./ast-walker.js');
var ResourceStore = require('./resource-store.js');
var FileItemStore = require('./file-item-store.js');
var SourceStore = require('./source-store.js');
var FileItem = require('./file-item.js');
var Source = require('./source.js');
var App = require('./app.js');

var esprima = require('esprima');
var fs = require('fs');
var path = require('path');
var Q = require('q');

var opt = require('node-getopt').create([
	['f', 'file=ARG', 'File to parse'],
	['d', 'dir=ARG', 'Directory to parse'],
	['o', 'output=ARG', 'SQLite file to store parsed results in'],
	['h', 'help', 'display this help']
]);

var opts = opt.bindHelp().parseSystem();

if (!opts.options.file && !opts.options.dir) {
	console.log('File or dir argument is required. See --help for details.');
	process.exit(1);
}

if (!opts.options.output) {
	console.log('Output argument is required. See --help for details.');
	process.exit(1);
}
var outputFile = opts.options.output;
var sourceFile = opts.options.file;
var sourceDir = opts.options.dir;

var sourceExists = fs.existsSync(sourceFile);
var sourceDirExists = fs.existsSync(sourceDir);
if (!sourceExists && !sourceDirExists) {
	if (!sourceExists) {
		console.log('File does not exist: ' + sourceFile);
	}
	if (!sourceDirExists) {
		console.log('Directory does not exist: ' + sourceDir);
	}
	process.exit(1);
}
var outputExists = fs.existsSync(outputFile);
if (outputExists) {
	var stat = fs.statSync(outputFile);
	if (stat.isDirectory()) {
		console.log('Output file must not be a directory: ' + sourceFile);
		process.exit(1);
	}
	if (stat.isBlockDevice() || stat.isCharacterDevice() ||
		stat.isFIFO() || stat.isSocket()) {
		console.log('Outout file must not be a special file: ' + sourceFile);
		process.exit(1);
	}
}
var resourceStore = new ResourceStore();
var fileItemStore = new FileItemStore();
var sourceStore = new SourceStore();
var astWalker =  new AstWalker();
var app = new App(sourceStore, fileItemStore, resourceStore, astWalker);

var db = resourceStore.initFile(outputFile);
fileItemStore.init(db);
sourceStore.init(db);
astWalker.init(resourceStore);

/**
 * @return Q promise that resolves when the tables have been created
 *         in sqlite
 */
function createTables(ouputExists) {
	if (outputExists) {
		return Q.fcall(function() {
			return true;
		});
	}
	var createSql = fs.readFileSync('resources.sql', {encoding: 'ascii'});
	var deferred = Q.defer();
	db.exec(createSql, function() {
		deferred.resolve(true);
	});
	return deferred.promise;
}

db.serialize(function() {
	var promise = createTables(outputExists);
	if (sourceFile && sourceExists) {
		var directory = path.dirname(sourceFile);
		promise.then(function() {
			return app.begin(directory);
		}).then(function() {
			return app.iterateFile(sourceFile);
		}).then(function() {
			store.finalize();
		});
	} else if (sourceDir && sourceDirExists) {
		promise.then(function() {
			return app.begin(sourceDir);
		}).then(function() {
			return app.iterateDir(sourceDir);
		}).then(function() {
			store.finalize();
		});
	}
});
