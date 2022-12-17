import express from "express";
import * as dotenv from 'dotenv';
dotenv.config();
import cors from "cors";
import config from "config";
import { Server } from "socket.io";
import helmet from "helmet";
import hpp from "hpp";

import { UserRoutes } from "./routes/user";
import { AuthRoutes } from "./routes/auth";
import { MessageRoutes } from "./routes/message";

declare global {
    var onlineUsers: any;
    var chatSocket: any;
}

const app = express();
const port = config.get<string>("port");

app.use(express.json());
app.use(cors({ origin: ['http://127.0.0.1:9000', 'http://localhost:9000', 'http://172.22.56.176'], credentials: true }))
app.use(helmet())
app.use(hpp())
app.disable('x-powered-by')
UserRoutes(app)
AuthRoutes(app)
MessageRoutes(app)

const server = app.listen(port)

const io = new Server(server, {
    cors: {
        origin: ['http://127.0.0.1:9000', 'http://localhost:9000', 'http://172.22.56.176'],
        credentials: true,
    },
});

globalThis.onlineUsers = new Map()

io.on('connection', (socket) => {
    globalThis.chatSocket = socket;
    socket.on('add-user', (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on('send-msg', (data) => {
        const sendUserSocket = onlineUsers.get(data.userFrom);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('msg-recieved', data);
        }
    });
});