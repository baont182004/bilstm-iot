import GasReading from "../models/GasReading.js";


const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const AI_SEQ_LEN = Number(process.env.AI_SEQ_LEN) || 30;
const NUM_FEATURES = 2; // [gasValue, rawAdc]

async function callBiLstm(window) {
    try {
        const resp = await fetch(`${AI_BASE_URL}/predict-window`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ window }),
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error("AI service error:", resp.status, text);
            return null;
        }

        const data = await resp.json();
        return data;
    } catch (error) {
        console.error("Cannot call AI service:", error);
        return null;
    }
}

// POST /api/gas  -> ESP8266 gửi dữ liệu lên backend
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
            message: "Đã ghi lại mẫu gas",
            data: doc,
        });
    } catch (error) {
        console.error("Error creating gas reading:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/gas/latest?deviceId=...&limit=...
//  -> Trả về list dữ liệu gas mới nhất để vẽ biểu đồ.
export const getLatestGasReadings = async (req, res) => {
    try {
        const { deviceId, limit = 500 } = req.query;

        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        // đảo lại cho FE: thời gian tăng dần
        const reversedDocs = docs.slice().reverse();
        return res.json(reversedDocs);
    } catch (error) {
        console.error("Error fetching gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// GET /api/gas/analysis?deviceId=...&limit=...
//  -> Phân tích lịch sử + gọi BiLSTM cho chuỗi gần nhất.
export const getGasAnalysis = async (req, res) => {
    try {
        const { deviceId, limit = 300 } = req.query;

        const query = {};
        if (deviceId) {
            query.deviceId = deviceId;
        }

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        if (!docs.length) {
            return res
                .status(404)
                .json({ message: "Chưa có dữ liệu gas để phân tích" });
        }

        const history = docs.slice().reverse(); // thời gian tăng dần

        // ====== Baseline thống kê cho toàn history ======
        const values = history.map((d) => d.gasValue);
        const n = values.length;
        const mean = values.reduce((sum, v) => sum + v, 0) / Math.max(n, 1);
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
            Math.max(n, 1);
        const std = Math.sqrt(variance);

        // Ngưỡng thông minh: mean + 3*std
        const k = 3;
        const MIN_T = 50;
        const MAX_T = 2000;
        let dynamicThreshold = mean + k * std;
        if (!Number.isFinite(dynamicThreshold)) {
            dynamicThreshold = 300; // fallback
        }
        dynamicThreshold = Math.min(MAX_T, Math.max(MIN_T, dynamicThreshold));

        // ====== Chuẩn bị window cho BiLSTM (AI_SEQ_LEN bước mới nhất) ======
        let aiResult = null;
        if (history.length >= AI_SEQ_LEN) {
            const windowDocs = history.slice(history.length - AI_SEQ_LEN);
            const window = windowDocs.map((d) => [
                d.gasValue,
                d.rawAdc ?? 0,
            ]);

            // chỉ call khi AI_BASE_URL được set
            if (AI_BASE_URL) {
                aiResult = await callBiLstm(window);
            }
        }

        return res.json({
            deviceId: deviceId || null,
            count: n,
            baseline: { mean, std },
            dynamicThreshold,
            seqLen: AI_SEQ_LEN,
            ai: aiResult,
        });
    } catch (error) {
        console.error("Error in getGasAnalysis:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
