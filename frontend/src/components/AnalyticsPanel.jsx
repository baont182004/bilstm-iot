// src/components/AnalyticsPanel.jsx
import React, { useMemo } from "react";

export default function AnalyticsPanel({
    history,
    threshold,
    aiAnalysis,
    smartThreshold,
}) {
    const stats = useMemo(() => {
        if (!history || history.length === 0) return null;

        const values = history.map((d) => d.gas);
        const n = values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        const above = values.filter((v) => v > threshold).length;
        const abovePct = (above / n) * 100;

        return {
            n,
            min,
            max,
            mean,
            abovePct,
        };
    }, [history, threshold]);

    const ai = aiAnalysis?.ai;
    const probPercent =
        ai && typeof ai.prob_leak === "number"
            ? (ai.prob_leak * 100).toFixed(1)
            : null;

    return (
        <div
            style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                background: "#020617",
                border: "1px solid #1f2937",
                color: "#f9fafb",
            }}
        >
            <h2>Thống kê & phân tích AI</h2>

            {!stats ? (
                <div style={{ marginTop: 8 }}>Chưa có dữ liệu.</div>
            ) : (
                <>
                    <div
                        style={{
                            marginTop: 8,
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: 8,
                        }}
                    >
                        <StatBox label="Số mẫu" value={stats.n} />
                        <StatBox
                            label="Min"
                            value={stats.min.toFixed(1) + " ppm"}
                        />
                        <StatBox
                            label="Max"
                            value={stats.max.toFixed(1) + " ppm"}
                        />
                        <StatBox
                            label="Trung bình"
                            value={stats.mean.toFixed(1) + " ppm"}
                        />
                        <StatBox
                            label="% > ngưỡng Blynk"
                            value={stats.abovePct.toFixed(1) + " %"}
                        />
                        {smartThreshold && (
                            <StatBox
                                label="Ngưỡng AI gợi ý"
                                value={Math.round(smartThreshold) + " ppm"}
                            />
                        )}
                        {probPercent && (
                            <StatBox
                                label="P(rò rỉ | chuỗi mới nhất)"
                                value={probPercent + " %"}
                            />
                        )}
                    </div>

                    {ai && (
                        <div style={{ marginTop: 12, fontSize: 13 }}>
                            BiLSTM dự đoán chuỗi mới nhất là:{" "}
                            <b
                                style={{
                                    color:
                                        ai.label === 1
                                            ? "#ef4444"
                                            : "#22c55e",
                                }}
                            >
                                {ai.label === 1 ? "LEAK" : "NORMAL"}
                            </b>{" "}
                            (prob = {probPercent}%)
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function StatBox({ label, value }) {
    return (
        <div
            style={{
                padding: 8,
                borderRadius: 8,
                background: "#020617",
                border: "1px solid #1f2937",
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
            <div style={{ marginTop: 2, fontWeight: "600" }}>{value}</div>
        </div>
    );
}
