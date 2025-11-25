// frontend/src/components/CurrentGasCard.jsx
import React from "react";

function getStatusByThreshold(gas, threshold = 300) {
    if (gas == null) return { text: "Đang nhận dữ liệu...", color: "#9ca3af" };
    if (gas < threshold * 0.7) return { text: "An toàn", color: "#22c55e" };
    if (gas < threshold) return { text: "Cần để ý thêm", color: "#eab308" };
    return { text: "Nguy hiểm!", color: "#ef4444" };
}

function formatTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleTimeString("vi-VN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function prettySystemMode(mode) {
    switch (mode) {
        case "NORMAL":
            return "Bình thường";
        case "EARLY_WARNING":
            return "Cảnh báo sớm";
        case "HIGH_GAS":
            return "Nồng độ cao";
        case "LEAK_CONFIRMED":
            return "Rò rỉ mạnh";
        case "NO_DATA":
            return "Chưa đủ dữ liệu";
        case "NO_AI":
            return "AI đang tạm tắt";
        default:
            return mode || "—";
    }
}

export default function CurrentGasCard({
    gas,
    timestamp,
    hardThreshold,
    smartThreshold,
    ai,
    system,
}) {
    const status = getStatusByThreshold(gas, hardThreshold);
    const probLeak = ai?.prob_leak ?? null;
    const probPercent =
        typeof probLeak === "number" ? (probLeak * 100).toFixed(1) + " %" : "—";

    let probColor = "#22c55e";
    if (probLeak != null && probLeak >= 0.7) probColor = "#ef4444";
    else if (probLeak != null && probLeak >= 0.4) probColor = "#eab308";

    let systemColor = "#22c55e";
    if (system?.severity === "WARNING") systemColor = "#eab308";
    if (system?.severity === "DANGER") systemColor = "#ef4444";

    return (
        <div
            style={{
                padding: 16,
                borderRadius: 12,
                background: "#020617",
                border: "1px solid #1f2937",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                height: "100%",
            }}
        >
            <div style={{ fontSize: 18, fontWeight: 600 }}>
                Nồng độ khí gas hiện tại
            </div>

            <div style={{ fontSize: 36, fontWeight: 700 }}>
                {gas != null ? gas.toFixed(1) : "--"}{" "}
                <span style={{ fontSize: 16, opacity: 0.7 }}>ppm</span>
            </div>

            <div style={{ fontSize: 13, opacity: 0.8 }}>
                Cập nhật lúc: {formatTime(timestamp)}
            </div>

            <div
                style={{
                    marginTop: 4,
                    padding: 8,
                    borderRadius: 8,
                    background: "#020617",
                    border: "1px solid #1f2937",
                    fontSize: 13,
                }}
            >
                <div style={{ marginBottom: 4 }}>
                    Trạng thái theo ngưỡng Blynk:{" "}
                    <span style={{ fontWeight: 600, color: status.color }}>
                        {status.text}
                    </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                    Ngưỡng cảnh báo Blynk:{" "}
                    <strong>{hardThreshold ?? 300} ppm</strong>
                    <br />
                    Ngưỡng cảnh báo do AI đề xuất:{" "}
                    <strong>
                        {smartThreshold != null
                            ? `${smartThreshold.toFixed(0)} ppm`
                            : "—"}
                    </strong>
                </div>
            </div>

            <div
                style={{
                    marginTop: 4,
                    padding: 8,
                    borderRadius: 8,
                    background: "#020617",
                    border: "1px solid #1f2937",
                    fontSize: 13,
                }}
            >
                <div>
                    Đánh giá rò rỉ từ AI:{" "}
                    <span style={{ fontWeight: 600, color: probColor }}>
                        {probPercent}
                    </span>
                </div>

                {system && (
                    <div style={{ marginTop: 4 }}>
                        Trạng thái chung của hệ thống:{" "}
                        <span
                            style={{
                                fontWeight: 700,
                                color: systemColor,
                            }}
                        >
                            {prettySystemMode(system.mode)}
                        </span>
                        <div
                            style={{
                                marginTop: 2,
                                fontSize: 12,
                                opacity: 0.9,
                            }}
                        >
                            {system.message}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
