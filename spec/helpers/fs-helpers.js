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

/**
 * remove the give file, if it does not exist then do
 * nothing. This function is 'safe' in that an error will
 * NOT be generated if the file does not exist.
 *
 * @param fullPath string full path to the file to delete
 */
function safeUnlinkSync(fullPath) {
	if (fs.existsSync(fullPath)) {
		fs.unlinkSync(fullPath);
	}
}

/**
 * remove the give directory, if it does not exist then do
 * nothing. This function is 'safe' in that an error will
 * NOT be generated if the directory does not exist.
 *
 * @param fullPath string full path to the directory to delete
 */
function safeRmdirSync(fullPath) {
	if (fs.existsSync(fullPath)) {
		fs.rmdirSync(fullPath);
	}
}

module.exports = {
	safeUnlinkSync: safeUnlinkSync,
	safeRmdirSync: safeRmdirSync
};
