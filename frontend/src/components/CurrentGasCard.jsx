// src/components/CurrentGasCard.jsx
import React from "react";

function getStatus(gas, threshold = 300) {
    if (gas == null) return { text: "Đang tải...", color: "#9ca3af" };
    if (gas < threshold * 0.7) return { text: "An toàn", color: "#22c55e" };
    if (gas < threshold) return { text: "Cảnh giác", color: "#eab308" };
    return { text: "Nguy hiểm!", color: "#ef4444" };
}

export default function CurrentGasCard({ gas, threshold, timestamp }) {
    const { text, color } = getStatus(gas, threshold);

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
                Trạng thái:{" "}
                <span style={{ fontWeight: "bold", color: color }}>{text}</span>
            </div>
            {timestamp && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Cập nhật: {new Date(timestamp).toLocaleTimeString()}
                </div>
            )}
            {threshold && (
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                    Ngưỡng cảnh báo đang dùng: {threshold} ppm
                </div>
            )}
        </div>
    );
}
