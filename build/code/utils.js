"use strict";

/**
 * Encodes a number key to be more byte-like and readable
 * @param {number} key
 * @return {string}
 */
function encodeKey( key ) {
	// Set to hexadecimal
	key = key.toString( 16 );
	// Pad with a 0 if needed
	if ( key.length < 2 ) {
		key = `0${key}`;
	}
	// Make it a proper javascript hexadecimal number
	return `0x${key}`;
}

// Newline matcher
const rNewLine = /\n/g;

/**
 * Indents a code block with a tab
 * @param {string} block the code block
 * @return {string} the code block indented
 */
function indent( block ) {
	return block.replace( rNewLine, "\n\t" );
}

// Export
module.exports = {
	encodeKey: encodeKey,
	indent: indent
};
