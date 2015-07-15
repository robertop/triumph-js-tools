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
var Q = require('q');
var fs = require('fs');

/**
 * @param rootDirectory string the directory to recurse
 * @param callback a function to call for every file in the directory
 *        or in any sub-directories.  Only files that end in '.js'
 *        will be called.
 */
function DirectoryIterator(callback) {

	/**
	 * function that is called for every JS file inside a directory.
	 */
	this.fileCallback = callback;

	/**
	 * calls the callback for every JS file, then recursively calls
	 * iterate() on all sub-directories.
	 * @param dir string the directory to iterate. (must have trailing slash)
	 * @return Q promise that resolves to TRUE when all sub-directories
	 *         have been recursed through
	 */
	this.iterate = function(dir) {
		var files = fs.readdirSync(dir);
		this.readFiles(dir, files);
		return Q.fcall(function() {
			return true;
		});
	};

	this.readFiles = function(dir, files) {
		for (var i = 0; i < files.length; i++) {
			var fullPath = dir + files[i];
			if (files[i].substr(files[i].length - 3, 3) == '.js') {
				this.fileCallback(fullPath);
			}
			var stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				if (fullPath.substr(fullPath.length - 1, 1) != '/') {
					fullPath += '/';
				}
				var subFiles = fs.readdirSync(fullPath);
				this.readFiles(fullPath, subFiles);
			}
		}
	};
}

module.exports = DirectoryIterator;
