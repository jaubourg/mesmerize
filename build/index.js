"use strict";

const fs = require( "fs" );
const mimetypes = require( "../mimetypes" );
const parse = require( "./parse" );
const parsedToTree = require( "./parsedToTree" );
const treeToCode = require( "./treeToCode" );

module.exports = new Promise( function( resolve, reject ) {
	const start = Date.now();
	const code = treeToCode( parsedToTree( parse( mimetypes ) ) );
	console.log( `\n Generator built in ${Date.now() - start}ms` );
	fs.writeFile( `${__dirname}/../lib/mimetypes.js`, code, function( error ) {
		if ( error ) {
			reject( error );
		} else {
			resolve();
		}
	} );
} ).then( null, function( error ) {
	console.log( error );
	throw error;
} );
