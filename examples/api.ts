// Imports
import { Application, Router } from "../mod.ts";

// Create a new app.
const app = new Application(Deno.args[0] || "0.0.0.0:4000", {
	// Disable web sockets.
	allowWebSocket: false
});

// Create an API endpoint.
const router = new Router();

// Make the app use the API router.
app.use(router);

// A post request.
router.post("/", async (req, res) => {
	console.log(req.body);
	await res.json(req.body);
});

// Print the server url.
console.log(app.origin);

// Start listening for requests.
await app.start();
