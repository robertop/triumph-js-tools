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

var Resource = require('./resource.js');

/**
 * The AST Walker recurses down a pased AST tree and saves important
 * artifacts into a store. The important artifacts:
 *
 * Function declarations
 *
 * The AST is assumed to be an "ES Tree" AST that supports EcmaScript 5
 * grammar.  The AST spec can be found at
 *
 * https://github.com/estree/estree/blob/master/spec.md
 *
 * Much of the language used in AstWalker assumes familiarity with the
 * above-named spec.
 */
var AstWalker = function() {

	/**
	 * The object used to store resources into a SQLite db
	 *
	 * @var Store
     */
	this.store = null;

	/**
	 * The resource that will be filled in as we walk
	 * the AST
	 *
	 * @var Resource
	 */
	this.resource = null;

	/**
	 * Initialize the store that will be used for persisting the
	 * parsed resoures.
	 *
	 * @param store Store
	 */
	this.init = function(store) {
		this.store = store;
		this.resource = new Resource();
	};

	/**
	 * Walk down a node.  The appropriate 'walkXXX' function
	 * is called depending on the node type.
	 */
	this.walkNode = function(node) {
		switch(node.type) {
			case 'Program':
				this.walkProgram(node);
				break;
			case 'FunctionDeclaration':
				this.walkFunction(node);
				break;
			case 'FunctionExpression':
				this.walkFunctionExpression(node);
				break;
			case 'VariableDeclaration':
				this.walkVariableDeclaration(node);
			default:
				break;
		};
	};

	this.walkProgram = function(node) {
		for (var i = 0; i < node.body.length; i++) {
			this.walkNode(node.body[i]);
		}
		if (node.body.length) {
			this.store.flush();
		}
	};

	this.walkFunction = function(node) {

		// don't store anynymous functions for now
		if (node.id != null && node.id.type === 'Identifier') {
			this.resource.Key  = node.id.name;
			this.resource.FunctionName = node.id.name;
			this.resource.ObjectName = '';
			this.resource.LineNumber =  node.loc.start.line;
			this.resource.ColumnPosition = node.loc.start.column;

			this.store.insert(this.resource);
		}
		this.walkBlock(node.body);
	};

	this.walkBlock = function(node) {
		for (var i = 0; i < node.body.length; i++) {
			this.walkNode(node.body[i]);
		}
	};

	this.walkFunctionExpression = function(node) {
		this.walkBlock(node.body);
	};

	this.walkVariableDeclaration = function(node) {
		var decls = node.declarations;
		for (var i = 0; i < decls.length; i++) {
			var decl = decls[i];
			if (decl.type  == 'VariableDeclarator') {
				var objectName = decl.id.name;
				if (decl.init && decl.init.type == 'ObjectExpression') {
					for (var j = 0; j < decl.init.properties.length; j++) {
						var prop = decl.init.properties[j];
						if (prop.value && prop.value.type == 'FunctionExpression') {

							this.resource.Key =  objectName + '.' + prop.key.name;
							this.resource.FunctionName = prop.key.name;
							this.resource.ObjectName = objectName;
							this.resource.LineNumber = prop.key.loc.start.line;
							this.resource.ColumnPosition = prop.key.loc.start.column;

							this.store.insert(this.resource);
						}
					}
				}
			}
		}
	}
};

module.exports = AstWalker;
