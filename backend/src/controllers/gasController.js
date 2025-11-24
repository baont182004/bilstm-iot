// backend/src/controllers/gasController.js
import GasReading from "../models/GasReading.js";

// ==== Cấu hình AI / ngưỡng ====
const AI_BASE_URL = process.env.AI_SERVICE_URL;
const AI_SEQ_LEN = Number(process.env.AI_SEQ_LEN);
const NUM_FEATURES = 2; // [gasValue, rawAdc]

// Ngưỡng cứng hiện đang dùng ở Blynk (slider V2)
const HARD_THRESHOLD = Number(process.env.GAS_HARD_THRESHOLD);

// Ngưỡng xác suất để coi là leak “chắc cú”
const PROB_TH = Number(process.env.AI_PROB_THRESHOLD);

// Giới hạn cho ngưỡng AI
const MIN_T = Number(process.env.AI_MIN_DYNAMIC_THRESHOLD);
const MAX_T = Number(process.env.AI_MAX_DYNAMIC_THRESHOLD);

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// ==== Gọi sang BiLSTM API ====
async function callBiLstm(window) {
    if (!AI_BASE_URL) return null;

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

        const data = await resp.json(); // { prob_leak, label }
        return data;
    } catch (error) {
        console.error("Cannot call AI service:", error);
        return null;
    }
}

// ==== ESP8266 gửi mẫu gas lên ====
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

// ==== Frontend lấy lịch sử mới nhất để vẽ biểu đồ ====
export const getLatestGasReadings = async (req, res) => {
    try {
        const { deviceId, limit = 500 } = req.query;

        const query = {};
        if (deviceId) query.deviceId = deviceId;

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        // đảo lại cho FE: thời gian tăng dần
        const history = docs.slice().reverse();

        return res.json(history);
    } catch (error) {
        console.error("Error fetching gas data:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ==== Phân tích history + gọi BiLSTM ====
export const getGasAnalysis = async (req, res) => {
    try {
        const { deviceId, limit = 300 } = req.query;

        const query = {};
        if (deviceId) query.deviceId = deviceId;

        const docs = await GasReading.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        if (!docs.length) {
            return res.status(404).json({
                message: "Chưa có dữ liệu gas để phân tích",
            });
        }

        const history = docs.slice().reverse(); // thời gian tăng dần
        const values = history.map((d) => d.gasValue);
        const n = values.length;

        const sum = values.reduce((s, v) => s + v, 0);
        const mean = sum / Math.max(n, 1);
        const variance =
            values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
            Math.max(n, 1);
        const std = Math.sqrt(variance);

        // Ngưỡng AI: mean + 3σ, clamp để tránh quá vô lý
        let dynamicThreshold = mean + 3 * std;
        if (!Number.isFinite(dynamicThreshold)) dynamicThreshold = HARD_THRESHOLD;
        dynamicThreshold = clamp(dynamicThreshold, MIN_T, MAX_T);

        const lastGas = history[history.length - 1].gasValue;
        let aiResult = null;
        let systemStatus = {
            mode: "NO_AI",
            severity: "INFO",
            message: "AI chưa được kích hoạt hoặc thiếu dữ liệu.",
        };

        // Chỉ call AI khi đủ mẫu cho cửa sổ BiLSTM
        if (history.length >= AI_SEQ_LEN && AI_BASE_URL) {
            const windowDocs = history.slice(history.length - AI_SEQ_LEN);
            const window = windowDocs.map((d) => [d.gasValue, d.rawAdc ?? 0]);
            aiResult = await callBiLstm(window);

            if (aiResult) {
                const prob = aiResult.prob_leak ?? 0;
                const aiLeak = aiResult.label === 1;

                const overAiThreshold = lastGas >= dynamicThreshold;
                const overHardThreshold = lastGas >= HARD_THRESHOLD;

                let mode, severity, message;

                if (prob >= PROB_TH && aiLeak && overAiThreshold) {
                    mode = "LEAK_CONFIRMED";
                    severity = "DANGER";
                    message =
                        "BiLSTM và ngưỡng AI đều cho thấy khả năng rò rỉ cao. Cần kiểm tra và xử lý ngay.";
                } else if (prob >= PROB_TH && aiLeak && !overAiThreshold) {
                    mode = "EARLY_WARNING";
                    severity = "WARNING";
                    message =
                        "BiLSTM nhận diện mẫu tương tự rò rỉ nhưng nồng độ khí vẫn thấp. Nên theo dõi thêm.";
                } else if (overAiThreshold || overHardThreshold) {
                    mode = "HIGH_GAS";
                    severity = "WARNING";
                    message =
                        "Nồng độ khí vượt ngưỡng an toàn nhưng BiLSTM chưa chắc chắn là rò rỉ.";
                } else {
                    mode = "NORMAL";
                    severity = "OK";
                    message =
                        "Nồng độ khí thấp và BiLSTM cũng đánh giá bình thường. Hệ thống đang an toàn.";
                }

                systemStatus = {
                    mode,
                    severity,
                    message,
                    lastGas,
                    overAiThreshold,
                    overHardThreshold,
                    probLeak: prob,
                    probThreshold: PROB_TH,
                };
            }
        } else {
            systemStatus = {
                mode: "NO_DATA",
                severity: "INFO",
                message: `Chưa đủ dữ liệu để phân tích AI (cần tối thiểu ${AI_SEQ_LEN} mẫu liên tiếp).`,
            };
        }

        return res.json({
            deviceId: deviceId || null,
            count: n,
            baseline: { mean, std },
            dynamicThreshold,
            hardThreshold: HARD_THRESHOLD,
            seqLen: AI_SEQ_LEN,
            ai: aiResult,
            system: systemStatus,
        });
    } catch (error) {
        console.error("Error in getGasAnalysis:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
