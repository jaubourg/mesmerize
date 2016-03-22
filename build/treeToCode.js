"use strict";

const rNewLine = /\n/g;

function indent( string, tabs ) {
	const replacer = `\n${tabs || "\t"}`;
	return string.replace( rNewLine, replacer );
}

const rAnd = /\s*&&\s*/;

function generateIf( tree ) {
	let test = tree.if.split( rAnd );
	if ( test.length > 1 ) {
		test = `(\n\t${test.join( " &&\n\t" )}\n)`;
	} else {
		test = `( ${test[ 0 ]} )`;
	}
	const ok = `{\n\t${indent( createCode( tree.then ) )}\n}`;
	let nok = "";
	if ( tree.default ) {
		nok = createCode( tree.default );
		if ( tree.default.if ) {
			nok = ` else ${nok}`;
		} else {
			nok = ` else {\n\t${indent( nok )}\n}`;
		}
	}
	return `if ${test} ${ok}${nok}`;
}

function createCode( tree ) {
	let code = "";
	if ( tree.if ) {
		code = generateIf( tree );
	} else if ( tree.func ) {
		code = `yield * ${tree.func}( callback );`;
	}
	if ( tree.type ) {
		code = `callback( ${tree.type} );${code ? `\n${code}` : ""}`;
	}
	return code;
}

function createFunction( tree, name ) {
	if ( tree.func ) {
		return tree.func;
	}
	const code = ( tree.temp ? "let temp;\n" : "" ) + createCode( tree );
	return `function * ${name || ""}( callback ) {\n\t${indent( code )}\n}`;
}

module.exports = function( data ) {
	const maps = data.maps.map( function( entries, index ) {
		return `const map_${index + 1} = new Map( [\n${
			entries.map( function( entry ) {
				return `\t[ ${entry[ 0 ]}, ${indent( createFunction( entry[ 1 ] ) )} ]`;
			} ).join( ",\n" )
		}\n] );`;
	} ).join( "\n" );
	const funcs = data.funcs.map( function( tree, index ) {
		return createFunction( tree, `func_${index + 1}` );
	} ).join( "\n" );
	return `"use strict";\n\n${maps}\n\n${funcs}\n\nmodule.exports = func_${data.funcs.length};\n`;
};
