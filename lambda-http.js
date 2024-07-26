import './polyfills.js';
import { createHandler } from './handler.js';
import { isJSONRequest, isFormDataRequest } from './utils.js';
import * as HTTP_STATUS from './status.js';
import * as MIME from './mimes.js';

export { createHandler, isJSONRequest, isFormDataRequest, HTTP_STATUS, MIME };
export default createHandler;
