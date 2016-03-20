"use strict";

function keyEncode( key ) {
	return typeof key === "number" ? `0x${key.toString( 16 )}` : JSON.stringify( key );
}

function toCode( map, indent ) {
	if ( !( map instanceof Map ) ) {
		return JSON.stringify( map );
	}
	indent = indent || "";
	const nextIndent = `${indent}\t`;
	const items = [];
	map.forEach( function( value, key ) {
		const keys = [];
		while ( value instanceof Map && value.size === 1 ) {
			const next = value.entries().next().value;
			if ( next[ 0 ] !== true ) {
				keys.push( keyEncode( next[ 0 ] ) );
			}
			value = next[ 1 ];
		}
		if ( keys.length ) {
			value = `[ ${keys.join( ", " )}, ${toCode( value, nextIndent )} ]`;
		} else {
			value = toCode( value, nextIndent );
		}
		items.push( [
			key,
			`${nextIndent}[ ${keyEncode( key )}, ${value} ]`
		] );
	} );
	items.sort( function( item1, item2 ) {
		const one = item1[ 0 ] === null ? 256 : item1[ 0 ];
		const two = item2[ 0 ] === null ? 256 : item2[ 0 ];
		return one - two;
	} );
	return "new Map( [\n" + items.map( function( item ) {
		return item[ 1 ];
	} ).join( ",\n" ) + "\n" + indent + "] )";
}

module.exports = function( map ) {
	return `"use strict";\n\nmodule.exports = ${toCode( map )};\n`;
};
