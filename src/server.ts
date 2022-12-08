import express from "express";
import cors from 'cors';
import { UserRoutes } from "./routes/user";
import { AuthRoutes } from "./routes/auth";
import config from "config";

const app = express();
const port = config.get<string>("port");

app.use(express.json());
app.use(cors({ origin: '*' }))
UserRoutes(app)
AuthRoutes(app)

app.listen(port)