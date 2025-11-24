// frontend/src/pages/DashBoard.jsx
import React, { useEffect, useState } from "react";
import { fetchGasData, fetchGasAnalysis } from "../api/gasApi";

import CurrentGasCard from "../components/CurrentGasCard";
import GasChart from "../components/GasChart";
import AnalyticsPanel from "../components/AnalyticsPanel";

const POLL_MS = 1000; // 1 giây
const THRESHOLD_DEFAULT = 300;

export default function Dashboard() {
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);

    const [hardThreshold, setHardThreshold] = useState(THRESHOLD_DEFAULT);
    const [smartThreshold, setSmartThreshold] = useState(THRESHOLD_DEFAULT);

    const [aiAnalysis, setAiAnalysis] = useState(null);

    const loadAll = async () => {
        try {
            // 1) Lịch sử để vẽ chart
            const { latest, history } = await fetchGasData(500);
            setLatest(latest);
            setHistory(history);

            // 2) Phân tích AI
            try {
                const analysis = await fetchGasAnalysis();
                setAiAnalysis(analysis);

                if (
                    analysis &&
                    typeof analysis.dynamicThreshold === "number"
                ) {
                    setSmartThreshold(analysis.dynamicThreshold);
                }
                if (analysis && typeof analysis.hardThreshold === "number") {
                    setHardThreshold(analysis.hardThreshold);
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

    const system = aiAnalysis?.system;

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
                    hardThreshold={hardThreshold}
                    smartThreshold={smartThreshold}
                    ai={aiAnalysis?.ai}
                    system={system}
                />

                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#111827",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                        fontSize: 14,
                    }}
                >
                    <h2>Trạng thái hệ thống</h2>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>
                            Backend đang trả dữ liệu từ{" "}
                            <code>/api/gas/latest</code> và{" "}
                            <code>/api/gas/analysis</code>.
                        </li>
                        <li>
                            <b>Ngưỡng Blynk</b> (V2) hiện tại:{" "}
                            <b>{hardThreshold} ppm</b>.
                        </li>
                        <li>
                            <b>Ngưỡng AI</b> (mean + 3σ, clamp) đang gợi ý:{" "}
                            <b>{Math.round(smartThreshold)} ppm</b>.
                        </li>
                        {system && (
                            <li style={{ marginTop: 8 }}>
                                <b>Trạng thái tổng hợp:</b>{" "}
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        color:
                                            system.severity === "DANGER"
                                                ? "#ef4444"
                                                : system.severity === "WARNING"
                                                    ? "#eab308"
                                                    : "#22c55e",
                                    }}
                                >
                                    {system.mode}
                                </span>
                                <div style={{ marginTop: 4, opacity: 0.85 }}>
                                    {system.message}
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            <GasChart
                data={history}
                threshold={hardThreshold}
                smartThreshold={smartThreshold}
            />

            <AnalyticsPanel
                history={history}
                threshold={hardThreshold}
                aiAnalysis={aiAnalysis}
            />
        </div>
    );
}
