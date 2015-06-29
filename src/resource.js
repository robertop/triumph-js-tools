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
 * A resoure is an "interesting" artifact from source code.
 * For example, function declarations.
 *
 */
var Resource = function() {

	/**
	 * Key is a unique string used to uniquely identify
	 * this resource; the function name or a concatenation
	 * of the function name and the object it's a part
	 * of.
	 */
	this.Key = '';

	/**
	 * The name of the function.
	 */
	this.FunctionName = '';

	/**
	 * The name of the object.
	 */
	this.ObjectName = '';

	/**
	 * The line number (1-based) where this resource
	 * was declared in.
	 */
	this.LineNumber = 1;

	/**
	 * The column number (0-based) where this resource
	 * was declared in. The column number of 0 is the
	 * start of a line.
	 */
	this.ColumnPosition  = 0;
};

module.exports = Resource;
