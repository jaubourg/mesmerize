"use strict";

function dataEncode( key ) {
	return typeof key === "number" ? `0x${key.toString( 16 )}` : JSON.stringify( key );
}

function deepEqual( array1, array2 ) {
	const type1 = typeof array1;
	const type2 = typeof array2;
	if ( type1 !== type2 ) {
		return false;
	}
	if ( type1 !== "object" ) {
		return array1 === array2;
	}
	return array1.isMap === array2.isMap && array1.length === array2.length && array1.find( function( value, index ) {
		return !deepEqual( value, array2[ index ] );
	} ) === undefined;
}

function encode( data, tab ) {
	if ( typeof data === "string" ) {
		return data;
	}
	tab = ( tab || "" ) + "\t";
	if ( data.isMap ) {
		return `new Map( [\n${
			data.map( function( item ) {
				return tab + encode( item, tab );
			} ).join( ",\n" )
		}\n] )`;
	}
	return `[ ${data.map( encode ).join( ", " )} ]`;
}

module.exports = function( array ) {
	const existing = [];
	const findExistingSet = new Map();
	const last = ( function toString( array ) {
		if ( !Array.isArray( array ) ) {
			return dataEncode( array );
		}
		const isMap = Array.isArray( array[ 0 ] );
		array = array.map( toString );
		array.isMap = isMap;
		let existingSet = findExistingSet.get( array.length );
		if ( !existingSet ) {
			findExistingSet.set( array.length, ( existingSet = new Set() ) );
		}
		for ( let id of existingSet ) {
			if ( deepEqual( array, existing[ id - 1 ] ) ) {
				return `_${id}`;
			}
		}
		existing.push( array );
		existingSet.add( existing.length );
		return `_${existing.length}`;
	} )( array );
	return `"use strict";\n\n` +
		existing.map( function( data, index ) {
			return `const _${index + 1} = ${encode( data )};`;
		} ).join( "\n" ) +
		`\nmodule.exports = ${last};\n`;
};
