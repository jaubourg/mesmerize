"use strict";

module.exports = require( "fs" ).readdirSync( `${__dirname}/iterators` ).map( function( name ) {
	return name.replace( /\.js$/, "" );
} );
