import { Application } from "../mod.ts";
const app = new Application(Deno.args[0] || "0.0.0.0:4000");
(app.on("connection", async socket => {
	console.log("Client %s connected!", socket.id);
	socket.on("message", async message => await socket.send(message));
	socket.on("close", (closer, code, reason) => console.log("%s because (%d): %s", closer === "client" ? `Client ${socket.id} has left` : `Client disconnected ${socket.id}`, code, reason));
}) as any).start((() => console.log(app.origin))());
