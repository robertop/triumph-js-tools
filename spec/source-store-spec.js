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

var SourceStore = require('../src/source-store.js');
var Source = require('../src/source.js');
var sqlite3 = require('sqlite3').verbose();

/**
 * Store tests. Note that since the SQLite3 API is async, our
 * tests need to be async. In jasmine, async tests are created
 * by calling the "done" callback that is given to each  "it"
 * spec.
 */
describe('source store tests', function() {

	/**
	 * the object under test
	 * @var SourceStore
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
	 * The Source being persisted.
	 *
	 * @var Source
	 */
	var source;

	beforeEach(function(done) {
		source = new Source();
		source.Directory = '/users/home';

		store = new SourceStore();
		db = new sqlite3.Database(':memory:');
		db.serialize(function() {
			var create =
				'CREATE TABLE sources(' +
				'  source_id INTEGER NOT NULL PRIMARY KEY, ' +
				'  directory TEXT NOT NULL ' +
				')';
			db.run(create, [], function(err) {
				expect(err).toBeNull();

				store.init(db);
				done();
			});
		});
	});

	it('should save a source', function(done) {
		db.serialize(function() {
			var promise = store.fetchOrInsert(source.Directory);
			promise.catch(function(err) {
				expect(err).toBeNull();
			})
			.then(function(newSource) {
				store.finalize().then(function() {

					// make sure that the param given in the callback is as expected
					expect(newSource).toBeDefined();
					expect(newSource.SourceId).toBeDefined();
					expect(newSource.Directory).toEqual(source.Directory);

					var sql = 'SELECT COUNT(*) as cnt FROM sources';
					db.get(sql, [], function(err, row) {
						expect(err).toBeNull();
						expect(row).toBeDefined();
						expect(row.cnt).toEqual(1);
					});

					// make sure that there is a new row
					db.get('SELECT * FROM sources', [], function(err, row) {
						expect(err).toBeNull();

						expect(row).toBeDefined();
						expect(row.source_id).toBeDefined();
						expect(row.directory).toEqual(source.Directory);
					});
					store.close().then(done);
				});
			});
		});
	});

	it ('should return an existing source', function(done) {

		// insert a new row first, then call fetchOrInsert();
		source.SourceId = 100;
		db.run('INSERT INTO sources(source_id, directory) VALUES(?, ?)',
			[source.SourceId, source.Directory],
			function() {
				var promise = store.fetchOrInsert(source.Directory);
				promise.catch(function(err) {
					expect(err).toBeNull();
				})
				.then(function(newSource) {
					store.finalize().then(function() {

						// make sure that the param given in the callback is as
						// expected
						expect(newSource).toBeDefined();
						expect(newSource.SourceId).toEqual(source.SourceId);
						expect(newSource.Directory).toEqual(source.Directory);

						// make sure that there is only 1 row
						var sql = 'SELECT COUNT(*) as cnt FROM sources';
						db.get(sql, [], function(err, row) {
							expect(err).toBeNull();
							expect(row).toBeDefined();
							expect(row.cnt).toEqual(1);
						});

						store.close().then(done);
					})
					.catch(function(err) {
						expect(err).toBeNull();
					});
				});
			}
		);
	});
});
