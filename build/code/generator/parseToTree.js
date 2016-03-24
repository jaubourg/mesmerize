"use strict";

const push = Array.prototype.push;

/**
 * Chains the next node to a currentNode that is test
 * @param {Object} currentNode
 * @param {Object} nextNode
 */
function chainTest( currentNode, nextNode ) {
	// If current node doesn't set anything and has no default and
	// next node if a test that also doesn't set anything then
	// join the tests together
	if ( !currentNode.type && !currentNode.catchAll && nextNode.if && !nextNode.type ) {
		push.apply( currentNode.if, nextNode.if );
		currentNode.then = nextNode.then;
		currentNode.catchAll = nextNode.catchAll;
	// Else use the next node as the current node then statement
	} else {
		currentNode.then = nextNode;
	}
}

/**
 * Creates an abstract code tree
 * @param {Map} branch the branch to build code for
 * @param {Array<Map>} maps a list of maps that will be needed for code generation
 * @return {Object} the abstract code tree
 */
function buildCodeTree( branch, maps, top ) {
	// First check if the branch is top level
	if ( !top && branch.index ) {
		// If so return a reference to the future function
		return {
			func: `func_${branch.index}`
		};
	}
	// Else start fresh
	let codeTree = {
		func: null,
		if: null,
		then: null,
		index: branch.index,
		type: branch.type,
		catchAll: branch.catchAll && buildCodeTree( branch.catchAll, maps )
	};
	// Extract entries
	// If we have more than one entry
	if ( branch.entries.length > 1 ) {
		// We need a map (and thus the temp variable)
		maps.push( branch.entries.map( function( entry ) {
			return [ entry[ 0 ], buildCodeTree( entry[ 1 ], maps ) ];
		} ) );
		// We create test using the map
		codeTree.if = [ `map_${maps.length}` ];
	// If we only have one entry
	} else if ( branch.entries.length ) {
		const entry = branch.entries[ 0 ];
		// We generate a simple test
		codeTree.if = [ entry[ 0 ] ];
		// And then we chain
		chainTest( codeTree, buildCodeTree( entry[ 1 ], maps ) );
	// If we just have a catch-all
	} else if ( codeTree.catchAll ) {
		// Remove it
		const catchAllTree = codeTree.catchAll;
		delete codeTree.catchAll;
		// Create a simple inverted test
		codeTree.if = [ null ];
		// And chain
		chainTest( codeTree, catchAllTree );
	}
	return codeTree;
}

/**
 * Iterate over the unique branches and generate an abstract code tree for each of them
 * @param {Set<Map>} branches
 * @return {Object} the arrays of maps and functions generated
 */
module.exports = function( branches ) {
	// Maps generated
	const maps = [];
	// Done!
	return {
		maps: maps,
		functions: branches.map( function( branch ) {
			return buildCodeTree( branch, maps, true );
		} )
	};
};
