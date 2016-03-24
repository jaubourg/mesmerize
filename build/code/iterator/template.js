"use strict";

const root = null;

function Iterator( root, callback ) {
	this._map = null;
	this._array = null;
	this._index = 0;
	this._lastIndex = 0;
	this._callback = callback;
	this._started = false;
	this._done = false;
	this._next( root );
}

Iterator.prototype._next = function( data ) {
	if ( Array.isArray( data ) ) {
		this._array = data;
		this._index = 0;
		this._lastIndex = data.length - 1;
		this._map = null;
	} else if ( data instanceof Map ) {
		this._map = data;
		this._array = null;
		const type = data.get( true );
		if ( type ) {
			this._callback( type );
		}
	} else {
		if ( data ) {
			this._callback( data );
		}
		this._done = true;
	}
};

Iterator.prototype.next = function( charCode ) {
	if ( this._started ) {
		if ( this._array ) {
			const current = this._array[ this._index++ ];
			if ( !current || current === charCode ) {
				if ( this._index === this._lastIndex ) {
					this._next( this._array[ this._index ] );
				}
			} else {
				this._next();
			}
		} else {
			this._next( this._map.get( charCode ) || this._map.get( null ) );
		}
	} else {
		this._started = true;
	}
	return {
		done: this._done
	};
};

module.exports = function( callback ) {
	return new Iterator( root, callback );
};
