"use strict";

function dataEncode( key ) {
	return typeof key === "number" ? `0x${key.toString( 16 )}` : JSON.stringify( key );
}

function deepEqual( base, other ) {
	if ( !base ) {
		return !other;
	}
	if ( !other ) {
		return false;
	}
	const type = typeof base;
	if ( typeof other !== type ) {
		return false;
	}
	if ( type !== "object" ) {
		return base === other;
	}
	return base.length === other.length && base.find( function( value, index ) {
		return !deepEqual( value, other[ index ] );
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

module.exports = function( data ) {
	const existing = [];
	const findExistingSet = new Map();
	const last = ( function toString( item ) {
		const isArray = Array.isArray( item );
		const type = typeof item;
		if ( !isArray && type !== "string" ) {
			return dataEncode( item );
		}
		const key = `${type}-${typeof item[ 0 ]}-${item.length}`;
		let existingSet = findExistingSet.get( key );
		if ( !existingSet ) {
			findExistingSet.set( key, ( existingSet = new Set() ) );
		}
		for ( let previous of existingSet ) {
			if ( deepEqual( item, previous.original ) ) {
				previous.multiple = true;
				return previous;
			}
		}
		let transformed;
		if ( isArray ) {
			transformed = item.map( toString );
			transformed.isMap = Array.isArray( item[ 0 ] );
		} else {
			transformed = JSON.stringify( item );
		}
		const output = {
			original: item,
			value: transformed
		};
		existing.push( output );
		existingSet.add( output );
		return output;
	} )( data );
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
