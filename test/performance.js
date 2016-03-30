"use strict";

const RUNS = 50000;

const fs = require( "fs" );

const files = require( "./files" ).map( function( data ) {
	return fs.readFileSync( data.path );
} );

function standard( options ) {
	return function( library ) {
		return function( buffer ) {
			const start = process.hrtime();
			if ( library( buffer, options ) !== true ) {
				return process.hrtime( start );
			}
		};
	};
}
const libs = {
	"file-type": standard(),
};
require( "./modes" ).forEach( function( mode ) {
	libs[ `~${mode || "DEFAULT"}` ] = standard( mode && {
		mode: mode
	} );
} );

const rMode = /^~/;
const times = [];
Object.getOwnPropertyNames( libs ).forEach( function( name, index ) {
	const isMode = rMode.test( name );
	const run = libs[ name ]( require( isMode ? ".." : name ) );
	const time = [];
	function iteration( buffer ) {
		run( buffer ).forEach( function( value, index ) {
			time[ index ] = ( time[ index ] || 0 ) + value;
		} );
	}
	for ( let i = 0; i < RUNS; i++ ) {
		files.forEach( iteration );
	}
	const micro = ( time[ 0 ] * 1000 + time[ 1 ] / 1000 ) / RUNS;
	if ( !index || times.min > micro ) {
		times.min = micro;
	}
	times.push( {
		library: name,
		time: micro
	} );
} );

function pad( string, length ) {
	return `${new Array( length - string.length + 1 ).join( " " )}${string}`;
}

const padding = {};
const display = times.map( function( data, index ) {
	const output = {
		library: `${data.library}`,
		ms: ( data.time / 1000 ).toFixed( 2 ) + "ms",
		mic: data.time.toFixed( 2 ) + "µs",
		mult: ( data.time / times.min ).toFixed( 1 ) + "x"
	};
	for ( let key in output ) {
		if ( !index || padding[ key ] < output[ key ].length ) {
			padding[ key ] = output[ key ].length;
		}
	}
	return output;
} );
display.forEach( function( data, index ) {
	let log = [];
	for ( let key in data ) {
		log.push( pad( data[ key ], padding[ key ] ) );
	}
	log = "| " + log.join( " | " ) + " |";
	if ( !index ) {
		console.log( "\n" + new Array( log.length + 1 ).join( "-" ) );
	}
	console.log( log );
	if ( index === display.length - 1 ) {
		console.log( new Array( log.length + 1 ).join( "-" ) );
	}
} );
