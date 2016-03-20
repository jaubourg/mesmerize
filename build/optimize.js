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
					newMap.set( key, expand( value, propagate.get( key ) ) );
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
		if ( key !== null && value instanceof Map ) {
			newMap.set( key, expand( value, catchAll ) );
		} else {
			newMap.set( key, value );
		}
	} );
	return newMap;
}

// Utility
function typeCheck( type ) {
	return function check( map ) {
		if ( map instanceof Map ) {
			const thisType = map.get( true );
			if ( thisType && thisType !== type ) {
				throw "FAIL";
			}
			map.forEach( check );
		}
	};
}

// Remove unnecessary paths (same final type)
function cut( map ) {
	const type = map.get( true );
	if ( type && map.size > 1 ) {
		try {
			map.forEach( typeCheck( type ) );
			return new Map( [ [ true, type ] ] );
		} catch ( e ) {}
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

module.exports = function( map ) {
	return cut( expand( map ) );
};
