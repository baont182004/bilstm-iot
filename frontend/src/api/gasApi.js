// frontend/src/api/gasApi.js
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

console.log("[gasApi] API_BASE_URL =", API_BASE_URL);

// Lịch sử gas để vẽ chart
export const fetchGasData = async (limit = 500) => {
    const url = `${API_BASE_URL}/api/gas/latest`;
    const res = await axios.get(url, { params: { limit } });

    const raw = res.data;
    const arr = Array.isArray(raw) ? raw : [raw];

    const history = arr.map((item) => ({
        id: item._id,
        gas: item.gasValue,
        rawAdc: item.rawAdc,
        deviceId: item.deviceId,
        timestamp: item.createdAt,
    }));

    const latest = history.length > 0 ? history[history.length - 1] : null;

    return { latest, history };
};

// Phân tích AI + ngưỡng thông minh
export const fetchGasAnalysis = async () => {
    const url = `${API_BASE_URL}/api/gas/analysis`;
    const res = await axios.get(url);
    return res.data; // { baseline, dynamicThreshold, hardThreshold, ai, system, ... }
};

// Thống kê các chuỗi rò rỉ trong 24h gần nhất
export const fetchLeakIncidents24h = async () => {
    const url = `${API_BASE_URL}/api/gas/incidents/24h`;
    const res = await axios.get(url);
    return res.data; // { from, to, totalIncidents, dangerIncidents, maxGasPeak, incidents: [...] }
};
