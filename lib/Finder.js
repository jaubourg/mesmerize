"use strict";

const iterators = new Map();

function getIterator( mode ) {
	let iterator = iterators.get( mode );
	if ( !iterator ) {
		iterators.set( mode, ( iterator = require( `./iterators/${mode}` ) ) );
	}
	return iterator;
}

function Finder( mode ) {
	this._value = null;
	const self = this;
	this._iterator = getIterator( mode || "function" )( function( value ) {
		self._value = value;
	} );
	this._running = true;
}

Finder.prototype.value = function() {
	return this._value;
};

Finder.prototype.running = function() {
	return this._running;
};

Finder.prototype.charCode = function( charCode ) {
	if ( this._running ) {
		this._running = !this._iterator.next( charCode ).done;
	}
	return this;
};

Finder.prototype.buffer = function( buffer ) {
	const length = buffer.length;
	for ( let i = 0; this._running && i < length; i++ ) {
		this.charCode( buffer[ i ] );
	}
	return this;
};

Finder.prototype.string = function( string, encoding ) {
	if ( this._running ) {
		this.buffer( new Buffer( string, encoding ) );
	}
	return this;
};

Finder.prototype.feed = function( object, encoding ) {
	if ( this._running ) {
		const type = typeof object;
		if ( type === "string" ) {
			this.string( object, encoding );
		} else if ( type === "number" ) {
			this.charCode( object );
		} else {
			this.buffer( object );
		}
	}
	return this;
};

module.exports = Finder;
