"use strict";

const utils = require( "../utils" );

let funcTemp = false;

/**
 * Generate an if statement
 * @param {Object} tree
 * @return {string}
 */
function generateIf( tree ) {
	// Split the test
	let temp = false;
	let test = tree.if.map( function( value ) {
		if ( value === null ) {
			return "( ( yield ) || true )";
		} else if ( typeof value === "string" ) {
			// We have a map
			temp = funcTemp = true;
			return `( temp = ${value}.get( yield ) )`;
		}
		return `( yield ) === ${utils.encodeKey( value )}`;
	} );
	// Only newline/indent if we have an and-chain
	if ( test.length > 1 ) {
		test = `(\n\t${test.join( " &&\n\t" )}\n)`;
	} else {
		test = `( ${test[ 0 ]} )`;
	}
	// Generate then statement
	const ok = `{\n\t${utils.indent( generateCode( tree.then || {
		func: "temp"
	} ) )}\n}`;
	// Generate else statement
	let nok = "";
	if ( tree.catchAll ) {
		nok = generateCode( tree.catchAll );
		// Handle elseif for readability
		if ( tree.catchAll.if ) {
			nok = ` else ${nok}`;
		} else {
			nok = ` else {\n\t${utils.indent( nok )}\n}`;
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
	// Handle yield on function case
	if ( tree.func ) {
		code = `yield * ${tree.func}( callback );`;
	// Handle if case
	} else if ( tree.if ) {
		code = generateIf( tree );
	}
	// Handle mimetype
	if ( tree.type ) {
		code = `callback( ${JSON.stringify( tree.type )} );${code ? `\n${code}` : ""}`;
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
	funcTemp = false;
	body = generateCode( body );
	if ( funcTemp ) {
		body = "let temp;\n" + body;
	}
	return `function * ${name || ""}( callback ) {\n\t${utils.indent( body )}\n}`;
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
			return `\t[ ${utils.encodeKey( entry[ 0 ] )}, ${utils.indent( generateFunction( entry[ 1 ] ) )} ]`;
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
