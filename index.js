"use strict";

const Finder = require( "./lib/Finder" );
const StreamFinder = require( "./lib/StreamFinder" );

function mesmerize( object, encoding ) {
	return new Finder().feed( object, encoding ).value();
}

mesmerize.stream = function( stream, options ) {
	const type = typeof options;
	if ( type === "function" ) {
		options = {
			callback: options
		};
	} else if ( type === "boolean" ) {
		options = {
			queue: options
		};
	} else {
		options = options || {};
	}
	const finder = new StreamFinder( options.queue );
	finder.once( "mimetype", function( mimetype ) {
		stream.emit( "mimetype", mimetype );
		if ( options.callback ) {
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
