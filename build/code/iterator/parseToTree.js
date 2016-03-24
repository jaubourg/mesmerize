"use strict";

/**
 * Creates an abstract code tree
 * @param {Map} branch the branch to build code for
 * @param {Map} done ordered done tree
 * @return {Object} the abstract code tree
 */
function buildCodeTree( branch, done, top ) {
	// First check if the branch is top level
	if ( !top && branch.index ) {
		if ( !done.has( branch ) ) {
			done.set( branch, buildCodeTree( branch, done, true ) );
		}
		// If so return a reference to the future constant
		return {
			ref: branch.index
		};
	}
	// Else start fresh
	let codeTree = {
		array: null,
		map: null,
		type: null,
		index: branch.index,
		ref: null
	};
	if ( branch.entries.length >= ( 2 - ( branch.catchAll ? 1 : 0 ) - ( branch.type ? 1 : 0 ) ) ) {
		codeTree.map = branch.entries.map( function( entry ) {
			return [ entry[ 0 ], buildCodeTree( entry[ 1 ], done ) ];
		} );
		if ( branch.catchAll ) {
			codeTree.map.push( [ null, buildCodeTree( branch.catchAll, done ) ] );
		}
		if ( branch.type ) {
			codeTree.map.push( [ true, branch.type ] );
		}
	} else if ( branch.entries.length ) {
		const entry = branch.entries[ 0 ];
		const next = buildCodeTree( entry[ 1 ], done );
		codeTree.array = next.array ? [ entry[ 0 ] ].concat( next.array ) : [ entry[ 0 ], next ];
	} else if ( branch.catchAll ) {
		const next = buildCodeTree( branch.catchAll, done );
		codeTree.array = next.array ? [ null ].concat( next.array ) : [ null, next ];
	} else {
		codeTree.type = branch.type;
	}
	return codeTree;
}

/**
 * Iterate over the unique branches and generate an abstract code tree for each of them
 * @param {Set<Map>} branches
 * @return {Array<Object>} the array of variables
 */
module.exports = function( branches ) {
	// Order generated
	const done = new Map();
	// Create variables
	branches.forEach( function( branch ) {
		if ( !done.has( branch ) ) {
			done.set( branch, buildCodeTree( branch, done, true ) );
		}
	} );
	// Order stuff
	const orderedTrees = [];
	for ( let entry of done ) {
		orderedTrees.push( entry[ 1 ] );
	}
	// Done!
	return orderedTrees;
};
