"use strict";

const assert = require( "assert" );
const files = require( "./files" );

function displayTitle( mode, unitTitle ) {
	const title = `${mode || "DEFAULT"} - ${unitTitle}`;
	console.log( `\n ${title}\n ${title.replace( /./g, "-" )}\n` );
}

let units = 0;
let globalTests = 0;
let globalPass = 0;
let globalFail = 0;
function handleRunner( unit, mode ) {
	return function() {
		units++;
		let tests = 0;
		let pass = 0;
		let fail = 0;
		displayTitle( mode, unit.title );
		return Promise.all( files.map( function( data ) {
			const message = `${data.name} is ${data.mimetype}`;
			function ok( givenMimeType ) {
				assert.strictEqual( givenMimeType, data.mimetype );
				pass++;
				console.log( `   - ${message}: \x1b[32mOK\x1b[0m` );
			}
			function nok( e ) {
				fail++;
				console.error( `   - ${message}: \x1b[31m${e}\x1b[0m` );
			}
			tests++;
			return new Promise( function( resolve, reject ) {
				unit.runner( data, mode, resolve, reject );
			} ).then( ok ).then( null, nok );
		} ) ).then( function() {
			console.log(
				`\n ${
					fail ? "\x1b[31mfailure" : "\x1b[32msuccess"
				} - ${tests} test${tests > 1 ? "s" : ""}, ${pass} passed, ${fail} failed\x1b[0m`
			);
			globalTests += tests;
			globalPass += pass;
			globalFail += fail;
		} );
	};
}
const data = [];
module.exports = {
	unit: function( title, runner ) {
		data.push( {
			title: title,
			runner: runner
		} );
		return this;
	},
	run: function() {
		let chain = require( "../build" );
		for ( let mode of require( "./modes" ) ) {
			for ( let unit of data ) {
				chain = chain.then( handleRunner( unit, mode ) );
			}
		}
		return chain.then( function() {
			let untestedMimetypes = [];
			for ( let mimetype in require( "../mimetypes.json" ) ) {
				if ( !files.tested.has( mimetype ) ) {
					untestedMimetypes.push( mimetype );
				}
			}
			if ( untestedMimetypes.length ) {
				console.log( `\n \x1b[33mUNTESTED:\n   - ${untestedMimetypes.join( "\n   - " )}\x1b[0m` );
			}
			console.log(
				`\n ${
					globalFail ? "\x1b[31mfailure" : "\x1b[32msuccess"
				} - ${units} unit${units > 1 ? "s" : ""}, ${globalTests} test${globalTests > 1 ? "s" : ""}, ${
					globalPass
				} passed, ${globalFail} failed\x1b[0m`
			);
			process.exit( globalFail ? 1 : 0 );
		}, function( e ) {
			console.log( `\n \x1b[31m${e.stack || e}\x1b[0m` );
			process.exit( -1 );
		} );
	}
};
