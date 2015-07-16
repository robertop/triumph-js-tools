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
	 * @var ResourceStore
     */
	this.store = null;

	/**
	 * the file item ID of the current file being parsed
	 *
	 * @var number
	 */
	this.fileItemId = 0;

	/**
	 * the source ID of the current file being parsed; link to
	 * the source directory that the current file being parsed
	 *
	 * @var number
	 */
	this.sourceId = 0;

	/**
	 * unparse function parameters into a function signature
	 *
	 * @param name string the function name
	 * @param array of parameters
	 * @return string a function signature; example "function doWork(arg, argTwo)"
	 */
	var makeSignature = function(name, params) {
		var sig = 'function ' + name + '(';
		if (params && params.length) {
			for (var i = 0; i < params.length; i++) {
				if (params[i].type === 'Identifier') {
					sig += params[i].name;
					if (i < (params.length - 1)) {
						sig += ', ';
					}
				}
			}
		}
		sig += ')';
		return sig;
	};

	/**
	 * Find the given function's comment; we will assign a comment to a function
	 * if a comment ends at the line where the function starts (or 1 line before)
	 *
	 * @param functionLineNumber number the line number where the function starts
	 * @param comments array of comment nodes (see esparse app)
	 * @return string
	 */
	var findComment = function(functionLineNumber, comments) {
		var comment = '';
		if (comments && comments.length) {
			for (var i = 0; i < comments.length; i++) {
				if (comments[i].loc.end.line === functionLineNumber ||
					comments[i].loc.end.line === (functionLineNumber - 1)) {
					comment = comments[i].value;
					break;
				}
			}
		}
		return comment;
	};

	/**
	 * Initialize the store that will be used for persisting the
	 * parsed resoures.
	 *
	 * @param store ResourceStore
	 */
	this.init = function(store) {
		this.store = store;
	};

	/**
	 * link resources to file and source directory
	 *
	 * @param fileItem a FileItem object
	 * @param source a Source object
	 */
	this.setFileAndSource = function(fileItem, source) {
		this.fileItemId = fileItem.FileItemId;
		this.sourceId = source.SourceId;
	};

	/**
	 * Walk down a node.  The appropriate 'walkXXX' function
	 * is called depending on the node type.
	 */
	this.walkNode = function(node, comments) {
		if (!node || !node.type) {
			return;
		}
		// determine the function to call by concatenating
		// the node type with the 'walk' prefix
		var functionName = 'walk' + node.type;
		if (this[functionName] && functionName != 'walkNode') {
			this[functionName].call(this, node, comments);
		}
	};

	this.walkProgram = function(node, comments) {
		for (var i = 0; i < node.body.length; i++) {
			this.walkNode(node.body[i], comments);
		}
	};

	this.walkFunctionDeclaration = function(node, comments) {

		// don't store anynymous functions for now
		if (node.id !== null && node.id.type === 'Identifier') {
			var resource = new Resource();
			resource.Key  = node.id.name;
			resource.Identifier = node.id.name;
			resource.Signature = makeSignature(node.id.name, node.params);
			resource.Comment = findComment(node.loc.start.line, comments);
			resource.LineNumber =  node.loc.start.line;
			resource.ColumnPosition = node.loc.start.column;
			resource.FileItemId = this.fileItemId;
			resource.SourceId = this.sourceId;

			this.store.insert(resource);
		}
		this.walkNode(node.body, comments);
	};

	this.walkBlockStatement = function(node, comments) {
		for (var i = 0; i < node.body.length; i++) {
			this.walkNode(node.body[i], comments);
		}
	};

	this.walkFunctionExpression = function(node, comments) {
		if (node.body) {
			this.walkNode(node.body, comments);
		}
	};

	this.walkVariableDeclaration = function(node, comments) {
		var decls = node.declarations;
		for (var i = 0; i < decls.length; i++) {
			this.walkNode(decls[i], comments);
		}
	};

	this.walkVariableDeclarator = function(node, comments) {
		if (node.init) {
			this.ObjectName = node.id.name;
			this.walkNode(node.init, comments);
		}
	};

	this.walkObjectExpression = function(node, comments) {
		for (var j = 0; j < node.properties.length; j++) {
			var prop = node.properties[j];
			if (prop.value &&
				prop.value.type == 'FunctionExpression' &&
				prop.key.type === 'Identifier') {
				var key = prop.key.name;
				if (this.ObjectName) {
					key = this.ObjectName + '.' + prop.key.name;
				}
				var resource = new Resource();
				resource.Key =  key;
				resource.Identifier = prop.key.name;
				resource.Signature = makeSignature(
					prop.key.name, prop.value.params
				);
				resource.Comment = findComment(prop.key.loc.start.line, comments);
				resource.LineNumber = prop.key.loc.start.line;
				resource.ColumnPosition = prop.key.loc.start.column;
				resource.FileItemId = this.fileItemId;
				resource.SourceId = this.sourceId;

				this.store.insert(resource);
			}
		}
	};

	this.walkIfStatement = function(node, comments) {
		this.walkNode(node.test, comments);
		this.walkNode(node.consequent, comments);
		if (node.alternate) {
			this.walkNode(node.alternate, comments);
		}
	};

	this.walkWithStatement = function(node, comments) {
		this.walkNode(node.object, comments);
		this.walkNode(node.body, comments);
	};

	this.walkSwitchStatement = function(node, comments) {
		this.walkNode(node.discriminant, comments);
		if (node.cases) {
			var i;
			var j;
			for (i = 0; i < node.cases.length; i++) {
				this.walkNode(node.cases[i], comments);
				if (node.cases[i].consequent) {
					for (j = 0; j < node.cases[i].consequent.length; j++) {
						this.walkNode(node.cases[i].consequent[j], comments);
					}
				}
			}
		}
	};

	this.walkTryStatement = function(node, comments) {
		this.walkNode(node.block, comments);
		if (node.handlers) {
			for (var i = 0; i < node.handlers.length; i++) {
				this.walkNode(node.handlers[i], comments);
			}
		}
		if (node.handler) {
			this.walkNode(node.handler, comments);
		}
		if (node.finalizer) {
			this.walkNode(node.finalizer, comments);
		}
	};

	this.walkCatchClause = function(node, comments) {
		this.walkNode(node.body, comments);
	};

	this.walkWhileStatement = function(node, comments) {
		this.walkNode(node.test, comments);
		this.walkNode(node.body, comments);
	};

	this.walkDoWhileStatement = function(node, comments) {
		this.walkNode(node.test, comments);
		this.walkNode(node.body, comments);
	};

	this.walkForStatement = function(node, comments) {
		if (node.init) {
			this.walkNode(node.init, comments);
		}
		if (node.test) {
			this.walkNode(node.test, comments);
		}
		if (node.update) {
			this.walkNode(node.update, comments);
		}
		this.walkNode(node.body, comments);
	};

	this.walkForInStatement = function(node, comments) {
		this.walkNode(node.left, comments);
		this.walkNode(node.right, comments);
		this.walkNode(node.body, comments);
	};

	this.walkArrayExpression = function(node, comments) {
		if (node.elements) {

			// the WalkObjectExpression uses this
			this.ObjectName = '';
			for (var i = 0; i < node.elements.length; i++) {
				this.walkNode(node.elements[i], comments);
			}
		}
	};

	this.walkExpressionStatement = function(node, comments) {
		this.walkNode(node.expression, comments);

	};

	this.walkAssignmentExpression = function(node, comments) {
		// not computed because we want '.' expressions
		// obj.item     NOT  obj[item]
		var isFunctionAssignment =
			node.right.type === 'FunctionExpression' &&
			node.left.type == 'MemberExpression' &&
			!node.left.computed &&
			node.left.object.type === 'Identifier' &&
			node.left.property.type === 'Identifier';
		var isThisFunctionAssignment =
			node.right.type === 'FunctionExpression' &&
			node.left.type == 'MemberExpression' &&
			!node.left.computed &&
			node.left.object.type === 'ThisExpression' &&
			node.left.property.type === 'Identifier';
		var functionName = '';
		var resource = new Resource();
		resource.FileItemId = this.fileItemId;
		resource.SourceId = this.sourceId;
		if (isFunctionAssignment) {
			var objectName = node.left.object.name;
			functionName = node.left.property.name;
			resource.Key =  objectName + '.' + functionName;
			resource.Identifier = functionName;
			resource.Signature = makeSignature(functionName, node.right.params);
			resource.Comment = findComment(node.left.property.loc.start.line, comments);
			resource.LineNumber = node.left.property.loc.start.line;
			resource.ColumnPosition = node.left.property.loc.start.column;

			this.store.insert(resource);
		} else if (isThisFunctionAssignment) {

			// we don't know which object 'this' could refer to, ignore for now
			functionName = node.left.property.name;
			resource.Key =  functionName;
			resource.Identifier = functionName;
			resource.Signature = makeSignature(functionName, node.right.params);
			resource.Comment = findComment(node.left.property.loc.start.line, comments);
			resource.LineNumber = node.left.property.loc.start.line;
			resource.ColumnPosition = node.left.property.loc.start.column;

			this.store.insert(resource);
		} else {
			this.walkNode(node.right, comments);
		}
	};

	this.walkCallExpression = function(node, comments) {
		for (var i = 0; i < node.arguments.length; i++) {
			if (node.arguments[i].type === 'FunctionExpression') {
				this.walkNode(node.arguments[i].body, comments);
			}
			if (node.arguments[i].type === 'ObjectExpression') {
				this.ObjectName = '';
				this.walkNode(node.arguments[i], comments);
			}
		}
	};
};

module.exports = AstWalker;
