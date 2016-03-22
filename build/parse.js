"use strict";

const rBytes = /((?:[0-9a-f]{2})+)|(\.\.)|'([^']+)'|\[([^\]]+)\]|\s+|(.)/gi;

function parseOne( expression, mimetype, map ) {
	let test;
	let currents = new Set( [ map ] );
	function pushOne( current, number ) {
		let next = current.get( number );
		if ( !next ) {
			current.set( number, ( next = new Map() ) );
		}
		return next;
	}
	function push( numbers ) {
		if ( !Array.isArray( numbers ) ) {
			numbers = [ numbers ];
		}
		const newCurrents = new Set();
		currents.forEach( function( current ) {
			numbers.forEach( function( number ) {
				newCurrents.add( pushOne( current, number ) );
			} );
		} );
		currents = newCurrents;
	}
	const handlers = [
		function( string ) {
			const buffer = new Buffer( string, "hex" );
			const length = buffer.length;
			for ( let i = 0; i < length; i++ ) {
				push( buffer[ i ] );
			}
		},
		function() {
			push( null );
		},
		function( string ) {
			const length = string.length;
			for ( let i = 0; i < length; i++ ) {
				push( string[ i ] === "." ? null : string.charCodeAt( i ) );
			}
		},
		function( expression ) {
			const array = [];
			const length = expression.length;
			for ( let i = 0; i < length; i++ ) {
				array.push( expression.charCodeAt( i ) );
			}
			push( array );
		},
		function() {
			throw new Error( `${mimetype}: syntax error in ${JSON.stringify( expression )} column ${test.index + 1}` );
		}
	];
	const nbHandlers = handlers.length;
	while ( ( test = rBytes.exec( expression ) ) ) {
		for ( let i = 0; i < nbHandlers; i++ ) {
			if ( test[ i + 1 ] ) {
				handlers[ i ]( test[ i + 1 ] );
				break;
			}
		}
	}
	currents.forEach( function( current ) {
		const existing = current.get( true );
		if ( existing ) {
			throw new Error( `ambiguity between ${existing} and ${mimetype}` );
		}
		current.set( true, mimetype );
	} );
}

// Ensure all paths are expanded (no backtracking required that way)
function expand( map, propagate ) {
	if ( propagate ) {
		const final = map.get( true );
		const propFinal = propagate.get( true );
		if ( final ) {
			if ( propFinal && final !== propFinal ) {
				throw new Error( `ambiguity between ${final} and ${propFinal}` );
			}
		}
		map.forEach( function( value, key ) {
			if ( value instanceof Map ) {
				map.set( key, expand( value, propagate.get( key ) ) );
			}
		} );
		propagate.forEach( function( value, key ) {
			if ( !map.has( key ) ) {
				map.set( key, value instanceof Map ? expand( value ) : value );
			}
		} );
	}
	const catchAll = map.get( null );
	map.forEach( function( value, key ) {
		if ( value instanceof Map ) {
			map.set( key, expand( value, key !== null && catchAll ) );
		}
	} );
	return map;
}

// Why these array methods have not been ported to maps is beyond me
function find( map, predicate ) {
	for ( let entry of map.entries() ) {
		if ( predicate( entry[ 1 ], entry[ 0 ], map ) ) {
			return entry[ 1 ];
		}
	}
}

// find a node not of the given type
const notOfTypeCache = new Map();
function notOfType( type ) {
	let func = notOfTypeCache.get( type );
	if ( !func ) {
		notOfTypeCache.set( type, ( func = function check( value, key ) {
			return key === true ? value !== type : find( value, check );
		} ) );
	}
	return func;
}

// Remove unnecessary paths (same final type)
function cut( map ) {
	const type = map.get( true );
	if ( type && map.size > 1 && !find( map, notOfType( type ) ) ) {
		return new Map( [ [ true, type ] ] );
	}
	map.forEach( function( value, key ) {
		if ( value instanceof Map ) {
			map.set( key, cut( value ) );
		}
	} );
	return map;
}

// Normalize (sorted keys)
function sorterValue( value ) {
	return value === true ? -1 : ( value === null ? 256 : value );
}
function sorter( a, b ) {
	return sorterValue( a ) - sorterValue( b );
}
function normalize( map ) {
	if ( map instanceof Map ) {
		const output = new Map();
		const keys = [];
		for ( let key of map.keys() ) {
			keys.push( key );
		}
		keys.sort( sorter );
		keys.forEach( function( key ) {
			output.set( key, normalize( map.get( key ) ) );
		} );
		return output;
	}
	return map;
}

module.exports = function( list ) {
	const map = new Map();
	Object.getOwnPropertyNames( list ).forEach( function( mimetype ) {
		const expressions = Array.isArray( list[ mimetype ] ) ? list[ mimetype ] : [ list[ mimetype ] ];
		expressions.forEach( function( expression ) {
			parseOne( expression, mimetype, map );
		} );
	} );
	return normalize( cut( expand( map ) ) );
};
