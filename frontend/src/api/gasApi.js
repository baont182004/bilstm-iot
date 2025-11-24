// src/api/gasApi.js
import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

console.log("[gasApi] API_BASE_URL =", API_BASE_URL);

export const fetchGasData = async (limit = 500) => {
    const url = `${API_BASE_URL}/api/gas/latest`;
    console.log("[gasApi] GET", url, "limit=", limit);

    const res = await axios.get(url, { params: { limit } });

    const raw = res.data;
    const arr = Array.isArray(raw) ? raw : [raw];

    const history = arr.map((item) => ({
        id: item._id,
        deviceId: item.deviceId,
        gas: item.gasValue,
        rawAdc: item.rawAdc,
        timestamp: item.createdAt,
    }));

    const latest = history.length > 0 ? history[history.length - 1] : null;

    console.log("[gasApi] history length =", history.length, "latest =", latest);

    return { latest, history };
};
