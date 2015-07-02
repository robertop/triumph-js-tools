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

var Store = require('../src/store.js');
var Resource = require('../src/resource.js');
var sqlite3 = require('sqlite3').verbose();

/**
 * Store tests. Note that since the SQLite3 API is async, our
 * tests need to be async. In jasmine, async tests are created
 * by calling the "done" callback that is given to each  "it"
 * spec.
 */
describe('store tests', function() {

	/**
	 * the object under test
	 * @var Store
	 */
	var store;

	/**
	 * The opened connection handle to use for testing
	 * This is an handle to an in-memory DB
	 *
	 * @var sqlite3.Database
	 */
	var db;

	/**
	 * The resource being persited.
	 *
	 * @var Resource
	 */
	var resource;

	beforeEach(function(done) {
		resource = new Resource();
		resource.Key = 'query.searchbyname';
		resource.FunctionName = 'searchByName';
		resource.ObjectName = 'Query';
		resource.LineNumber = 49;
		resource.ColumnPosition =  23;

		store = new Store();
		db = new sqlite3.Database(':memory:');
		db.serialize(function() {
			var create =
				'CREATE TABLE resources(' +
				'  id INTEGER NOT NULL PRIMARY KEY, ' +
				'  key TEXT NOT NULL, ' +
				'  function_name TEXT NOT NULL, ' +
				'  object_name TEXT NOT NULL, ' +
				'  line_number INTEGER NOT NULL, ' +
				'  column_position INTEGER NOT NULL ' +
				')';
			db.run(create, [], function(err) {
				expect(err).toBeNull();

				store.init(db);
				done();
			});
		});
	});

	it('should save a resource', function(done) {
		store.insert(resource);
		store.flush();
		db.serialize(function() {
			db.get('SELECT COUNT(*) as cnt FROM resources', [], function(err, row) {
				expect(err).toBeNull();
				expect(row).toBeDefined();
				expect(row.cnt).toEqual(1);
			});

			// make sure that there is a new row
			db.get('SELECT * FROM resources', [], function(err, row) {
				expect(err).toBeNull();

				expect(row).toBeDefined();
				expect(row.id).toBeDefined();
				expect(row.key).toEqual(resource.Key);
				expect(row.function_name).toEqual(resource.FunctionName);
				expect(row.object_name).toEqual(resource.ObjectName);
				expect(row.line_number).toEqual(resource.LineNumber);
				expect(row.column_position).toEqual(resource.ColumnPosition);
			});

			db.close(function(err) {
				expect(err).toBeNull();
				done();
			});
		});
	});
});
