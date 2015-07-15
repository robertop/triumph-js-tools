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
var DirectoryIterator = require('../src/directory-iterator');
var fs = require('fs');
var os = require('os');
var FsHelper = require('./helpers/fs-helpers');

describe('directory iterator tests', function() {

	/**
	 * The object under test
	 * @var DirectoryIterator
	 */
	var directoryIterator;

	/**
	 * Keep track of the files that the iterator gives us.
	 * We will make assertions against this array.
	 * @var Array
	 */
	var filesCalled;

	/**
	 * @var string full path to a directory used for testing
	 *      this test will create/delete the directory
	 */
	var rootDir;

	beforeEach(function() {
		rootDir = os.tmpdir();
		if (rootDir.substr(rootDir.length - 1, 1) != '/') {
			rootDir += '/';
		}
		rootDir += 'directory-iterator-spec/';
		if (!rootDir) {
			console.log(
				'temp dir is not defined!! ' +
				'Not creating test files for directory iterator tests.'
			);
			return;
		}

		// delete test files if they exist
		FsHelper.safeUnlinkSync(rootDir + 'sub2/test3.js');
		FsHelper.safeUnlinkSync(rootDir + 'sub1/test2.js');
		FsHelper.safeRmdirSync(rootDir + 'sub2/');
		FsHelper.safeRmdirSync(rootDir + 'sub1/');
		FsHelper.safeUnlinkSync(rootDir + 'test1.js');
		FsHelper.safeRmdirSync(rootDir);

		// create a dir with 2 sub dirs
		fs.mkdirSync(rootDir);
		fs.mkdirSync(rootDir + 'sub1/');
		fs.mkdirSync(rootDir + 'sub2/');
		fs.writeFileSync(rootDir + 'test1.js', '');
		fs.writeFileSync(rootDir + 'sub1/test2.js', '');
		fs.writeFileSync(rootDir + 'sub2/test3.js', '');

		// create out system under test
		filesCalled = [];
		directoryIterator = new DirectoryIterator(function(fullPath) {
			filesCalled.push(fullPath);
		});
	});

	it ('should iterate through sub-directories', function(done) {
		directoryIterator.iterate(rootDir)
			.then(function() {
				expect(filesCalled.length).toEqual(3);

				// don't guarantee any particular order
				expect(filesCalled).toContain(rootDir + 'test1.js');
				expect(filesCalled).toContain(rootDir + 'sub1/test2.js');
				expect(filesCalled).toContain(rootDir + 'sub2/test3.js');
				done();
			})
			.catch(function(error) {
				expec(error).toBeNull();
				done();
			});
	});
});
