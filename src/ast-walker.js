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
	 * keep track of inserts being done, so that we can commit
	 * batches of INSERTs
	 */
	this.insertCount = 0;

	/**
	 * Initialize the store that will be used for persisting the
	 * parsed resoures.
	 *
	 * @param store Store
	 */
	this.init = function(store) {
		this.store = store;
		this.resource = new Resource();
		this.insertCount = 0;
	};

	/**
	 * Walk down a node.  The appropriate 'walkXXX' function
	 * is called depending on the node type.
	 */
	this.walkNode = function(node) {

		// determine the function to call by concatenating
		// the node type with the 'walk' prefix
		var functionName = 'walk' + node.type;
		if (this[functionName] && functionName != 'walkNode') {
			this[functionName].call(this, node);
		}
	};

	this.walkProgram = function(node) {
		for (var i = 0; i < node.body.length; i++) {
			this.walkNode(node.body[i]);
		}
		if (this.insertCount > 0) {
			this.store.flush();
			this.insertCount = 0;
		}
	};

	this.walkFunctionDeclaration = function(node) {

		// don't store anynymous functions for now
		if (node.id !== null && node.id.type === 'Identifier') {
			this.resource.Key  = node.id.name;
			this.resource.FunctionName = node.id.name;
			this.resource.ObjectName = '';
			this.resource.LineNumber =  node.loc.start.line;
			this.resource.ColumnPosition = node.loc.start.column;

			this.store.insert(this.resource);
			this.insertCount++;
		}
		this.walkNode(node.body);
	};

	this.walkBlockStatement = function(node) {
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
			this.walkNode(decls[i]);
		}
	};

	this.walkVariableDeclarator = function(node) {
		this.resource.ObjectName = node.id.name;
		this.walkNode(node.init);
	};

	this.walkObjectExpression = function(node) {
		for (var j = 0; j < node.properties.length; j++) {
			var prop = node.properties[j];
			if (prop.value && prop.value.type == 'FunctionExpression') {
				var key = prop.key.name;
				if (this.resource.ObjectName) {
					key = this.resource.ObjectName + '.' + prop.key.name;
				}
				this.resource.Key =  key;
				this.resource.FunctionName = prop.key.name;
				this.resource.LineNumber = prop.key.loc.start.line;
				this.resource.ColumnPosition = prop.key.loc.start.column;

				this.store.insert(this.resource);
				this.insertCount++;
			}
		}
	};

	this.walkIfStatement = function(node) {
		this.walkNode(node.test);
		this.walkNode(node.consequent);
		if (node.alternate) {
			this.walkNode(node.alternate);
		}
	};

	this.walkWithStatement = function(node) {
		this.walkNode(node.object);
		this.walkNode(node.body);
	};

	this.walkSwitchStatement = function(node) {
		this.walkNode(node.discriminant);
		if (node.cases) {
			for (var i = 0; i < node.cases.length; i++) {
				this.walkNode(node.cases[i]);
				if (node.cases[i].consequent) {
					for (var  j = 0; j < node.cases[i].consequent.length; j++) {
						this.walkNode(node.cases[i].consequent[j]);
					}
				}
			}
		}
	};

	this.walkTryStatement = function(node) {
		this.walkNode(node.block);
		if (node.handlers) {
			for (var i = 0; i < node.handlers.length; i++) {
				this.walkNode(node.handlers[i]);
			}
		}
		if (node.handler) {
			this.walkNode(node.handler);
		}
		if (node.finalizer) {
			this.walkNode(node.finalizer);
		}
	};

	this.walkCatchClause = function(node) {
		this.walkNode(node.body);
	};

	this.walkWhileStatement = function(node) {
		this.walkNode(node.test);
		this.walkNode(node.body);
	};

	this.walkDoWhileStatement = function(node) {
		this.walkNode(node.test);
		this.walkNode(node.body);
	};

	this.walkForStatement = function(node) {
		if (node.init) {
			this.walkNode(node.init);
		}
		if (node.test) {
			this.walkNode(node.test);
		}
		if (node.update) {
			this.walkNode(node.update);
		}
		this.walkNode(node.body);
	};

	this.walkForInStatement = function(node) {
		this.walkNode(node.left);
		this.walkNode(node.right);
		this.walkNode(node.body);
	};

	this.walkArrayExpression = function(node) {
		if (node.elements) {

			// the WalkObjectExpression uses this
			this.resource.ObjectName = '';
			for (var i = 0; i < node.elements.length; i++) {
				this.walkNode(node.elements[i]);
			}
		}
	};

	this.walkExpressionStatement = function(node) {
		this.walkNode(node.expression);

	};

	this.walkAssignmentExpression = function(node) {
		// not computed because we want '.' expressions
		// obj.item     NOT  obj[item]
		var isFunctionAssignment =
			node.right.type === 'FunctionExpression' &&
			node.left.type == 'MemberExpression' &&
			!node.left.computed &&
			node.left.object.type === 'Identifier' &&
			node.left.property.type === 'Identifier';
		if (isFunctionAssignment) {
			var objectName = node.left.object.name;
			var functionName = node.left.property.name;
			this.resource.Key =  objectName + '.' + functionName;
			this.resource.FunctionName = functionName;
			this.resource.ObjectName = objectName;
			this.resource.LineNumber = node.left.property.loc.start.line;
			this.resource.ColumnPosition = node.left.property.loc.start.column;

			this.store.insert(this.resource);
			this.insertCount++;
		}
	};
};

module.exports = AstWalker;
