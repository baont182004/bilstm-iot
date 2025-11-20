// backend/src/app.js
import express from "express";
import cors from "cors";
import gasRoutes from "./routes/gasRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/gas", gasRoutes);

export default app;

