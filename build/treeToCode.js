"use strict";

// Newline matcher
const rNewLine = /\n/g;

/**
 * Indents a code block with a tab
 * @param {string} block the code block
 * @return {string} the code block indented
 */
function indent( block ) {
	return block.replace( rNewLine, "\n\t" );
}

/**
 * And operator matcher
 */
const rAnd = /\s*&&\s*/;

/**
 * Generate an if statement
 * @param {Object} tree
 * @return {string}
 */
function generateIf( tree ) {
	// Split the test
	let test = tree.if.split( rAnd );
	// Only newline/indent if we have an and-chain
	if ( test.length > 1 ) {
		test = `(\n\t${test.join( " &&\n\t" )}\n)`;
	} else {
		test = `( ${test[ 0 ]} )`;
	}
	// Generate then statement
	const ok = `{\n\t${indent( generateCode( tree.then ) )}\n}`;
	// Generate else statement
	let nok = "";
	if ( tree.default ) {
		nok = generateCode( tree.default );
		// Handle elseif for readability
		if ( tree.default.if ) {
			nok = ` else ${nok}`;
		} else {
			nok = ` else {\n\t${indent( nok )}\n}`;
		}
	}
	// Generate the entire statement
	return `if ${test} ${ok}${nok}`;
}

/**
 * Generate some code
 * @param {Object} tree
 * @return {string}
 */
function generateCode( tree ) {
	let code = "";
	// Handle if case
	if ( tree.if ) {
		code = generateIf( tree );
	// Handle yield on function case
	} else if ( tree.func ) {
		code = `yield * ${tree.func}( callback );`;
	}
	// Handle mimetype
	if ( tree.type ) {
		code = `callback( ${tree.type} );${code ? `\n${code}` : ""}`;
	}
	// Done!
	return code;
}

/**
 * Generate a function
 * @param {Object} body the function body
 * @param {?string} name the function name (anonymous function if not specified)
 * @return {string}
 */
function generateFunction( body, name ) {
	// If the body is already a function, just return it's name
	// so that it is used by reference
	if ( body.func ) {
		return body.func;
	}
	body = ( body.temp ? "let temp;\n" : "" ) + generateCode( body );
	return `function * ${name || ""}( callback ) {\n\t${indent( body )}\n}`;
}

/**
 * Generate a map
 * @param {Array<Array>} entries the map entries
 * @param {string} name
 * @return {string}
 */
function generateMap( entries, name ) {
	return `const ${name} = new Map( [\n${
		entries.map( function( entry ) {
			return `\t[ ${entry[ 0 ]}, ${indent( generateFunction( entry[ 1 ] ) )} ]`;
		} ).join( ",\n" )
	}\n] );`;
}

/**
 * Generate the entire code
 * @param {Object} data
 */
module.exports = function( data ) {
	const maps = data.maps.map( function( entries, index ) {
		return generateMap( entries, `map_${index + 1}` );
	} ).join( "\n" );
	const funcs = data.functions.map( function( tree, index ) {
		return generateFunction( tree, `func_${index + 1}` );
	} ).join( "\n" );
	return `"use strict";\n\n${maps}\n\n${funcs}\n\nmodule.exports = func_${data.functions.length};\n`;
};
