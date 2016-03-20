"use strict";

const assert = require( "assert" );
const fs = require( "fs" );

const fixtures = `${__dirname}/fixtures`;

const files = new Map();

fs.readdirSync( fixtures ).forEach( function( registry ) {
	if ( fs.statSync( `${fixtures}/${registry}` ).isDirectory() ) {
		fs.readdirSync( `${fixtures}/${registry}` ).forEach( function( name ) {
			if ( registry === "null" ) {
				files.set( name, null );
			} else {
				const mimetype = `${registry}/${name}`;
				if ( fs.statSync( `${fixtures}/${mimetype}` ).isDirectory() ) {
					fs.readdirSync( `${fixtures}/${mimetype}` ).forEach( function( file ) {
						files.set( file, mimetype );
					} );
				}
			}
		} );
	}
} );

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
						const returned = runner( mimetype, `${fixtures}/${mimetype}/${filename}` );
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
		} );
	}, function( e ) {
		console.log( `\n \x1b[31m${e}\x1b[0m` );
	} );
};
