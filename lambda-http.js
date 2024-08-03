import './polyfills.js';
import { createHandler } from './handler.js';
import * as HTTP_STATUS from './status.js';
import * as MIME from './mimes.js';

export { isJSONRequest, isFormDataRequest, isCORSRequest, isSameOriginRequest, getOriginOrReferrer, getContentType } from './utils.js';
export { RequestHandlerTest } from './RequestHandlerTest.js';
export { createHandler, HTTP_STATUS, MIME };
export default createHandler;
