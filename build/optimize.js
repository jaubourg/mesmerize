"use strict";

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
		const newMap = new Map();
		map.forEach( function( value, key ) {
			if ( value instanceof Map ) {
				newMap.set( key, expand( value, propagate.get( key ) ) );
			} else {
				newMap.set( key, value );
			}
		} );
		propagate.forEach( function( value, key ) {
			if ( !newMap.has( key ) ) {
				if ( value instanceof Map ) {
					newMap.set( key, expand( value ) );
				} else {
					newMap.set( key, value );
				}
			}
		} );
		map = newMap;
	}
	const catchAll = map.get( null );
	const newMap = new Map();
	map.forEach( function( value, key ) {
		if ( value instanceof Map ) {
			newMap.set( key, expand( value, key !== null && catchAll ) );
		} else {
			newMap.set( key, value );
		}
	} );
	return newMap;
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
	if ( type && map.size > 1 ) {
		if ( !find( map, notOfType( type ) ) ) {
			return new Map( [ [ true, type ] ] );
		}
	}
	const newMap = new Map();
	map.forEach( function( value, key ) {
		if ( value instanceof Map ) {
			newMap.set( key, cut( value ) );
		} else {
			newMap.set( key, value );
		}
	} );
	return newMap;
}

function sorterValue( value ) {
	value = value[ 0 ];
	return value === true ? -1 : ( value === null ? 256 : value );
}

function sorter( a, b ) {
	return sorterValue( a ) - sorterValue( b );
}

// Transform to arrays
function toArrays( map ) {
	if ( !( map instanceof Map ) ) {
		return map;
	}
	const output = [];
	map.forEach( function( value, key ) {
		const keys = [];
		while ( value instanceof Map && value.size === 1 ) {
			const next = value.entries().next().value;
			if ( next[ 0 ] !== true ) {
				keys.push( next[ 0 ] );
			}
			value = next[ 1 ];
		}
		value = toArrays( value );
		if ( keys.length ) {
			keys.push( value );
			value = keys;
		}
		output.push( [ key, value ] );
	} );
	output.sort( sorter );
	return output;
}

module.exports = function( map ) {
	return toArrays( cut( expand( map ) ) );
};
