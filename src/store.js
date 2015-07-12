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
 * The Store object is an object that wraps a SQLite3 prepared statement. This
 * object is not really meant to be used by itself, it is meant to be added
 * to an object's prorotype chain.
 * This protype will need 2 properties to be defined:
 *
 * db - the SQLite3 db connection handle.
 * stmt - the SQLite3 statement handle.
 */
var Store = {

	/**
	 * Intiialize the store with a sqlite database from
	 * a file system file.
	 *
	 * @param sqliteFileName the full path to a SQLite file; if the
	 *        the file does not exist then it will be created.
	 * @return sqlite3.Database so that the execution mode can be
	 *         set.
	 */
	initFile: function(sqliteFileName) {
		var db = new sqlite3.Database(sqliteFileName);
		this.init(db);
		return db;
	},

	/**
	 * Initialize the store with a previously opened SQLite connection
	 * handle.
	 *
	 * @param db an opened SQLite database handle
	 */
	init: function(db) {
		this.db = db;
	},

	/**
	 * @return Q a promise that resolves when the statement has been finalized
	 */
	finalize: function() {
		if (this.stmt) {
			var store = this;
			var promise = Q.ninvoke(this.stmt, 'finalize');
			return promise.then(function() {
				store.stmt = null;
				return true;
			});
		}
		return Q.fcall(function() {
			return true;
		});
	},

	/**
	 * @return Q a promise that resolves when the connection has been closed
	 */
	close: function() {
		var promise = this.finalize();
		if (this.db) {
			var store = this;
			promise.then(function() {
				return Q.ninvoke(store.db, 'close');
			});
		}
		return promise;
	}
};

module.exports = Store;
