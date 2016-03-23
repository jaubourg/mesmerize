"use strict";

/**
 * Duplicates paths from source onto target
 * @param {?Map} target the map to target (will be created if null)
 * @param {Map} source the map from which to copy
 * @return {Map} the target with everything copied on it
 * @throws if there are conflicting mimetypes
 */
function copy( target, source ) {
	// If target does not exist, create it
	target = target || new Map( [
		[ "_type", new Set() ]
	] );
	source.forEach( function( value, key ) {
		// Handle set of types
		if ( key === "_type" ) {
			const set = target.get( "_type" );
			for ( let type of value ) {
				set.add( type );
			}
		// OR Handle mimetype and control ambiguities
		} else if ( key === true ) {
			const targetType = target.get( true );
			if ( targetType ) {
				if ( targetType !== value ) {
					throw new Error( `ambiguity between ${targetType} and ${value}` );
				}
			} else {
				target.set( true, value );
			}
		// OR Recurse
		} else {
			target.set( key, copy( target.get( key ), value ) );
		}
	} );
	// Return the target
	return target;
}

/**
 * The parsing regexp
 * ((?:[0-9a-f]{2})+) => hexa
 * (\.\.)             => hexa catch-all
 * '([^']+)'          => string litteral (use "." for catch-all when inside)
 * \[([^\]]+)\]       => any of the character litteral listed (for instance [ABC] will match 'A', 'B' or 'C')
 * \s+                => whitespaces are ignored outside of litterals
 * (.)                => when this is matched, there is a syntax error
 */
const rBytes = /((?:[0-9a-f]{2})+)|(\.\.)|'([^']+)'|\[([^\]]+)\]|\s+|(.)/gi;

/**
 * Parse one expression
 * @param {string} expression the expression to parse
 * @param {string} mimetype the mimetype this expression must resolve to
 * @param {Map} map the root of the tree which holds all the paths
 * @throws if there are conflicting mimetypes
 */
function parseOne( expression, mimetype, map ) {
	// Initiate current nodes
	let currents = new Set( [ map ] );
	/**
	 * Gets or create a new path on the given node
	 * @param {Map} current
	 * @param {number|null} number
	 * @return {Map} the root of the new/retrieved path
	 */
	function pushOne( current, number ) {
		let next = current.get( number );
		if ( !next ) {
			current.set( number, ( next = new Map( [
				[ "_type", new Set( [ mimetype ] ) ]
			] ) ) );
		} else {
			next.get( "_type" ).add( mimetype );
		}
		return next;
	}
	/**
	 * Progresses current nodes by following/creating the paths initiated by the given numbers
	 * @param {Array<number>|number} numbers the initiators
	 */
	function push( numbers ) {
		// If we don't have an array, make one
		if ( !Array.isArray( numbers ) ) {
			numbers = [ numbers ];
		}
		// Create the new set of current nodes
		const newCurrents = new Set();
		// For each actual current nodes
		currents.forEach( function( current ) {
			// and for each initiator
			numbers.forEach( function( number ) {
				// If it's the catch-all symbol
				if ( number === null ) {
					// Progress all current non-catch-all paths
					for ( let key of current.keys() ) {
						if ( key !== true && key !== null && key !== "_type" ) {
							newCurrents.add( pushOne( current, key ) );
						}
					}
					// Progress catch-all
					newCurrents.add( pushOne( current, null ) );
				// If it's any other value
				} else {
					// Check if the path existed before
					const existed = current.has( number );
					// Progress on this path
					const next = pushOne( current, number );
					newCurrents.add( next );
					// If it didn't exist and we have a catch-all path
					if ( !existed ) {
						const catchAll = current.get( null );
						if ( catchAll ) {
							// Put catch-all paths on this new path
							copy( next, catchAll );
						}
					}
				}
			} );
		} );
		// Use new set
		currents = newCurrents;
	}
	// Handlers for the different matches of the parsing regexp
	const handlers = [
		// For hexadecimal strings
		function( string ) {
			// Decode the string and push each byte
			const buffer = new Buffer( string, "hex" );
			const length = buffer.length;
			for ( let i = 0; i < length; i++ ) {
				push( buffer[ i ] );
			}
		},
		// For hexadecimal catch-all
		function() {
			// Push the catch-all symbol
			push( null );
		},
		// For string litterals
		function( string ) {
			const length = string.length;
			for ( let i = 0; i < length; i++ ) {
				// Push each byte or the catch-all symbol if catch-all character
				push( string[ i ] === "." ? null : string.charCodeAt( i ) );
			}
		},
		// For character sets
		function( expression ) {
			// Create an array of characters
			const array = [];
			const length = expression.length;
			for ( let i = 0; i < length; i++ ) {
				array.push( expression.charCodeAt( i ) );
			}
			// Push them all
			push( array );
		},
		// For syntax errors
		function( _, column ) {
			// throw with a meaningful message
			throw new Error( `${mimetype}: syntax error in ${JSON.stringify( expression )} column ${column + 1}` );
		}
	];
	const nbHandlers = handlers.length;
	let test;
	// Get matches
	while ( ( test = rBytes.exec( expression ) ) ) {
		for ( let i = 0; i < nbHandlers; i++ ) {
			if ( test[ i + 1 ] ) {
				// Call the correct handler
				handlers[ i ]( test[ i + 1 ], test.index );
				break;
			}
		}
	}
	// For each current node
	currents.forEach( function( current ) {
		// Control if there is no mimetype ambiguity
		const existing = current.get( true );
		if ( existing ) {
			throw new Error( `ambiguity between ${existing} and ${mimetype}` );
		}
		// Set the mimetype
		current.set( true, mimetype );
	} );
}

/**
 * Transform path marker into a number
 * 0-255 => 0-255
 * true => -1
 * null => 256
 * @param {number|true|null} value
 * @return {number}
 */
function sorterValue( value ) {
	return value === true ? -1 : ( value === null ? 256 : value );
}
/**
 * Callback for sorting node entries
 * @param {Array<Array>} a first entry
 * @param {Array<Array>} b second entry
 * @return {number}
 */
function sorter( a, b ) {
	return sorterValue( a[ 0 ] ) - sorterValue( b[ 0 ] );
}
/**
 * Takes a node and returns the array of entries sorted
 * filters out _type set
 * @param {Map} map the node
 * @return {Array<Array>} the sorted entries
 */
function normalizeEntries( map ) {
	const entries = [];
	for ( let entry of map.entries() ) {
		if ( entry[ 0 ] !== "_type" ) {
			entry[ 1 ] = normalize( entry[ 1 ] );
			entries.push( entry );
		}
	}
	entries.sort( sorter );
	return entries;
}
/**
 * Normalizes the structure by sorting entries and cutting unnecessary paths
 * @param {any} map
 * @return {any}
 */
function normalize( map ) {
	// If not a map, do nothing
	if ( !( map instanceof Map ) ) {
		return map;
	}
	// Cut nodes with a type and no other possibility
	if ( map.has( true ) && map.get( "_type" ).size === 1 ) {
		return new Map( [
			[ true, map.get( true ) ]
		] );
	}
	// Else return a new map with entries normalized
	return new Map( normalizeEntries( map ) );
}

/**
 * Parses a list of expressions into a Map-based tree structure
 * @param {Object} list the list of expression { mimtype: expression(s) }
 * @return {Map} the tree
 */
module.exports = function( list ) {
	// Create the map
	const map = new Map();
	// For each expression
	Object.getOwnPropertyNames( list ).forEach( function( mimetype ) {
		// If we don't have an array, make one
		const expressions = Array.isArray( list[ mimetype ] ) ? list[ mimetype ] : [ list[ mimetype ] ];
		// For each expression
		expressions.forEach( function( expression ) {
			// Parse it and populate the structure
			parseOne( expression, mimetype, map );
		} );
	} );
	// Normalize and return
	return normalize( map );
};
