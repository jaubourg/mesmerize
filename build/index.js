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

const rCode = /const\s+root\s+=[^\n]+/;

function generateFor( name ) {
	const dirname = `${__dirname}/code/${name}`;
	const parseToTree = require( `${dirname}/parseToTree` );
	const treeToCode = require( `${dirname}/treeToCode` );
	const template = fs.readFileSync( `${dirname}/_.js`, "utf8" );
	let start = Date.now();
	const generated = template.replace( rCode, treeToCode( parseToTree( parsed ) ) );
	console.log( ` Generated "${name}" in ${Date.now() - start}ms` );
	return generated;
}

module.exports = Promise.all(
	fs.readdirSync( `${__dirname}/code` ).filter( function( name ) {
		return fs.statSync( `${__dirname}/code/${name}` ).isDirectory();
	} ).map( function( name ) {
		return new Promise( function( resolve, reject ) {
			fs.writeFile(
				`${__dirname}/../lib/iterators/${name}.js`,
				generateFor( name ),
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
