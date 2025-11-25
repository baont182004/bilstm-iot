// frontend/src/pages/DashBoard.jsx
import React, { useEffect, useState } from "react";
import {
    fetchGasData,
    fetchGasAnalysis,
    fetchLeakIncidents24h,
} from "../api/gasApi";

import CurrentGasCard from "../components/CurrentGasCard";
import GasChart from "../components/GasChart";
import AnalyticsPanel from "../components/AnalyticsPanel";

const POLL_MS = 1000; // 1 giây
const THRESHOLD_DEFAULT = 300;

export default function Dashboard() {
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);

    const [hardThreshold, setHardThreshold] = useState(THRESHOLD_DEFAULT);
    const [smartThreshold, setSmartThreshold] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [incidentSummary, setIncidentSummary] = useState(null);

    const loadAll = async () => {
        try {
            const [gasRes, analysis, incidents] = await Promise.all([
                fetchGasData(500),
                fetchGasAnalysis(),
                fetchLeakIncidents24h(),
            ]);

            setLatest(gasRes.latest);
            setHistory(gasRes.history);

            if (analysis) {
                setHardThreshold(
                    analysis.hardThreshold ?? THRESHOLD_DEFAULT
                );
                setSmartThreshold(analysis.dynamicThreshold ?? null);
                setAiAnalysis(analysis);
            }

            setIncidentSummary(incidents);
        } catch (err) {
            console.error("Lỗi tải dữ liệu gas:", err);
        }
    };

    useEffect(() => {
        loadAll();
        const id = setInterval(loadAll, POLL_MS);
        return () => clearInterval(id);
    }, []);

    const currentGas = latest?.gas ?? null;
    const currentTs = latest?.timestamp ?? null;

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#020617",
                color: "#e5e7eb",
                padding: 16,
                boxSizing: "border-box",
            }}
        >
            <h1
                style={{
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 16,
                }}
            >
                Gas Detector Analytics
            </h1>

            {/* Hàng trên: current card + system info (có thể mở rộng sau) */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.3fr)",
                    gap: 16,
                }}
            >
                <CurrentGasCard
                    gas={currentGas}
                    timestamp={currentTs}
                    hardThreshold={hardThreshold}
                    smartThreshold={smartThreshold}
                    ai={aiAnalysis?.ai}
                    system={aiAnalysis?.system}
                />

                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#020617",
                        border: "1px solid #1f2937",
                        fontSize: 13,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                    }}
                >
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            marginBottom: 4,
                        }}
                    >
                        Trạng thái hệ thống
                    </div>
                    <div>
                        • Backend đang trả dữ liệu từ{" "}
                        <code>/api/gas/latest</code>,{" "}
                        <code>/api/gas/analysis</code> và{" "}
                        <code>/api/gas/incidents/24h</code>.
                    </div>
                    <div>
                        • Ngưỡng Blynk (V2) hiện tại:{" "}
                        <strong>{hardThreshold} ppm</strong>.
                    </div>
                    <div>
                        • Ngưỡng AI (mean + 3σ, clamp):{" "}
                        <strong>
                            {smartThreshold == null
                                ? "—"
                                : `${smartThreshold.toFixed(1)} ppm`}
                        </strong>{"."}
                    </div>
                    <div>
                        • BiLSTM đang đánh giá chuỗi {aiAnalysis?.seqLen ?? "—"}{" "}
                        mẫu với xác suất rò rỉ được cập nhật theo thời gian
                        thực.
                    </div>
                </div>
            </div>

            {/* Biểu đồ + thống kê chi tiết */}
            <GasChart
                data={history}
                threshold={hardThreshold}
                smartThreshold={smartThreshold}
            />

            <AnalyticsPanel
                history={history}
                threshold={hardThreshold}
                aiAnalysis={aiAnalysis}
                incidentSummary={incidentSummary}
            />
        </div>
    );
}
