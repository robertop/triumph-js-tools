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
var App = require('../src/app');
var SourceStore = require('../src/source-store');
var FileItemStore = require('../src/file-item-store');
var ResourceStore = require('../src/resource-store');
var Source = require('../src/source');
var FileItem = require('../src/file-item');
var Resource = require('../src/resource');
var AstWalker = require('../src/ast-walker');

var os = require('os');
var fs = require('fs');
var Q = require('q');
var FsHelper = require('./helpers/fs-helpers');

describe('app tests', function() {

	/**
	 * The object under test
	 * @var App
	 */
	var app;

	// the store objects; we will make assertions that the appropriate
	// store objects were called.
	var sourceStore;
	var fileItemStore;
	var resourceStore;

	var dbSpy;

	// the artifacts being stored / fetched.
	var source;
	var fileItem;
	var resource;

	// file and directory to be parsed / iterated through
	var rootDir;
	var sourceFile;

	// the spies to make assertions against
	// these spies stub out actual DB reads /writes
	var sourceSpy;
	var fileItemSpy;
	var resourceSpy;
	var resourceDeleteSpy;

	beforeEach(function() {
		sourceStore = new SourceStore();
		fileItemStore = new FileItemStore();
		resourceStore = new ResourceStore();

		source = new Source();
		fileItem = new FileItem();
		resource = new Resource();

		rootDir = os.tmpdir();
		if (rootDir.substr(rootDir.length - 1, 1) != '/') {
			rootDir += '/';
		}
		rootDir += 'app-spec/';
		sourceFile =  rootDir + 'test1.js';
		if (!rootDir) {
			console.log(
				'temp dir is not defined!! ' +
				'Not creating test files for app tests.'
			);
			return;
		}
		FsHelper.safeUnlinkSync(rootDir + 'test1.js');
		FsHelper.safeRmdirSync(rootDir);
		fs.mkdirSync(rootDir);
		fs.writeFileSync(sourceFile, 'function testMe() {}');

		sourceSpy = spyOn(sourceStore, 'fetchOrInsert').and.returnValue(
			Q.fcall(function() {
				source.SourceId = 10;
				source.Directory = rootDir;
				return source;
			})
		);

		fileItemSpy = spyOn(fileItemStore, 'fetchOrInsert').and.returnValue(
			Q.fcall(function() {
				fileItem.FileItemId = 308;
				fileItem.SourceId = source.SourceId;
				fileItem.FullPath = sourceFile;
				return fileItem;
			})
		);

		resourceSpy = spyOn(resourceStore, 'insert');
		resourceDeleteSpy = spyOn(resourceStore, 'deleteAllFromFile')
			.and.returnValue(
			Q.fcall(function() {
				return true;
			})
		);

		app = new App(sourceStore, fileItemStore, resourceStore);
	});

	it ('should store artifacts in directory', function(done) {
		app.begin(rootDir).then(function() {
			return app.iterateDir(rootDir).then(function() {
				expect(resourceSpy).toHaveBeenCalled();
				expect(resourceSpy.calls.count()).toEqual(1);
				expect(resourceSpy.calls.argsFor(0)[0].Identifier).toEqual('testMe');
				expect(resourceDeleteSpy).toHaveBeenCalledWith(fileItem.FileItemId);
				done();
			});
		}).catch(function(err) {
			expect(err).toBeNull();
		});
	});

	it ('should store artifacts in file', function(done) {
		app.begin(rootDir).then(function() {
			return app.iterateFile(sourceFile).then(function() {
				expect(resourceSpy).toHaveBeenCalled();
				expect(resourceSpy.calls.count()).toEqual(1);
				expect(resourceSpy.calls.argsFor(0)[0].Identifier).toEqual('testMe');
				expect(resourceDeleteSpy).toHaveBeenCalledWith(fileItem.FileItemId);
				done();
			});
		}).catch(function(err) {
			expect(err).toBeNull();
		});
	});
});
