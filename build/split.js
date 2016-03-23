"use strict";

/**
 * Controls two trees are the same structurally
 * @param {Map|any} tree1
 * @param {Map|any} tree2
 * @return {boolean} true if the same, false otherwise
 */
function same( tree1, tree2 ) {
	// If at least one input is not a map, use strict equality
	if ( !( tree1 instanceof Map ) || !( tree2 instanceof Map ) ) {
		return tree1 === tree2;
	}
	// If sizes are different, maps are different
	if ( tree1.size !== tree2.size ) {
		return false;
	}
	// Iterate over entries
	const key2 = tree2.keys();
	for ( let key of tree1.keys() ) {
		// First test key equalities since they are sorted as per normalizeEntries in ./parse.js
		// Then, and only then, recurse
		if ( key !== key2.next().value || !same( tree1.get( key ), tree2.get( key ) ) ) {
			return false;
		}
	}
	// If we arrived here, we know the maps are the same
	return true;
}

/**
 * In order to speed up deduplication we use a map of potential candidates
 * We use the list of keys joined by a space as an identifier and put all the maps
 * with that specific set of keys in an array
 * This works because keys are sorted as per normalizeEntries in ./parse.js
 */
function SimilarSet() {
	// The potential candidates
	this._candidates = new Map();
}

SimilarSet.prototype.get = function( map ) {
	// Build the identifier
	let id = [];
	for ( let key of map.keys() ) {
		id.push( key );
	}
	id = id.join( " " );
	// Get the candidates
	let candidates = this._candidates.get( id );
	// If the array exists, add the map to it
	if ( candidates ) {
		candidates.push( map );
	// If not, just create it
	} else {
		this._candidates.set( id, ( candidates = [ map ] ) );
	}
	// Now iterate over the candidates
	for ( let candidate of candidates ) {
		// Return the canditate if it is not the map yet is the same structurally
		if ( candidate !== map && same( candidate, map ) ) {
			return candidate;
		}
	}
};

/**
 * Deduplicates the structure by finding similar branches
 * It changes the actual structure and returns a set of unique branches
 * @param {Map} root the structure
 * @return {Set<Map>} the set of unique branches
 */
module.exports = function( root ) {
	const similarSet = new SimilarSet();
	const reused = new Set();
	reused.add( ( function deduplicate( tree ) {
		if ( tree instanceof Map ) {
			const similar = similarSet.get( tree );
			if ( similar ) {
				reused.add( similar );
				return similar;
			}
			tree.forEach( function( value, key ) {
				tree.set( key, deduplicate( value ) );
			} );
		}
		return tree;
	} )( root ) );
	return reused;
};
