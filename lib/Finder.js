"use strict";

const generator = require( "./generator" );

function Finder() {
	this._iterator = generator();
	this._next = this._iterator.next();
}

Finder.prototype.value = function() {
	return this._next.value;
};

Finder.prototype.running = function() {
	return !!this._iterator;
};

Finder.prototype.charCode = function( charCode ) {
	if ( this._iterator ) {
		this._next = this._iterator.next( charCode );
		if ( this._next.done ) {
			this._iterator = null;
		}
	}
	return this;
};

Finder.prototype.buffer = function( buffer ) {
	const length = buffer.length;
	for ( let i = 0; this._iterator && i < length; i++ ) {
		this.charCode( buffer[ i ] );
	}
	return this;
};

Finder.prototype.string = function( string, encoding ) {
	if ( this._iterator ) {
		this.buffer( new Buffer( string, encoding ) );
	}
	return this;
};

Finder.prototype.feed = function( object, encoding ) {
	if ( this._iterator ) {
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
