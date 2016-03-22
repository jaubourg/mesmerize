"use strict";

const fs = require( "fs" );

const fixtures = `${__dirname}/fixtures`;

const files = module.exports = [];
files.tested = new Set();

function addFile( name, mimetype ) {
	files.push( {
		name: name,
		path: `${fixtures}/${mimetype}/${name}`,
		mimetype: mimetype
	} );
	files.tested.add( mimetype );
}

fs.readdirSync( fixtures ).forEach( function( registry ) {
	if ( fs.statSync( `${fixtures}/${registry}` ).isDirectory() ) {
		fs.readdirSync( `${fixtures}/${registry}` ).forEach( function( name ) {
			if ( registry === "null" ) {
				addFile( name, null );
			} else {
				const mimetype = `${registry}/${name}`;
				if ( fs.statSync( `${fixtures}/${mimetype}` ).isDirectory() ) {
					fs.readdirSync( `${fixtures}/${mimetype}` ).forEach( function( file ) {
						addFile( file, mimetype );
					} );
				}
			}
		} );
	}
} );
