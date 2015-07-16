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

var FileItemStore = require('../src/file-item-store.js');
var FileItem = require('../src/file-item.js');
var createTablesSql = require('../src/create-sql.js');
var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

/**
 * File item store tests. Note that since the SQLite3 API is async, our
 * tests need to be async. In jasmine, async tests are created
 * by calling the "done" callback that is given to each  "it"
 * spec.
 */
describe('file item store tests', function() {

	/**
	 * the object under test
	 * @var FileItemStore
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
	 * The FileItem being persisted.
	 *
	 * @var FileItem
	 */
	var fileItem;

	/**
	 * The SQL that creates tables
	 */
	var createSql = createTablesSql('resources.sql');

	beforeEach(function(done) {
		fileItem = new FileItem();
		fileItem.SourceId = 100;
		fileItem.FullPath = '/users/home/code.js';
		fileItem.Name = 'code.js';
		fileItem.LastModified = '2015-01-09 03:29:51';
		fileItem.IsParsed = 1;
		fileItem.IsNew = 0;

		store = new FileItemStore();
		db = new sqlite3.Database(':memory:');
		db.serialize(function() {
			db.exec(createSql, function(err) {
				expect(err).toBeNull();

				store.init(db);
				done();
			});
		});
	});

	it('should save a fileItem', function(done) {
		db.serialize(function() {
			var promise = store.fetchOrInsert(fileItem);
			promise.catch(function(err) {
				expect(err).toBeNull();
			})
			.then(function(newFileItem) {
				store.finalize().then(function() {

					// make sure that the param given in the callback is as expected
					expect(newFileItem).toBeDefined();
					expect(newFileItem.FileItemId).toBeDefined();
					expect(newFileItem.SourceId).toEqual(fileItem.SourceId);
					expect(newFileItem.FullPath).toEqual(fileItem.FullPath);
					expect(newFileItem.Name).toEqual(fileItem.Name);
					expect(newFileItem.LastModified).toEqual(fileItem.LastModified);
					expect(newFileItem.IsParsed).toEqual(fileItem.IsParsed);
					expect(newFileItem.IsNew).toEqual(fileItem.IsNew);

					var sql = 'SELECT COUNT(*) as cnt FROM file_items';
					db.get(sql, [], function(err, row) {
						expect(err).toBeNull();
						expect(row).toBeDefined();
						expect(row.cnt).toEqual(1);
					});

					// make sure that there is a new row
					db.get('SELECT * FROM file_items', [], function(err, row) {
						expect(err).toBeNull();

						expect(row).toBeDefined();
						expect(row.file_item_id).toBeDefined();
						expect(row.source_id).toEqual(fileItem.SourceId);
						expect(row.full_path).toEqual(fileItem.FullPath);
						expect(row.name).toEqual(fileItem.Name);
						expect(row.last_modified).toEqual(fileItem.LastModified);
						expect(row.is_parsed).toEqual(fileItem.IsParsed);
						expect(row.is_new).toEqual(fileItem.IsNew);
					});
					store.close().then(done);
				});
			});
		});
	});

	it ('should return an existing fileItem', function(done) {

		// insert a new row first, then call fetchOrInsert();
		var fileItemId = 176;
		var sql = 'INSERT INTO file_items ' +
			'(file_item_id, source_id, full_path, name, last_modified, ' +
			'is_parsed, is_new)' +
			' VALUES ' +
			'(?, ?, ?, ?, ?, ?, ?)';
		db.run(sql,
			[fileItemId, fileItem.SourceId, fileItem.FullPath,
			fileItem.Name, fileItem.LastModified, fileItem.IsParsed,
			fileItem.IsNew],
			function() {
				var promise = store.fetchOrInsert(fileItem);
				promise.catch(function(err) {
					expect(err).toBeNull();
				})
				.then(function(newFileItem) {
					store.finalize().then(function() {

						// make sure that the param given in the callback is as
						// expected
						expect(newFileItem).toBeDefined();
						expect(newFileItem.FileItemId).toEqual(fileItemId);

						// make sure that there is only 1 row
						sql = 'SELECT COUNT(*) as cnt FROM file_items';
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
