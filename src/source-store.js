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
var Source = require('./source');
var Q = require('q');

/**
 * The Source Store object takes care of persisting source objects into
 * a SQLite database.
 */
var SourceStore = function() {

	/**
	 * Fetch the source row whose directory column contains the given
	 * directory; if the directory does not exist in the sources table
	 * then a new row is inserted.
	 *
	 * @param directory string directory to fetch/insert.Note that comparison
	 *        of directories is case-sensitive.
	 * @return Q promise that resolves after the DB operations; the promise
	 *        will be given the source object.
	 *        The Source object that contains the newly created source ID.
	 */
	this.fetchOrInsert = function(directory, callback) {
		var sql = 'SELECT source_id, directory FROM sources WHERE directory = ?';
		var sourceStore = this;
		var source = new Source();
		var promise = Q.ninvoke(this.db, 'get', sql, [directory]);
		return promise.then(function(row) {
			if (!row) {
				source.Directory = directory;
				return sourceStore.insert(source);
			} else {
				source.Directory = row.directory;
				source.SourceId = row.source_id;
				return source;
			}
		});
	};

	/**
	 * Persists the given Source into the store.
	 *
	 * @param source the Source object to save
	 * @return Q promise that gets resolved after the insert
	 *        succeeds.The resolved Source object contains the
	  *       newly created source ID.
	 */
	this.insert = function(source) {
		if (!this.stmt) {
			this.stmt = this.db.prepare(
				'INSERT INTO sources ' +
				'(directory) ' +
				'VALUES ' +
				'(?)'
			);
		}
		var store = this;
		return Q.ninvoke(this.stmt, 'run', source.Directory)
			.then(function(row) {
				source.SourceId = store.stmt.lastID;
				return source;
			});
	};
};

var Store = require('./store');
SourceStore.prototype = Store;

module.exports = SourceStore;
