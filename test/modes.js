"use strict";

module.exports = require( "fs" ).readdirSync( `${__dirname}/../lib/iterators` ).map( function( name ) {
	return name.replace( /\.js$/, "" );
} ).filter( function( mode ) {
	return mode !== "function";
} );

module.exports.unshift( null );
