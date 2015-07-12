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
var Q = require('q');

/**
 * The File Item Store object takes care of persisting FileItem objects into
 * a SQLite database.
 */
var FileItemStore = function() {

	/**
	 * @param fileItem the FileItem object to store or retrieve
	 * @return Q promise that is resolved when the file item is stored
	 *         or fetched. The promise resolves to the new FileItem object.
	 */
	this.fetchOrInsert = function(fileItem) {
		var sql = 'SELECT file_item_id, source_id, full_path, name, ' +
			'last_modified, is_parsed, is_new ' +
			'FROM file_items ' +
			'WHERE source_id = ? AND full_path = ?';
		var params = [fileItem.SourceId, fileItem.FullPath];
		var store = this;
		var promise = Q.ninvoke(this.db, 'get', sql, params)
			.then(function(row) {
				if (!row) {
					return store.insert(fileItem);
				}
				fileItem.FileItemId = row.file_item_id;
				return fileItem;
			});
		return promise;
	};

	/**
	 * Persists the given fileItem into the store.
	 *
	 * @param fileItem the FileItem object to save
	 * @return Q promise that resolves to the item inserted, filled in
	 *         with the new file_item_id
	 */
	this.insert = function(fileItem) {
		if (!this.stmt) {
			this.stmt = this.db.prepare(
				'INSERT INTO file_items ' +
				'(source_id, full_path, name, last_modified, is_parsed, is_new) ' +
				'VALUES ' +
				'(?, ?, ?, ?, ?, ?)'
			);
		}
		var store = this;
		return Q.ninvoke(this.stmt, 'run',
			fileItem.SourceId, fileItem.FullPath, fileItem.Name,
			fileItem.LastModified, fileItem.IsParsed, fileItem.IsNew
		).then(function() {
			fileItem.FileItemId = store.stmt.lastID;
			return fileItem;
		});
	};
};

var Store = require('./store');
FileItemStore.prototype = Store;

module.exports = FileItemStore;
