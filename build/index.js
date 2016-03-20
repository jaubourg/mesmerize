"use strict";

const fs = require( "fs" );
const mimetypes = require( "../mimetypes" );
const optimize = require( "./optimize" );
const parse = require( "./parse" );
const parsedToCode = require( "./parsedToCode" );

module.exports = new Promise( function( resolve, reject ) {
	fs.writeFile(
		`${__dirname}/../lib/mimetypes.js`,
		parsedToCode( optimize( parse( mimetypes ) ) ),
		function( error ) {
			if ( error ) {
				reject( error );
			} else {
				resolve();
			}
		}
	);
} ).then( null, function( error ) {
	console.log( error );
	throw error;
} );
