import express from "express";
import cors from "cors";
import { UserRoutes } from "./routes/user";
import { AuthRoutes } from "./routes/auth";
import config from "config";
import { Server } from "socket.io";

declare global {
    var onlineUsers: any;
    var chatSocket: any;
}

const app = express();
const port = config.get<string>("port");

app.use(express.json());
app.use(cors({ origin: '*' }))
UserRoutes(app)
AuthRoutes(app)

const server = app.listen(port)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true,
    },
});

globalThis.onlineUsers = new Map()

io.on("connection", (socket) => {
    globalThis.chatSocket = socket;
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieved", data.message);
        }
    });
});