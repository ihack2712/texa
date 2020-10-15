// Imports
import { Application, Static } from "../mod.ts";

// Create a new app.
const app = new Application(Deno.args[0] || "0.0.0.0:4000", {
	// Disable web sockets.
	allowWebSocket: false
});

// Add a static files middleware from `<CWD>/examples/www`
app.use(new Static("examples/www"));

// Print the server url.
console.log(app.origin);

// Start listening for requests.
await app.start();
