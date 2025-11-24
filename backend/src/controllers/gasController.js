import GasReading from "../models/GasReading.js";

// POST /api/gas 
export const createGasReading = async (req, res) => {
    try {
        const { deviceId, gasValue, rawAdc } = req.body;
        if (!deviceId) {
            return res.status(400).json({ message: "Thiếu deviceId" });
        }
        if (typeof gasValue !== "number") {
            return res
                .status(400)
                .json({ message: "gasValue phải là số (ppm) nhưng nhận được kiểu khác" });
        }

        const doc = await GasReading.create({
            deviceId,
            gasValue,
            rawAdc,
        });

        return res.status(201).json({
            message: "Đã lưu dữ liệu gas thành công",
            id: doc._id,
        });
    } catch (error) {
        console.error("Error saving gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/gas/latest?deviceId=
export const getLatestGas = async (req, res) => {
    try {
        const { deviceId } = req.query;
        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }

        const doc = await GasReading.findOne(query).sort({ createdAt: -1 });

        if (!doc) {
            return res.status(404).json({ message: "Chưa có dữ liệu gas nào" });
        }

        return res.json({
            id: doc._id,
            deviceId: doc.deviceId,
            gas: doc.gasValue,
            rawAdc: doc.rawAdc,
            timestamp: doc.createdAt,
        });
    } catch (error) {
        console.error("Error fetching latest gas:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/gas/history?limit=100&deviceId=esp8266-gas-01
export const getGasHistory = async (req, res) => {
    try {
        const { limit = 100, deviceId } = req.query;
        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        const reversed = docs.slice().reverse();

        const data = reversed.map((d) => ({
            id: d._id,
            deviceId: d.deviceId,
            gas: d.gasValue,
            rawAdc: d.rawAdc,
            timestamp: d.createdAt,
        }));

        return res.json(data);
    } catch (error) {
        console.error("Error fetching gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
