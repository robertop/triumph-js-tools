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
var Store = require('./store.js');
var esprima = require('esprima');
var fs = require('fs');

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

var store = new Store();
var db = store.initFile(outputFile);
var astWalker = new AstWalker();
astWalker.init(store);

function createTables(callback) {
	var create =
		'CREATE TABLE resources(' +
		'  id INTEGER NOT NULL PRIMARY KEY, ' +
		'  key TEXT NOT NULL, ' +
		'  function_name TEXT NOT NULL, ' +
		'  object_name TEXT NOT NULL, ' +
		'  line_number INTEGER NOT NULL, ' +
		'  column_position INTEGER NOT NULL ' +
		')';
	db.run(create, [], function() {
		callack();
	});
}

var storeAst = function(fileName) {
	try {
		var contents = fs.readFileSync(fileName);
		console.log('starting with ' + fileName);
		var ast = esprima.parse(contents, {loc: true});
		astWalker.walkNode(ast);
	} catch (e) {
		console.log('exception with file ' + fileName);
	}
};

function parseAndStoreDir(dir) {
	var files = fs.readdirSync(dir);
	for (var i = 0; i < files.length; i++) {
		var fullPath = dir + '/' + files[i];
		if (files[i].substr(files[i].length - 3, 3) == '.js') {
			storeAst(fullPath);
		}
		if (fs.statSync(fullPath).isDirectory()) {
			parseAndStoreDir(fullPath);
		}
	}
}

if (sourceFile && sourceExists) {
	db.serialize(function() {
		if (!outputExists) {
			createTables(function() {
				storeAst(sourceFile);
			});
		} else {
			storeAst(sourceFile);
		}
		db.close(function() {
			console.log('Done with ' + sourceFile);
		});
	});
} else if (sourceDir && sourceDirExists) {
	db.serialize(function() {
		if (!outputExists) {
			createTables(function() {
				parseAndStoreDir(sourceDir);
			});
		} else {
			parseAndStoreDir(sourceDir);
		}
		db.close(function() {
			console.log('Done with ' + sourceDir);
		});
	});
}
