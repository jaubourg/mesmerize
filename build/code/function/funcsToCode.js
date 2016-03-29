"use strict";

const utils = require( "../utils" );

function generateCase( data, noEmptyReturn ) {
	if ( typeof data === "string" ) {
		return `callback( ${JSON.stringify( data ) } );${ noEmptyReturn ? "" : "\nreturn;" }`;
	}
	return `return f_${data.number}`;
}

function generateBody( data ) {
	let code = "";
	if ( data.switch ) {
		code = `switch( charCode ) {\n\t${utils.indent( data.switch.map( function( entry ) {
			return `case ${utils.encodeKey( entry[ 0 ] )}:\n\t${utils.indent( generateCase( entry[ 1 ] ) )}`;
		} ).join( "\n" ) )}\n}`;
	} else if ( data.then ) {
		code = `if ( charCode === ${utils.encodeKey( data.if )} ) {\n\t${
			utils.indent( generateCase( data.then, !data.else ) )
		}\n}`;
	}
	if ( data.else ) {
		code += ( code && "\n" ) + generateCase( data.else, true );
	}
	if ( data.type ) {
		code = generateCase( data.type, true ) + ( code ? `\n${code}` : "" );
	}
	return code;
}

function generateFunction( data, name ) {
	return `function ${
		name || `f_${data.number}`
	}( charCode, callback ) {\n\t${utils.indent( generateBody( data ) )}\n}`;
}

module.exports = function( funcs ) {
	const lastIndex = funcs.length - 1;
	return funcs.map( function( data, index ) {
		return generateFunction( data, index === lastIndex && "root" );
	} ).join( "\n" );
};
