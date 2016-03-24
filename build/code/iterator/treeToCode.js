"use strict";

const utils = require( "../utils" );

function generateEntries( entries ) {
	return entries.map( function( entry ) {
		return `[ ${utils.encodeKey( entry[ 0 ] )}, ${generateCode( entry[ 1 ] )} ]`;
	} ).join( ",\n" );
}

function generateCode( item ) {
	if ( item.ref ) {
		return `data_${item.ref}`;
	}
	if ( item.array ) {
		const lastIndex = item.array.length - 1;
		return `[ ${item.array.map( function( element, index ) {
			return index === lastIndex ? generateCode( item.array[ lastIndex ] ) : utils.encodeKey( element );
		} ).join( ", " )} ]`;
	}
	if ( item.map ) {
		return `new Map( [\n\t${utils.indent( generateEntries( item.map ) )}\n] )`;
	}
	return JSON.stringify( item.type || item );
}

module.exports = function( items ) {
	const lastIndex = items.length - 1;
	return items.map( function( item, index ) {
		const name = index === lastIndex ? "root" : `data_${item.index}`;
		return `const ${name} = ${generateCode( item )};`;
	} ).join( "\n" );
};
