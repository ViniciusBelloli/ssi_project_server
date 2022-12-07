import express from "express";
import cors from 'cors';
import { UserRoutes } from "./routes/user";

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }))
UserRoutes(app)

app.listen(3333)