"use strict";

const root = null;

function Iterator( root, callback ) {
	this._function = root;
	this._callback = callback;
}

Iterator.prototype.next = function( charCode ) {
	this._function = this._function( charCode, this._callback );
	return {
		done: !this._function
	};
};

module.exports = function( callback ) {
	return new Iterator( root, callback );
};
