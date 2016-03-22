"use strict";

const assert = require( "assert" );
const files = require( "./files" );

module.exports = function( callback ) {
	let units = 0;
	let currentRunner = require( "../build" );
	currentRunner.then( function() {
		callback( function( title, runner ) {
			function doRun() {
				console.log( `\n ${title}\n ${title.replace( /./g, "-" )}\n` );
				units++;
				let tests = 0;
				let pass = 0;
				let fail = 0;
				let promises = [];
				files.forEach( function( mimetype, filename ) {
					const message = `${filename} is ${mimetype}`;
					function ok( givenMimeType ) {
						assert.strictEqual( givenMimeType, mimetype );
						pass++;
						console.log( `   - ${message}: \x1b[32mOK\x1b[0m` );
					}
					function nok( e ) {
						fail++;
						console.error( `   - ${message}: \x1b[31m${e}\x1b[0m` );
					}
					try {
						tests++;
						const returned = runner( mimetype, `${__dirname}/fixtures/${mimetype}/${filename}` );
						if ( returned instanceof Promise ) {
							promises.push( returned.then( ok ).then( null, nok ) );
						} else {
							ok( returned );
						}
					} catch ( e ) {
						nok( e );
					}
				} );
				function finished() {
					console.log(
						`\n ${
							fail ? "\x1b[31mfailure" : "\x1b[32msuccess"
						} - ${tests} run${tests > 1 ? "s" : ""}, ${pass} passed, ${fail} failed\x1b[0m`
					);
					if ( fail ) {
						throw fail;
					}
				}
				if ( promises.length ) {
					return Promise.all( promises ).then( finished );
				}
				finished();
			}
			currentRunner = currentRunner.then( doRun, doRun );
		}, function() {
			console.log( " \x1b[32mMime-type generation not OK\x1b[0m\n" );
		} );
		currentRunner.then( function() {
			console.log( `\n ${units} unit${units > 1 ? "s" : ""} handled` );
			let untestedMimetypes = [];
			for ( let mimetype in require( "../mimetypes.json" ) ) {
				if ( !files.tested.has( mimetype ) ) {
					untestedMimetypes.push( mimetype );
				}
			}
			if ( untestedMimetypes.length ) {
				console.log( `\n \x1b[31mUNTESTED:\n   - ${untestedMimetypes.join( "\n   - " )}\x1b[0m` );
			}

		} );
	}, function( e ) {
		console.log( `\n \x1b[31m${e.stack || e}\x1b[0m` );
	} );
};
