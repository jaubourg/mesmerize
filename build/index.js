"use strict";

/**
 * List of operations needed to generate code in order
 */
const operations = {
	parse: require( "./parse" ),
	split: require( "./split" ),
	splitToTree: require( "./splitToTree" ),
	treeToCode: require( "./treeToCode" )
};

/**
 * Generates the code
 */
function generate() {
	// Start with the json file
	let tmp = require( "../mimetypes" );
	// Time stuff
	const globalStart = Date.now();
	const timings = [];
	// Do the operations in order
	for ( let name in operations ) {
		const start = Date.now();
		tmp = operations[ name ]( tmp );
		timings.push( {
			name: name,
			time: Date.now() - start
		} );
	}
	// Log times
	console.log( `\n Generator build in ${Date.now() - globalStart}ms` );
	timings.forEach( function( data ) {
		console.log( ` - ${data.name}: ${data.time}ms` );
	} );
	// Done!
	return tmp;
}

// We exports the promise direcly
module.exports = new Promise( function( resolve, reject ) {
	// Write the file
	require( "fs" ).writeFile( `${__dirname}/../lib/mimetypes.js`, generate(), function( error ) {
		if ( error ) {
			reject( error );
		} else {
			resolve();
		}
	} );
} ).then( null, function( error ) {
	// If there is an error, log and rethrow it
	console.log( error.stack || error );
	throw error;
} );
