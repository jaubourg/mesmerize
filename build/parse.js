"use strict";

/**
 * To keep track of all the mimetypes the node can lead to
 */
const typeSets = new WeakMap();

/**
 * Creates a new map with potential mimetypes set accroding to the mimetype param
 * @param {null|string|Map} mimetype if a map, will duplicate its type set
 * @return {Map}
 */
function newMap( mimetype ) {
	const map = new Map();
	const typeSet = new Set();
	if ( mimetype ) {
		if ( mimetype instanceof Map ) {
			for ( let type of typeSets.get( mimetype ) ) {
				typeSet.add( type );
			}
		} else {
			typeSet.add( mimetype );
		}
	}
	typeSets.set( map, typeSet );
	return map;
}

/**
 * Duplicates paths from source onto target
 * @param {?Map} target the map to target (will be created if null)
 * @param {Map} source the map from which to copy
 * @return {Map} the target with everything copied on it
 * @throws if there are conflicting mimetypes
 */
function copy( target, source ) {
	// If target does not exist, create it
	target = target || newMap( source );
	source.forEach( function( value, key ) {
		// Handle mimetype and control ambiguities
		if ( key === true ) {
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
			current.set( number, ( next = newMap( mimetype ) ) );
		} else {
			typeSets.get( next ).add( mimetype );
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
						if ( key !== true && key !== null ) {
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
	for ( let entry of tree1.entries() ) {
		if ( !same( entry[ 1 ], tree2.get( entry[ 0 ] ) ) ) {
			return false;
		}
	}
	// If we arrived here, we know the maps are the same
	return true;
}

/**
 * Normalizes the structure by sorting entries, cutting unnecessary paths
 * And returning a list of abstract objects
 * @param {Map} root
 * @return {Array<Object>}
 */
function normalize( root ) {
	const list = new Set();
	const similarsSet = new Map();
	list.add( ( function handle( node ) {
		// If not a map, do nothing
		if ( !( node instanceof Map ) ) {
			return node;
		}
		// Cut nodes with a type and no other possibility
		const type = node.get( true );
		if ( type && node.size > 1 && typeSets.get( node ).size === 1 ) {
			node = newMap( type );
			node.set( true, type );
		}
		// Find eventual duplicate
		const keys = [];
		let catchAll;
		for ( let key of node.keys() ) {
			if ( key === null ) {
				catchAll = node.get( null );
			} else if ( key !== true ) {
				keys.push( key );
			}
		}
		keys.sort();
		let id = [];
		if ( type ) {
			id.push( type );
		}
		if ( catchAll ) {
			id.push( "null" );
		}
		id.push.apply( id, keys );
		id =  "" + id;
		let similars = similarsSet.get( id );
		if ( similars ) {
			for ( let similar of similars ) {
				if ( same( node, similar.input ) ) {
					list.add( similar.output );
					return similar.output;
				}
			}
		} else {
			similarsSet.set( id, ( similars = [] ) );
		}
		// Install the object
		const object = {
			catchAll: null,
			type: type,
			entries: []
		};
		similars.push( {
			input: node,
			output: object
		} );
		if ( catchAll ) {
			object.catchAll = handle( catchAll );
		}
		for ( let key of keys ) {
			object.entries.push( [ key, handle( node.get( key ) ) ] );
		}
		return object;
	} )( root ) );
	const array = [];
	list.forEach( function( object ) {
		array.push( object );
		object.index = array.length;
	} );
	return array;
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
