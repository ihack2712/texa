import { Application } from "../mod.ts";
const app = new Application(Deno.args[0] || "0.0.0.0:4000");
app.onconnection.subscribe(async socket => {
	console.log("Client %s connected!", socket.id);
	socket.onmessage.subscribe(async message => await socket.send(message));
	socket.onclose.subscribe((closer, code, reason) => console.log("%s because (%d): %s", closer === "client" ? `Client ${socket.id} has left` : `Client disconnected ${socket.id}`, code, reason));
});
console.log(app.origin);
await app.start();
