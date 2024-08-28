/* Constants for CORS headers */
export const ACAO = 'Access-Control-Allow-Origin';
export const ACRM = 'Access-Control-Request-Method';
export const ACAC = 'Access-Control-Allow-Credentials';
export const ACAM = 'Access-Control-Allow-Methods';
export const ACAH = 'Access-Control-Allow-Headers';
export const ACRH = 'Access-Control-Request-Headers';
export const ACEH = 'Access-Control-Expose-Headers';

/* Constants for other headers */
export const AUTH = 'Authorization';
export const LOC = 'Location';
export const CONTENT_TYPE = 'Content-Type';
export const CONTENT_LENGTH = 'Content-Length';
export const ORIGIN = 'Origin';
export const ACCEPT = 'Accept';
export const ALLOW = 'Allow';
export const REFERRER = 'Referer'; // Yes, that is correct

export const DESTINATIONS = [
	'', 'audio', 'audioworklet', 'document', 'embed', 'fencedframe', 'font', 'frame', 'iframe', 'image',
	'json', 'manifest', 'object', 'paintworklet', 'report', 'script', 'sharedworker', 'style', 'track',
	'video', 'worker', 'xslt',
];
