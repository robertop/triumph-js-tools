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
var fs = require('fs');
var DirectoryIterator = require('./directory-iterator');
var Source = require('./source');
var FileItem = require('./file-item');
var Resource = require('./resource');
var path = require('path');
var esprima = require('esprima');

/**
 * The App object is the main entry point into the application.  It will
 * take care of initializing the SQLite db, iterating through files, parsing
 * code into AST, and storing each artifact in the appropriate table.
 */
function App(sourceStore, fileItemStore, resourceStore, astWalker) {

	// the 'store' objects take care of inserting / fetching from
	// SQLite
	this.resourceStore = resourceStore;
	this.fileItemStore = fileItemStore;
	this.sourceStore = sourceStore;

	/**
	 * The interesting artifacts to be stored
	 */
	var fileItem = new FileItem();
	var source = new Source();

	this.begin = function(directory) {
		return this.sourceStore.fetchOrInsert(directory)
			.then(function(sourceObj) {
				source = sourceObj;
				fileItem.SourceId = source.SourceId;
				return true;
			});
	};

	/**
	 * Recurse an entire directory structure, parsing each file and
	 * storing interesting artifacts along the way.
	 *
	 * @param directory string full path to the directory to recurse
	 * @return Q promise that is resolved when the recursion completes
	 */
	this.iterateDir = function(directory) {
		var iterator = new DirectoryIterator(this.iterateFile);
		return iterator.iterate(directory);
	};

	/**
	 * This function will parse the given file, recurse down the AST, and
	 * save interesting artifacts into the stores. If the file contains
	 * a javascript syntax error, then nothing is stored.
	 *
	 * @param fullPath location of the file to parse, must be a javascript file
	 * @return Q promise that resolves when the file has been parsed
	 */
	this.iterateFile = function(fullPath) {
		fileItem.SourceId = source.SourceId;
		fileItem.FullPath = fullPath;
		fileItem.Name = path.basename(fullPath);
		fileItem.LastModified = new Date().toString();
		fileItem.IsParsed = 1;
		return fileItemStore.fetchOrInsert(fileItem)
			.then(function(newFileItem) {
				astWalker.setFileAndSource(newFileItem, source);
				try {
					var contents = fs.readFileSync(fullPath);
					var ast = esprima.parse(contents, {loc: true});
					astWalker.walkNode(ast);
				} catch (e) {
					var msg = 'exception with file ' + fullPath + ':' +
						e.fileName +  ' on line ' + e.line_number;
					console.log(msg);
					console.log(e);
					console.log(e.stack);
				}
				return true;
			});
	};
}

module.exports = App;
