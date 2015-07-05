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

var AstWalker = require('../src/ast-walker.js');
var Resource = require('../src/resource.js');

/**
 * Tests for the AST Walker.
 */
describe('ast walker tests', function() {

	/**
	 * The object under test
	 * @var AstWalker
	 */
	var walker;

	/**
	 * the "expected" resource to be created/inserted into the
	 * store.
	 *
	 * @var Resource
	 */
	var resource;

	/**
	 * The store that resources should be inserted into.
	 * This is a stub.
	 */
	var store;

	/**
	 * The input into the AstWalker: the AST that the walker
	 * should read from
	 */
	var node;

	beforeEach(function() {
		walker = new AstWalker();
		resource = new Resource();
		store = jasmine.createSpyObj('Store', ['insert']);
		walker.init(store);

		node = {
			type: 'Program',
			body: []
		};

		// this is the expected resource, the same as the
		// AST node returned by the functionDecl() function
		resource.Key = 'extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = '';
		resource.LineNumber = 30;
		resource.ColumnPosition = 4;
	});

	/**
	 * @return an AST node for a function declaration
	 */
	var functionDecl = function() {
		return {
			type: 'FunctionDeclaration',
			loc: {
				source: '',
				start: {
					line: 30,
					column: 4
				},
				end: {
					line: 40,
					column: 0
				}
			},
			id: {
				type: 'Identifier',
				name: 'extractName'
			},
			params: [],
			body: {
				type: 'BlockStatement',
				body: []
			}
		};
	};

	it ('should not error on uninteresting expressions', function() {
		node.body = [{
			'type': 'VariableDeclaration',
			'declarations': [{
				'type': 'VariableDeclarator',
				'id': {
					'type': 'Identifier',
					'name': 'sum'
				},
				'init': {
					'type': 'BinaryExpression',
					'operator': '+',
					'left': {
						'type': 'Literal',
						'value': 3,
						'raw': '3'
					},
					'right': {
						'type': 'Literal',
						'value': 4,
						'raw': '4'
					}
				}
			}],
			'kind': 'var'
		}];

		walker.walkNode(node);

		expect(store.insert.calls.count()).toEqual(0);
	});

	it('should store a function', function() {
		node.body = [
			functionDecl()
		];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should store global objects', function() {
		node.body = [{
			type: 'VariableDeclaration',
			declarations: [{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: 'Utils'
				},
				init:  {
					type: 'ObjectExpression',
					properties: [{
						type: 'Property',
						key: {
							loc: {
								start: {
									line: 2,
									column: 4
								}
							},
							type: 'Identifier',
							name: 'extractName',
						},
						value: {
							type: 'FunctionExpression',
							id: null,
							params: [],
							body: {
								type: 'BlockStatement',
								body: []
							}
						}
					}]
				}
			}]
		}];

		resource.Key = 'Utils.extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = 'Utils';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse if statement', function() {
		node.body = [
			{
				type: 'IfStatement',
				test: {
					type: 'AssignmentExpression',
					operator: '===',
					left: {
						type: 'Identifier',
						name: 'name'
					},
					right: {
						type: 'literal',
						value: ''
					}

				},
				consequent: functionDecl(),
				alternate: null
			}
		];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse with statement', function() {
		node.body = [{
			type: 'WithStatement',
			object: {
				type: 'Identifier',
				name: 'name'
			},
			body: functionDecl()
		}];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse switch statement', function() {
		node.body = [
			{
				type: 'SwitchStatement',
				discriminant: {
					type: 'Identifier',
					name: 's',
				},
				cases: [
					{
						type: 'SwitchCase',
						test: {
							type: 'Literal',
							value: 'one'
						},
						consequent: [
							functionDecl(),
							{
								type: 'BreakStatement',
								label: null
							}
						]
					}
				]
			}
		];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse try-catch', function() {
		node.body = [{
			type: 'TryStatement',
			block: {
				type: 'BlockStatement',
				body: [
					functionDecl()
				]
			},
			guardedHandlers: [],
			handlers: [
				{
					type: 'CatchClause',
					param: {
						type: 'Identifier',
						name: 'e'
					},
					body: {
						type: 'BlockStatement',
						body: [
						functionDecl()
						]
					}
				}
			]
		}];

		walker.walkNode(node);

		expect(store.insert.calls.count()).toEqual(2);
		var actualResource = store.insert.calls.argsFor(0)[0];
		expect(resource).toEqual(actualResource);

		// should iterate down catch block also
		actualResource = store.insert.calls.argsFor(1)[0];
		expect(resource).toEqual(actualResource);
	});

	it('should recurse while statement', function() {
		node.body = [{
			type: 'WhileStatement',
			test: {
				type: 'BinaryExpression',
				operator: '>',
				left: {
					type: 'Identifier',
					name: 'x'
				},
				right: {
					type: 'Literal',
					value: '0'
				}
			},
			body: {
				type: 'BlockStatement',
				body: [
					functionDecl()
				]
			}
		}];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse DO while statement', function() {
		node.body = [{
			type: 'DoWhileStatement',
			test: {
				type: 'BinaryExpression',
				operator: '>',
				left: {
					type: 'Identifier',
					name: 'x'
				},
				right: {
					type: 'Literal',
					value: '0'
				}
			},
			body: {
				type: 'BlockStatement',
				body: [
					functionDecl()
				]
			}
		}];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse for statement', function() {
		node.body = [{
			type: 'ForStatement',
			init: {
				type: 'AssignmentExpression',
				operator: '=',
				left: {
					type: 'Identifier',
					name: 'i'
				},
				right: {
					type: 'Literal',
					value: '0'
				}
			},
			test: {
				type: 'BinaryExpression',
				operator: '<',
				left: {
					type: 'Identifier',
					name: 'i'
				},
				right: {
					type: 'Literal',
					value: '10'
				}
			},
			update: {
				type: 'UpdateExpression',
				operator: '++',
				argument: {
					type: 'Identifier',
					name: 'i'
				},
				prefix: false
			},
			body: {
				type: 'BlockStatement',
				body: [
					functionDecl()
				]
			}
		}];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse for in statement', function() {
		node.body = [{
			type: 'ForInStatement',
			left: {
				type: 'Identifier',
				name: 'obj'
			},
			right: {
				type: 'Identifier',
				name: 'items'
			},
			body: {
				type: 'BlockStatement',
				body: [
					functionDecl()
				]
			}
		}];

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse down array expression', function() {
		// code for the generated AST
		//var items = [{
		//	extractName: function() {
		//		return 'name ';
		//	}
		//}];
		node.body = [{
			'type': 'VariableDeclaration',
			'declarations': [{
				'type': 'VariableDeclarator',
				'id': {
					'type': 'Identifier',
					'name': 'items'
				},
				'init': {
					'type': 'ArrayExpression',
					'elements': [{
						'type': 'ObjectExpression',
						'properties': [{
							'type': 'Property',
							'key': {
								'type': 'Identifier',
								'name': 'extractName',
								'loc': {
									'start': {
										'line': 2,
										'column': 4
									}
								}
							},
							'computed': false,
							'value': {
								'type': 'FunctionExpression',
								'id': null,
								'params': [],
								'defaults': [],
								'body': {
									'type': 'BlockStatement',
									'body': [
										{
											'type': 'ReturnStatement',
											'argument': {
												'type': 'Literal',
												'value': 'name',
												'raw': 'name'
											}
										}
									]
								},
								'generator': false,
								'expression': false
							},
							'kind': 'init',
							'method': false,
							'shorthand': false
						}]
					}]
				},
				'kind': 'var'
			}]
		}];

		resource.Key = 'extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = '';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse member expressions', function() {
		node.body = [{
			'type': 'ExpressionStatement',
			'expression': {
				'type': 'AssignmentExpression',
				'operator': '=',
				'left': {
					'type': 'MemberExpression',
					'computed': false,
					'object': {
						'type': 'Identifier',
						'name': 'item'
					},
					'property': {
						'type': 'Identifier',
						'name': 'extractName',
						'loc': {
							'start': {
								'line': 2,
								'column': 4
							}
						}
					}
				},
				'right': {
					'type': 'FunctionExpression',
					'id': null,
					'params': [],
					'defaults': [],
					'body': {
						'type': 'BlockStatement',
						'body': [{
							'type': 'ReturnStatement',
							'argument': {
								'type': 'Literal',
								'value': 'name',
								'raw': 'name'
							}
						}]
					},
					'generator': false,
					'expression': false
				}
			}
		}];

		resource.Key = 'item.extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = 'item';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should capture function defined inside an enclosing anonymous function', function() {
		node.body = [{
			'type': 'ExpressionStatement',
			'expression': {
				'type': 'CallExpression',
				'callee': {
					'type': 'Identifier',
					'name': 'define'
				},
				'arguments': [
				{
					'type': 'ArrayExpression',
					'elements': []
				},
				{
					'type': 'FunctionExpression',
					'id': null,
					'params': [{
						'type': 'Identifier',
						'name': 'item'
					}],
					'defaults': [],
					'body': {
						'type': 'BlockStatement',
						'body': [{
							'type': 'ExpressionStatement',
							'expression': {
								'type': 'AssignmentExpression',
								'operator': '=',
								'left': {
									'type': 'MemberExpression',
									'computed': false,
									'object': {
										'type': 'Identifier',
										'name': 'item'
									},
									'property': {
										'type': 'Identifier',
										'name': 'extractName',
										'loc': {
											'start': {
												'line': 2,
												'column': 4
											}
										}
									}
								},
								'right': {
									'type': 'FunctionExpression',
									'id': null,
									'params': [],
									'defaults': [],
									'body': {
										'type': 'BlockStatement',
										'body': []
									},
									'generator': false,
									'expression': false
								}
							}
						}]
					},
					'generator': false,
					'expression': false
				}]
			}
		}];

		resource.Key = 'item.extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = 'item';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);
	});

	it('should recurse down exported functions', function() {
		node.body = [{
			'type': 'ExpressionStatement',
			'expression': {
				'type': 'AssignmentExpression',
				'operator': '=',
				'left': {
					'type': 'MemberExpression',
					'computed': false,
					'object': {
						'type': 'Identifier',
						'name': 'module'
					},
					'property': {
						'type': 'Identifier',
						'name': 'exports'
					}
				},
				'right': {
					'type': 'ObjectExpression',
					'properties': [{
						'type': 'Property',
						'key': {
							'type': 'Identifier',
							'name': 'extractName',
							'loc': {
								'start': {
									'line': 2,
									'column': 4
								}
							}
						},
						'computed': false,
						'value': {
							'type': 'FunctionExpression',
							'id': null,
							'params': [],
							'defaults': [],
							'body': {
								'type': 'BlockStatement',
								'body': []
							},
							'generator': false,
							'expression': false
						},
						'kind': 'init',
						'method': false,
						'shorthand': false
					}]
				}
			}
		}];

		resource.Key = 'extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = '';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);

	});

	it('should recurse function parameters', function() {
		node.body = [{
			'type': 'ExpressionStatement',
				'expression': {
					'type': 'CallExpression',
					'callee': {
						'type': 'MemberExpression',
						'computed': false,
						'object': {
							'type': 'Identifier',
							'name': 'jQuery'
						},
						'property': {
							'type': 'Identifier',
							'name': 'extend'
						}
					},
					'arguments': [{
					'type': 'ObjectExpression',
					'properties': [{
						'type': 'Property',
						'key': {
							'type': 'Identifier',
							'name': 'extractName',
							'loc': {
								'start': {
									'line': 2,
									'column': 4
								}
							}
						},
						'computed': false,
						'value': {
							'type': 'FunctionExpression',
							'id': null,
							'params': [],
							'defaults': [],
							'body': {
								'type': 'BlockStatement',
								'body': []
							},
							'generator': false,
							'expression': false
						},
						'kind': 'init',
						'method': false,
						'shorthand': false
					}]
				}]
			}
		}];

		resource.Key = 'extractName';
		resource.FunctionName = 'extractName';
		resource.ObjectName = '';
		resource.LineNumber = 2;
		resource.ColumnPosition = 4;

		walker.walkNode(node);

		expect(store.insert).toHaveBeenCalled();
		var actualResource = store.insert.calls.argsFor(0)[0];

		expect(resource).toEqual(actualResource);

	});
});

