"use strict";

/**
 * Encodes a number key to be more byte-like and readable
 * @param {number} key
 * @return {string}
 */
function encodeKey( key ) {
	// Set to hexadecimal
	key = key.toString( 16 );
	// Pad with a 0 if needed
	if ( key.length < 2 ) {
		key = `0${key}`;
	}
	// Make it a proper javascript hexadecimal number
	return `0x${key}`;
}

/**
 * Chains the next node to a currentNode that is test
 * @param {Object} currentNode
 * @param {Object} nextNode
 */
function chainTest( currentNode, nextNode ) {
	// current node needs temp variable if next does
	currentNode.temp = nextNode.temp;
	// If current node doesn't set anything and has no default and
	// next node if a test that also doesn't set anything then
	// join the tests together
	if ( !currentNode.type && !currentNode.default && nextNode.if && !nextNode.type ) {
		currentNode.if += ` && ${nextNode.if}`;
		currentNode.then = nextNode.then;
		currentNode.default = nextNode.default;
	// Else use the next node as the current node then statement
	} else {
		currentNode.then = nextNode;
	}
}

/**
 * Creates an abstract code tree
 * @param {Map} branch the branch to build code for
 * @param {Map<Object>} functions contains already built functions
 * @param {Array<Map>} maps a list of maps that will be needed for code generation
 * @return {Object} the abstract code tree
 */
function buildCodeTree( branch, functions, maps ) {
	// First check if a tree has already been generated for the map
	let codeTree = functions.get( branch );
	if ( codeTree ) {
		// If so return a reference to the future function
		return {
			func: `func_${codeTree.index}`
		};
	}
	// Else start fresh
	codeTree = {};
	// Extract entries
	const entries = [];
	branch.forEach( function( value, key ) {
		// Handle mimetype
		if ( key === true ) {
			codeTree.type = JSON.stringify( value );
		// Handle catch-all
		} else if ( key === null ) {
			codeTree.default = buildCodeTree( value, functions, maps );
		// Handle specific match
		} else {
			entries.push( [ encodeKey( key ), buildCodeTree( value, functions, maps ) ] );
		}
	} );
	// If we have more than one entry
	if ( entries.length > 1 ) {
		// We need a map (and thus the temp variable)
		maps.push( entries );
		codeTree.temp = true;
		// We create test using the map
		codeTree.if = `( temp = map_${maps.length}.get( yield ) )`;
		// That will call the returned function if any
		codeTree.then = {
			func: "temp"
		};
	// If we only have one entry
	} else if ( entries.length ) {
		const entry = entries[ 0 ];
		// We generate a simple test
		codeTree.if = `( yield ) === ${entry[ 0 ]}`;
		// And then we chain
		chainTest( codeTree, entry[ 1 ] );
	// If we just have a catch-all
	} else if ( codeTree.default ) {
		// Remove it
		const defaultTree = codeTree.default;
		delete codeTree.default;
		// Create a simple inverted test
		codeTree.if = "( yield ) !== null";
		// And chain
		chainTest( codeTree, defaultTree );
	}
	return codeTree;
}

/**
 * Iterate over the unique branches and generate an abstract code tree for each of them
 * @param {Set<Map>} branches
 * @return {Object} the arrays of maps and functions generated
 */
module.exports = function( branches ) {
	// Keep track of functions generated
	const functions = new Map();
	let functionIndex = 1;
	// Keep track of maps generated
	const maps = [];
	// For each unique branches
	branches.forEach( function( branch ) {
		// Build the code tree
		const tree = buildCodeTree( branch, functions, maps );
		// Set its function index
		tree.index = functionIndex++;
		// Keep track of it
		functions.set( branch, tree );
	} );
	// Crete the array of functions
	const funcs = [];
	functions.forEach( function( func ) {
		delete func.index;
		funcs.push( func );
	} );
	// Done!
	return {
		maps: maps,
		functions: funcs
	};
};
