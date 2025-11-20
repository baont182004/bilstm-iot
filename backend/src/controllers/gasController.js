// backend/src/controllers/gasController.js
import GasReading from "../models/GasReading.js";

// POST /api/gas  -> ESP32 gửi dữ liệu
export const createGasReading = async (req, res) => {
    try {
        const { deviceId, gasValue, rawAdc } = req.body;

        if (!deviceId || typeof gasValue !== "number") {
            return res
                .status(400)
                .json({ message: "Thiếu deviceId hoặc gasValue không hợp lệ" });
        }

        const doc = await GasReading.create({
            deviceId,
            gasValue,
            rawAdc,
        });

        return res.status(201).json({
            message: "OK",
            id: doc._id,
        });
    } catch (error) {
        console.error("Error saving gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/gas/latest?limit=100&deviceId=esp32-gas-01
export const getLatestGasReadings = async (req, res) => {
    try {
        const { limit = 100, deviceId } = req.query;

        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        const reversedDocs = docs.slice().reverse();
        return res.json(reversedDocs);
    } catch (error) {
        console.error("Error fetching gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
