// frontend/src/components/CurrentGasCard.jsx
import React from "react";

function getStatusByThreshold(gas, threshold = 300) {
    if (gas == null) return { text: "Đang tải...", color: "#9ca3af" };
    if (gas < threshold * 0.7) return { text: "An toàn", color: "#22c55e" };
    if (gas < threshold) return { text: "Cảnh giác", color: "#eab308" };
    return { text: "Nguy hiểm!", color: "#ef4444" };
}

export default function CurrentGasCard({
    gas,
    timestamp,
    hardThreshold,
    smartThreshold,
    ai,
    system,
}) {
    const byHard = getStatusByThreshold(gas, hardThreshold);

    const aiProb =
        ai && typeof ai.prob_leak === "number"
            ? (ai.prob_leak * 100).toFixed(1)
            : null;

    let systemColor = "#9ca3af";
    if (system?.severity === "DANGER") systemColor = "#ef4444";
    else if (system?.severity === "WARNING") systemColor = "#eab308";
    else if (system?.severity === "OK") systemColor = "#22c55e";

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
                <span style={{ fontWeight: "bold", color: byHard.color }}>
                    {byHard.text}
                </span>
            </div>

            {timestamp && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Cập nhật: {new Date(timestamp).toLocaleTimeString()}
                </div>
            )}

            {hardThreshold && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Ngưỡng cảnh báo đang dùng (Blynk): {hardThreshold} ppm
                </div>
            )}

            {smartThreshold && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Ngưỡng AI gợi ý (mean + 3σ): {Math.round(smartThreshold)} ppm
                </div>
            )}

            {aiProb && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                    Xác suất rò rỉ (BiLSTM): <b>{aiProb}%</b>
                </div>
            )}

            {system && (
                <div style={{ marginTop: 4, fontSize: 13 }}>
                    Trạng thái hệ thống (tổng hợp):{" "}
                    <span style={{ fontWeight: "bold", color: systemColor }}>
                        {system.mode}
                    </span>
                    <div style={{ marginTop: 2, fontSize: 12, opacity: 0.9 }}>
                        {system.message}
                    </div>
                </div>
            )}
        </div>
    );
}
