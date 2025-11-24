// backend/src/routes/gasRoutes.js
import express from "express";
import {
    createGasReading,
    getLatestGas,
    getGasHistory,
} from "../controllers/gasController.js";

const router = express.Router();

router.post("/", createGasReading);

router.get("/latest", getLatestGas);


router.get("/history", getGasHistory);

export default router;
