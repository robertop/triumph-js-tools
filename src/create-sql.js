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
 * Reads the contents of the given file; additionally will remove the first
 * set of comments; removing the comments is necessary so that the sql can
 * be given to sqlite.db.
 *
 * @param fileName the name of the file to read the SQL from
 * @return string the SQL code that is located inside the given file
 */
function createSql(fileName) {
	var sql = fs.readFileSync(fileName, {encoding: 'ascii'});
	var marker = 'DO NOT ADD COMMENTS AFTER THIS LINE\n---';
	var index = sql.indexOf(marker);
	if (index >= 0) {
		sql = sql.substr(index + marker.length);
	}
	return sql;
}

module.exports = createSql;
