"use strict";

const Finder = require( "./Finder" );
const StreamFinder = require( "./StreamFinder" );

function mesmerize( object, options ) {
	options = options || {};
	return new Finder( options.mode ).feed( object, options.encoding ).value();
}

mesmerize.stream = function( stream, options ) {
	const finder = new StreamFinder( options );
	finder.once( "mimetype", function( mimetype ) {
		stream.emit( "mimetype", mimetype );
		if ( options && options.callback ) {
			options.callback( mimetype );
		}
	} ).on( "error", function() {
		stream.emit.apply( stream, arguments );
	} );
	return stream.pipe( finder );
};

mesmerize.Finder = Finder;
mesmerize.StreamFinder = StreamFinder;

module.exports = mesmerize;
