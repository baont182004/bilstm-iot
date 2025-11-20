// backend/src/routes/gasRoutes.js
import express from "express";
import {
    createGasReading,
    getLatestGasReadings,
} from "../controllers/gasController.js";

const router = express.Router();


router.post("/", createGasReading);


router.get("/latest", getLatestGasReadings);

export default router;
