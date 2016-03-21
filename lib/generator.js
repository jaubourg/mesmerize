"use strict";

const mimetypes = require( "./mimetypes" );

module.exports = function*( foundCallback ) {
	let current = mimetypes;
	while ( current ) {
		if ( Array.isArray( current ) ) {
			const lastIndex = current.length - 1;
			for ( let i = 0; i < lastIndex; i++ ) {
				const item = current[ i ];
				if ( item !== ( yield ) && item !== null ) {
					return;
				}
			}
			current = current[ lastIndex ];
		} else if ( current instanceof Map ) {
			const found = current.get( true );
			if ( found ) {
				foundCallback( found );
			}
			current = current.get( yield ) || current.get( null );
		} else if ( current ) {
			foundCallback( current );
			break;
		}
	}
};
