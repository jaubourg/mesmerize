"use strict";

const fs = require( "fs" );

const fixtures = `${__dirname}/fixtures`;

const files = new Map();
const testedMimetypes = new Set();

fs.readdirSync( fixtures ).forEach( function( registry ) {
	if ( fs.statSync( `${fixtures}/${registry}` ).isDirectory() ) {
		fs.readdirSync( `${fixtures}/${registry}` ).forEach( function( name ) {
			if ( registry === "null" ) {
				files.set( name, null );
			} else {
				const mimetype = `${registry}/${name}`;
				testedMimetypes.add( mimetype );
				if ( fs.statSync( `${fixtures}/${mimetype}` ).isDirectory() ) {
					fs.readdirSync( `${fixtures}/${mimetype}` ).forEach( function( file ) {
						files.set( file, mimetype );
					} );
				}
			}
		} );
	}
} );

files.tested = testedMimetypes;

module.exports = files;
