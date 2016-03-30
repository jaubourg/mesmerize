"use strict";

module.exports = require( "fs" ).readdirSync( `${__dirname}/../lib/iterators` ).map( function( name ) {
	return name.replace( /\.js$/, "" );
} ).filter( function( name ) {
	return name !== "function";
} );

module.exports.unshift( null );
