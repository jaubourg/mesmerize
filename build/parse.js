"use strict";

function copy( target, source ) {
	target = target || new Map();
	const sourceType = source.get( true );
	if ( sourceType ) {
		const targetType = target.get( true );
		if ( targetType && targetType !== sourceType ) {
			throw new Error( `ambiguity between ${targetType} and ${sourceType}` );
		}
		target.set( true, sourceType );
	}
	source.forEach( function( map, key ) {
		if ( key !== true ) {
			target.set( key, copy( target.get( key ), map ) );
		}
	} );
	return target;
}

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
				if ( number === null ) {
					for ( let key of current.keys() ) {
						if ( key !== true && key !== null ) {
							newCurrents.add( pushOne( current, key ) );
						}
					}
					newCurrents.add( pushOne( current, null ) );
				} else {
					const existed = current.has( number );
					const next = pushOne( current, number );
					newCurrents.add( next );
					if ( !existed ) {
						const catchAll = current.get( null );
						if ( catchAll ) {
							copy( next, catchAll );
						}
					}
				}
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

// Sort elements
function sorterValue( value ) {
	return value === true ? -1 : ( value === null ? 256 : value );
}
function sorter( a, b ) {
	return sorterValue( a[ 0 ] ) - sorterValue( b[ 0 ] );
}
function sortedEntries( map ) {
	const entries = [];
	for ( let entry of map.entries() ) {
		entries.push( entry );
	}
	entries.sort( sorter );
	return entries;
}
function normalize( map ) {
	if ( !( map instanceof Map ) ) {
		return map;
	}
	return new Map( sortedEntries( map ).map( function( entry ) {
		return [ entry[ 0 ], normalize( entry[ 1 ] ) ];
	} ) );
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

module.exports = function( list ) {
	const map = new Map();
	Object.getOwnPropertyNames( list ).forEach( function( mimetype ) {
		const expressions = Array.isArray( list[ mimetype ] ) ? list[ mimetype ] : [ list[ mimetype ] ];
		expressions.forEach( function( expression ) {
			parseOne( expression, mimetype, map );
		} );
	} );
	return normalize( cut( map ) );
};
