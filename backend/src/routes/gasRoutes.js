import express from "express";
import {
    createGasReading,
    getLatestGasReadings,
    getGasAnalysis,
    getLeakIncidents24h,
} from "../controllers/gasController.js";

const router = express.Router();

router.post("/", createGasReading);
router.get("/latest", getLatestGasReadings);
router.get("/analysis", getGasAnalysis);


router.get("/incidents/24h", getLeakIncidents24h);

export default router;
