"use strict";

const fs = require( "fs" );
const mimetypes = require( "../mimetypes" );
const parse = require( "./parse" );

const parseStart = Date.now();
const parsed = parse( mimetypes );
console.log( `\n Parsed in ${Date.now() - parseStart}ms` );

try {
	fs.mkdirSync( `${__dirname}/../lib/iterators` );
} catch ( e ) {}

module.exports = Promise.all(
	fs.readdirSync( `${__dirname}/code` ).filter( function( name ) {
		return fs.statSync( `${__dirname}/code/${name}` ).isDirectory();
	} ).map( function( name ) {
		const generate = require( `./code/${name}` );
		let start = Date.now();
		const code = generate( parsed );
		console.log( ` Generated "${name}" in ${Date.now() - start}ms` );
		return new Promise( function( resolve, reject ) {
			fs.writeFile(
				`${__dirname}/../lib/iterators/${name}.js`,
				code,
				function( error ) {
					if ( error ) {
						reject( error );
					} else {
						resolve();
					}
				}
			);
		} );
	} )
);
