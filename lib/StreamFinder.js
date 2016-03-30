"use strict";

const Finder = require( "./Finder" );
const inherits = require( "util" ).inherits;
const Transform = require( "stream" ).Transform;

function StreamFinder( options ) {
	Transform.call( this );
	options = options || {};
	this._finder = new Finder( options.hasOwnProperty( "iterator" ) && options.iterator );
	this._queue = options.hasOwnProperty( "queue" ) && options.queue ? [] : null;
}

inherits( StreamFinder, Transform );

StreamFinder.prototype._mimetype = function() {
	this.emit( "mimetype", this._finder.value() );
	const queue = this._queue;
	this._queue = null;
	if ( queue ) {
		const length = queue.length;
		for ( let i = 0; i < length; i++ ) {
			this.push( queue[ i ] );
		}
	}
};

StreamFinder.prototype._flush = function( done ) {
	if ( this._finder.running() ) {
		this._mimetype();
	}
	done();
};

StreamFinder.prototype._transform = function( chunk, encoding, done ) {
	if ( this._finder.running() && !this._finder.feed( chunk, encoding ).running() ) {
		this._mimetype();
	}
	( this._queue || this ).push( chunk );
	done();
};

module.exports = StreamFinder;
