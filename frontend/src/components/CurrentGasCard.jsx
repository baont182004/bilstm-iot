// src/components/CurrentGasCard.jsx
import React from "react";

function getStatus(gas, threshold = 300) {
    if (gas == null) return { text: "Đang tải...", color: "#9ca3af" };
    if (gas < threshold * 0.7) return { text: "An toàn", color: "#22c55e" };
    if (gas < threshold) return { text: "Cảnh giác", color: "#eab308" };
    return { text: "Nguy hiểm!", color: "#ef4444" };
}

export default function CurrentGasCard({
    gas,
    threshold,
    timestamp,
    smartThreshold,
    ai,
}) {
    const { text, color } = getStatus(gas, threshold);

    const aiProb = ai ? (ai.prob_leak * 100).toFixed(1) : null;
    const aiLabel =
        ai && ai.label === 1 ? "BiLSTM: NGUY CƠ RÒ RỈ" : "BiLSTM: An toàn";

    return (
        <div
            style={{
                padding: 16,
                borderRadius: 12,
                background: "#1f2933",
                color: "#f9fafb",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
        >
            <h2 style={{ marginBottom: 8 }}>Nồng độ khí gas hiện tại</h2>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>
                {gas != null ? gas.toFixed(1) : "..."}{" "}
                <span style={{ fontSize: 18 }}>ppm</span>
            </div>

            <div style={{ marginTop: 8 }}>
                Trạng thái (ngưỡng Blynk):{" "}
                <span style={{ fontWeight: "bold", color: color }}>{text}</span>
            </div>

            {timestamp && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Cập nhật: {new Date(timestamp).toLocaleTimeString()}
                </div>
            )}

            {threshold && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Ngưỡng cảnh báo (Blynk): {threshold} ppm
                </div>
            )}

            {smartThreshold && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Ngưỡng thông minh gợi ý:{" "}
                    {Math.round(smartThreshold)} ppm
                </div>
            )}

            {ai && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                    <div>
                        Xác suất rò rỉ (BiLSTM):{" "}
                        <b>{aiProb != null ? `${aiProb}%` : "—"}</b>
                    </div>
                    <div
                        style={{
                            marginTop: 2,
                            fontWeight: "bold",
                            color: ai.label === 1 ? "#ef4444" : "#22c55e",
                        }}
                    >
                        {aiLabel}
                    </div>
                </div>
            )}
        </div>
    );
}
