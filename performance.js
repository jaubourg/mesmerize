"use strict";

const RUNS = 5000;

const fs = require( "fs" );

const files = require( "./test/files" ).map( function( data ) {
	return fs.readFileSync( data.path );
} );

function standard( library ) {
	return function( buffer ) {
		const start = process.hrtime();
		if ( library( buffer ) !== true ) {
			return process.hrtime( start );
		}
	};
}
const libs = {
	"file-type": standard,
	"": standard
};

const times = [];
Object.getOwnPropertyNames( libs ).forEach( function( name, index ) {
	const run = libs[ name ]( require( name || "." ) );
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
		library: name || "mesmerize",
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
		mult: Math.round( data.time / times.min ) + "x"
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
