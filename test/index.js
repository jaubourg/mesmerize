"use strict";

require( "./run" )( function( unit ) {
	const assert = require( "assert" );
	const fs = require( "fs" );
	const mesmerize = require( ".." );
	unit( "entire buffer", function( data, mode ) {
		return new Promise( function( resolve, reject ) {
			fs.readFile( data.path, function( error, buffer ) {
				if ( error ) {
					reject( error );
				} else {
					resolve( mesmerize( buffer, {
						mode: mode
					} ) );
				}
			} );
		} );
	} );
	unit( "streaming", function( data, mode ) {
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
			mesmerize.stream( fs.createReadStream( data.path ), {
				callback: handlerFactory( 0 ),
				mode: mode,
				queue: true
			} ).on( "mimetype", handlerFactory( 1 ) )
				.once( "data", done )
				.once( "error", reject )
				.once( "end", done );
		} );
	} );
} );
