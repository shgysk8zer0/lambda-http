// import { createHandler } from '../handler.js';

// export default createHandler({
// 	get(req, context) {
// 		return Response.json(context);
// 	}
// });

export default async (req, context) => req instanceof Request ? Response.json(context) : null;
