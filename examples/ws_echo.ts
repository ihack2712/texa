// Imports
import { Application } from "../mod.ts";

// Create a new application.
const app = new Application(Deno.args[0] || "0.0.0.0:4000");

// Output the server origin.
console.log(app.origin);

// Listen for incoming websocket connections.
app.on("connection", async socket => {
	
	// A new connection has been accepted.
	console.log("Connection:", socket.id);
	
	// Listen for messages.
	socket.on("message", async message => {
		
		// Return the message.
		await socket.send(message);
	});
	
	// Listen for the close event.
	socket.on("close", (closer, code, reason) => {
		// See whether it was the client or the server who ended
		// the connection. Then print why it was disconnected.
		if (closer === "client")
			console.log("Client %s has left because (%d):", socket.id, code, reason);
		else console.log("Server disconnected %s because (%d):", socket.id, code, reason);
	});
});

// In the case of a websocket error,
// output it to stderr.
app.on("error", console.error);

// Just in case a browser tries to access.
app.use(async (req, res) => res.status(200).end("Hello"));

// Start the application.
await app.start();
