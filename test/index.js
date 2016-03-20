"use strict";

require( "./run" )( function( unit ) {
	const assert = require( "assert" );
	const fs = require( "fs" );
	const mesmerize = require( ".." );
	unit( "entire buffer", function( mimetype, filename ) {
		return new Promise( function( resolve, reject ) {
			fs.readFile( filename, function( error, buffer ) {
				if ( error ) {
					reject( error );
				} else {
					resolve( mesmerize( buffer ) );
				}
			} );
		} );
	} );
	unit( "streaming", function( expectedMimetype, filename ) {
		return new Promise( function( resolve, reject ) {
			let count = 0;
			let mimetype;
			function handlerFactory( expectedCount ) {
				return function( givenMimeType ) {
					try {
						assert.strictEqual( count, expectedCount );
						if ( count ) {
							assert.strictEqual( givenMimeType, mimetype );
						}
					} catch ( e ) {
						reject( e );
					}
					count++;
					mimetype = givenMimeType;
				};
			}
			let alreadyCalled = false;
			function done() {
				if ( !alreadyCalled ) {
					alreadyCalled = true;
					try {
						assert.strictEqual( count, 2 );
						resolve( mimetype );
					} catch ( e ) {
						reject( e );
					}
				}
			}
			mesmerize.stream( fs.createReadStream( filename ), {
				callback: handlerFactory( 0 ),
				queue: true
			} ).on( "mimetype", handlerFactory( 1 ) )
				.once( "data", done )
				.once( "error", reject )
				.once( "end", done );
		} );
	} );
} );
