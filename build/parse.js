"use strict";

const rBytes = /((?:[0-9a-f]{2})+)|(\.\.)|'([^']+)'|\[([^\]]+)\]|\s+|(.)/gi;

function parseOne( expression, mimetype, map ) {
	let test;
	let currents = new Set( [ map ] );
	function pushOne( current, number ) {
		let next = current.get( number );
		if ( !next ) {
			current.set( number, ( next = new Map() ) );
		}
		return next;
	}
	function push( numbers ) {
		if ( !Array.isArray( numbers ) ) {
			numbers = [ numbers ];
		}
		const newCurrents = new Set();
		currents.forEach( function( current ) {
			numbers.forEach( function( number ) {
				newCurrents.add( pushOne( current, number ) );
			} );
		} );
		currents = newCurrents;
	}
	const handlers = [
		function( string ) {
			const buffer = new Buffer( string, "hex" );
			const length = buffer.length;
			for ( let i = 0; i < length; i++ ) {
				push( buffer[ i ] );
			}
		},
		function() {
			push( null );
		},
		function( string ) {
			const length = string.length;
			for ( let i = 0; i < length; i++ ) {
				push( string[ i ] === "." ? null : string.charCodeAt( i ) );
			}
		},
		function( expression ) {
			const array = [];
			const length = expression.length;
			for ( let i = 0; i < length; i++ ) {
				array.push( expression.charCodeAt( i ) );
			}
			push( array );
		},
		function() {
			throw new Error( `${mimetype}: syntax error in ${JSON.stringify( expression )} column ${test.index + 1}` );
		}
	];
	const nbHandlers = handlers.length;
	while ( ( test = rBytes.exec( expression ) ) ) {
		for ( let i = 0; i < nbHandlers; i++ ) {
			if ( test[ i + 1 ] ) {
				handlers[ i ]( test[ i + 1 ] );
				break;
			}
		}
	}
	currents.forEach( function( current ) {
		const existing = current.get( true );
		if ( existing ) {
			throw new Error( `ambiguity between ${existing} and ${mimetype}` );
		}
		current.set( true, mimetype );
	} );
}

module.exports = function( list ) {
	const map = new Map();
	Object.getOwnPropertyNames( list ).forEach( function( mimetype ) {
		const expressions = Array.isArray( list[ mimetype ] ) ? list[ mimetype ] : [ list[ mimetype ] ];
		expressions.forEach( function( expression ) {
			parseOne( expression, mimetype, map );
		} );
	} );
	return map;
};
