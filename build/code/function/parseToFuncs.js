"use strict";

/**
 * Creates an abstract code tree
 * @param {Map} branch the branch to build code for
 * @param {Map} done ordered done tree
 * @param {Array<Function>} funcs the function array
 * @return {Object} the abstract code tree
 */
function buildFuncs( branch, done, funcs ) {
	const exist = done.get( branch );
	if ( exist ) {
		return exist;
	}
	// Else start fresh
	let func = {
		number: null,
		switch: null,
		if: null,
		then: null,
		else: null,
		type: branch.type
	};
	if ( branch.catchAll ) {
		func.else = buildFuncs( branch.catchAll, done, funcs );
	}
	if ( branch.entries.length ) {
		const entries = branch.entries.map( function( entry ) {
			return [ entry[ 0 ], buildFuncs( entry[ 1 ], done, funcs ) ];
		} );
		if ( entries.length > 1 ) {
			func.switch = entries;
		} else {
			const entry = entries[ 0 ];
			func.if = entry[ 0 ];
			func.then = entry[ 1 ];
		}
	} else if ( !branch.catchAll ) {
		func = func.type;
	}
	if ( typeof func === "object" ) {
		funcs.push( func );
		func.number = funcs.length;
	}
	done.set( branch, func );
	return func;
}

/**
 * Iterate over the unique branches and generate an abstract code tree for each of them
 * @param {Set<Map>} branches
 * @return {Array<Object>} the array of functions
 */
module.exports = function( branches ) {
	const funcs = [];
	buildFuncs( branches[ branches.length - 1 ], new Map(), funcs );
	return funcs;
};
