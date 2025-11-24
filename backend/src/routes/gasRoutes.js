// backend/src/routes/gasRoutes.js
import express from "express";
import {
    createGasReading,
    getLatestGasReadings,
    getGasAnalysis,
} from "../controllers/gasController.js";

const router = express.Router();

// ESP8266 gửi dữ liệu gas lên
router.post("/", createGasReading);

// Frontend lấy lịch sử mới nhất để vẽ biểu đồ
router.get("/latest", getLatestGasReadings);

// Frontend lấy phân tích AI + ngưỡng thông minh
router.get("/analysis", getGasAnalysis);

export default router;
