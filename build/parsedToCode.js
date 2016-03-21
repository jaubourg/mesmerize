"use strict";

function dataEncode( key ) {
	return typeof key === "number" ? `0x${key.toString( 16 )}` : JSON.stringify( key );
}

function deepEqual( array1, array2 ) {
	const type1 = typeof array1;
	const type2 = typeof array2;
	const isArray = Array.isArray( array1 );
	if ( type1 !== type2 || isArray !== Array.isArray( array2 ) ) {
		return false;
	}
	if ( !isArray ) {
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
	if ( Array.isArray( data ) ) {
		tab = tab || "";
		const nextTab = tab + "\t";
		if ( data.isMap ) {
			return `new Map( [\n${
				data.map( function( item ) {
					return nextTab + encode( item, nextTab );
				} ).join( ",\n" )
			}\n${tab}] )`;
		}
		return `[ ${data.map( function( item ) {
			return encode( item, tab );
		} ).join( ", " )} ]`;
	}
	return data.id ? `_${data.id}` : encode( data.value, tab );
}

module.exports = function( array ) {
	const existing = [];
	const findExistingSet = new Map();
	const last = ( function toString( array ) {
		const isArray = Array.isArray( array );
		if ( isArray ) {
			const isMap = Array.isArray( array[ 0 ] );
			array = array.map( toString );
			array.isMap = isMap;
		} else if ( typeof array !== "string" ) {
			return dataEncode( array );
		} else {
			array = JSON.stringify( array );
		}
		let existingSet = findExistingSet.get( array.length );
		if ( !existingSet ) {
			findExistingSet.set( array.length, ( existingSet = new Set() ) );
		}
		for ( let item of existingSet ) {
			if ( deepEqual( array, item.value ) ) {
				item.multiple = true;
				return item;
			}
		}
		const data = {
			value: array
		};
		existing.push( data );
		existingSet.add( data );
		return data;
	} )( array );
	let id = 0;
	return `"use strict";\n\n` +
		existing.filter( function( item ) {
			if ( item.multiple ) {
				item.id = ++id;
				return true;
			}
		} ).map( function( data, index ) {
			return `const _${index + 1} = ${encode( data.value )};`;
		} ).join( "\n" ) +
		`\n\nmodule.exports = ${encode( last.value )};\n`;
};
