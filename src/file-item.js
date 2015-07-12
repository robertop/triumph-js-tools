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

/**
 * A file item is a file that contains "interesting" artifacts.
 * For example, function declarations.
 */
var FileItem = function() {

	/**
	 * Primary key
	 */
	this.FileItemId = '';

	/**
	 * The source directory that this file is a part of.
	 */
	this.SourceId = 0;

	/**
	 * The full path to the file.
	 */
	this.FullPath = '';

	/**
	 * The base name (and extension) of the file.
	 */
	this.Name = '';

	/**
	 * The date that the file was last modified.
	 */
	this.LastModified = '';

	/**
	 * 1 if the file has been parsed and resources have been found in it.
	 */
	this.IsParsed = 0;

	/**
	 * 1 if this is a 'new' file, once that only exists in Triumph's
	 * buffer. This is always zero, since we only parse files that are
	 * already in the file system.
	 *
	 * Why do we need it then? because we use the same schema as the
	 * PHP SQLite file, so that Triumph can treat the JS SQLite file
	 * the same way.
	 */
	this.IsNew = 0;
};

module.exports = FileItem;
