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

var sqlite3 = require('sqlite3').verbose();

/**
 * The Store object takes care of persisting Resource objects into
 * a SQLite database.
 */
function ResourceStore() {

	/**
	 * The opened connection handle.
	 */
	this.db = null;

	/**
	 * The prepared statement used for INSERTs
	 */
	this.stmt = null;

	/**
	 * Persists the given resource into the store.
	 *
	 * @param resource the resource object to save
	 */
	this.insert = function(resource) {
		if (!this.stmt) {
			this.stmt = this.db.prepare(
				'INSERT INTO resources ' +
				'(file_item_id, source_id, key, identifier, signature, ' +
				'comment, line_number, column_position) ' +
				'VALUES ' +
				'(?, ?, ?, ?, ?, ?, ?, ?)'
			);
		}
		this.stmt.run(
			resource.FileItemId, resource.SourceId, resource.Key,
			resource.Identifier, resource.Signature,
			resource.Comment,
			resource.LineNumber, resource.ColumnPosition
		);
	};
}

var Store = require('./store');
ResourceStore.prototype = Store;

module.exports = ResourceStore;
