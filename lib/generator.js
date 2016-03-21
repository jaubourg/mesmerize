"use strict";

const mimetypes = require( "./mimetypes" );

module.exports = function*() {
	let current = mimetypes;
	let found = null;
	while ( current ) {
		if ( Array.isArray( current ) ) {
			const lastIndex = current.length - 1;
			for ( let i = 0; i < lastIndex; i++ ) {
				const item = current[ i ];
				if ( item !== ( yield found ) && item !== null ) {
					return found;
				}
			}
			current = current[ lastIndex ];
		} else if ( current instanceof Map ) {
			found = current.get( true ) || found;
			current = current.get( yield found ) || current.get( null );
		} else {
			return current || found;
		}
	}
	return found;
};
