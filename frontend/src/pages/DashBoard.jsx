// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";

import { fetchGasData, fetchGasAnalysis } from "../api/gasApi";

import CurrentGasCard from "../components/CurrentGasCard";
import GasChart from "../components/GasChart";
import AnalyticsPanel from "../components/AnalyticsPanel";

const POLL_MS = 2000;
const THRESHOLD_DEFAULT = 300; // ngưỡng cứng Blynk đang dùng

export default function Dashboard() {
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);

    // Ngưỡng cứng (Blynk)
    const [threshold] = useState(THRESHOLD_DEFAULT);

    // Phân tích AI từ backend
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [smartThreshold, setSmartThreshold] = useState(THRESHOLD_DEFAULT);

    const loadAll = async () => {
        try {
            // 1) Dữ liệu thô từ Mongo để vẽ biểu đồ
            const { latest, history } = await fetchGasData(500);
            setLatest(latest);
            setHistory(history);

            // 2) Phân tích AI + ngưỡng thông minh
            try {
                const analysis = await fetchGasAnalysis();
                setAiAnalysis(analysis);

                if (
                    analysis &&
                    typeof analysis.dynamicThreshold === "number"
                ) {
                    setSmartThreshold(analysis.dynamicThreshold);
                }
            } catch (err) {
                console.error("Lỗi gọi /api/gas/analysis:", err);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu gas:", err);
        }
    };

    useEffect(() => {
        loadAll();
        const id = setInterval(loadAll, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#020617",
                color: "#f9fafb",
                padding: 24,
            }}
        >
            <h1 style={{ marginBottom: 16 }}>Gas Detector Analytics</h1>

            <div
                style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)",
                }}
            >
                <CurrentGasCard
                    gas={latest?.gas}
                    timestamp={latest?.timestamp}
                    threshold={threshold}
                    smartThreshold={smartThreshold}
                    ai={aiAnalysis?.ai}
                />

                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#111827",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    }}
                >
                    <h2>Trạng thái hệ thống</h2>
                    <p style={{ marginTop: 8, fontSize: 14 }}>
                        • Backend đang trả list từ{" "}
                        <code>/api/gas/latest</code> và{" "}
                        <code>/api/gas/analysis</code>. <br />
                        • Ngưỡng cứng (Blynk) hiện tại:{" "}
                        <b>{THRESHOLD_DEFAULT} ppm</b>. <br />
                        • Ngưỡng thông minh được tính từ dữ liệu và BiLSTM,
                        hiển thị ở panel thống kê bên dưới.
                    </p>
                </div>
            </div>

            <GasChart
                data={history}
                threshold={threshold}
                smartThreshold={smartThreshold}
            />

            <AnalyticsPanel
                history={history}
                threshold={threshold}
                aiAnalysis={aiAnalysis}
                smartThreshold={smartThreshold}
            />
        </div>
    );
}
