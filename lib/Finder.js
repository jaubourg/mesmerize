"use strict";

const mimeTypes = require( "./mimeTypes" );

function Finder() {
	this._map = mimeTypes;
	this._array = null;
	this._lastIndex = 0;
	this._index = 0;
	this._value = null;
	this._running = true;
}

Finder.prototype.value = function() {
	return this._value;
};

Finder.prototype.running = function() {
	return this._running;
};

Finder.prototype._next = function( next ) {
	if ( Array.isArray( next ) ) {
		this._array = next;
		this._lastIndex = next.length - 1;
		this._index = 0;
		this._map = null;
	} else if ( typeof next === "object" ) {
		this._map = next;
		this._value = next.get( true ) || this._value;
		this._array = null;
	} else {
		this._map = this._array = null;
		this._value = next || this._value;
		this._running = false;
	}
};

Finder.prototype.charCode = function( charCode ) {
	if ( this._array ) {
		const expected = this._array[ this._index++ ];
		if ( expected !== null && expected !== charCode ) {
			this._next();
		} else if ( this._index >= this._lastIndex ) {
			this._next( this._array[ this._lastIndex ] );
		}
	} else if ( this._map ) {
		this._next( this._map.get( charCode ) || this._map.get( null ) || this._map.get( true ) );
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
	const type = typeof object;
	if ( type === "string" ) {
		this.string( object, encoding );
	} else if ( type === "number" ) {
		this.charCode( object );
	} else {
		this.buffer( object );
	}
	return this;
};

module.exports = Finder;
