"use strict";

const RUNS = 100000;

const fs = require( "fs" );

const files = require( "./files" ).map( function( data ) {
	return fs.readFileSync( data.path );
} );

function standard( _options ) {
	return function( _library ) {
		return function( buffer ) {
			const options = _options;
			const library = _library;
			const hrtime = process.hrtime;
			const start = hrtime();
			library( buffer, options );
			return hrtime( start );
		};
	};
}
const libs = {
	"file-type": standard(),
};
require( "./iterators" ).forEach( function( name ) {
	libs[ `~${name || "DEFAULT"}` ] = standard( name && {
		iterator: require( `../lib/iterators/${name}` )
	} );
} );

const rMode = /^~/;
const times = [];
const minTimes = [];
const timerCounts = new Set();
function populateTimers( divider ) {
	let runs = RUNS;
	while ( runs >= 1 ) {
		timerCounts.add(
			1 * ( Math.round( runs < 10 ? 1 : runs ) + "" ).replace( /^(.)(.*)$/, function( _, $1, $2 ) {
				return $1 + $2.replace( /./g, "0" );
			} )
		);
		runs = runs / divider;
	}
}
populateTimers( 10 );
populateTimers( 5 );
populateTimers( 2 );
const runCounts = [];
for ( let count of timerCounts ) {
	runCounts.push( count );
}
runCounts.sort( function( a, b ) {
	return a - b;
} );

Object.getOwnPropertyNames( libs ).forEach( function( name, index ) {
	const isMode = rMode.test( name );
	const run = libs[ name ]( require( isMode ? ".." : name ) );
	const time = [];
	function iteration( buffer ) {
		run( buffer ).forEach( function( value, index ) {
			time[ index ] = ( time[ index ] || 0 ) + value;
		} );
	}
	const scaleTimers = [];
	for ( let i = 0; i < RUNS; ) {
		files.forEach( iteration );
		i++;
		if ( timerCounts.has( i ) ) {
			const micro = ( time[ 0 ] * 1000 + time[ 1 ] / 1000 ) / i;
			if ( !index || micro < minTimes[ scaleTimers.length ] ) {
				minTimes[ scaleTimers.length ] = micro;
			}
			scaleTimers.push( ( time[ 0 ] * 1000 + time[ 1 ] / 1000 ) / i );
		}
	}
	times.push( {
		library: name,
		time: scaleTimers,
		fullTime: scaleTimers[ scaleTimers.length - 1 ]
	} );
} );

function pad( string, length ) {
	return `${new Array( length - string.length + 1 ).join( " " )}${string}`;
}

const displays = [];
const padding = [];

runCounts.forEach( function( count, timeIndex ) {
	displays.push( times.map( function( data ) {
		const time = data.time[ timeIndex ];
		const output = [
			`${data.library}`,
			( time / 1000 ).toFixed( 2 ) + "ms",
			time.toFixed( 2 ) + "µs",
			time === minTimes[ timeIndex ] ?
				"BEST" :
				"+" + formatNumber( Math.round( time * 100 / minTimes[ timeIndex ] ) - 100 ) + "%"
		];
		output.forEach( function( text, i ) {
			if ( padding[ i ] === undefined || padding[ i ] < text.length ) {
				padding[ i ] = text.length;
			}
		} );
		return output;
	} ) );
} );
function formatNumber( x ) {
	return x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, "," );
}
displays.forEach( function( display, runIndex ) {
	display.forEach( function( data, index ) {
		let log = data.map( function( text, i ) {
			return pad( text, padding[ i ] );
		} );
		log = "| " + log.join( " | " ) + " |";
		if ( !index ) {
			console.log( "\n" + pad( formatNumber( runCounts[ runIndex ] ) + "x", log.length ) +
				"\n" + new Array( log.length + 1 ).join( "-" ) );
		}
		console.log( log );
		if ( index === display.length - 1 ) {
			console.log( new Array( log.length + 1 ).join( "-" ) );
		}
	} );
} );
