// src/components/AnalyticsPanel.jsx
import React, { useMemo } from "react";

export default function AnalyticsPanel({ history, threshold }) {
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

        const firstTs = new Date(history[0].timestamp).getTime();
        const lastTs = new Date(history[history.length - 1].timestamp).getTime();
        const durationSec = (lastTs - firstTs) / 1000;

        // Ước lượng chu kỳ lấy mẫu theo ms
        let sampleMs = null;
        if (history.length >= 2) {
            let diffs = [];
            for (let i = 1; i < history.length; i++) {
                diffs.push(
                    new Date(history[i].timestamp).getTime() -
                    new Date(history[i - 1].timestamp).getTime()
                );
            }
            const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            sampleMs = diffMean;
        }

        return {
            n,
            min,
            max,
            mean,
            above,
            abovePct,
            durationSec,
            sampleMs,
        };
    }, [history, threshold]);

    // Chuẩn bị window cuối cho BiLSTM (ví dụ ~30s)
    const bilstmWindow = useMemo(() => {
        if (!history || history.length === 0) return null;
        const WINDOW_SEC = 30; // sau này có thể cho user chọn

        // nếu chưa ước lượng được sampleMs thì lấy 30 mẫu
        let steps = 30;
        if (history.length > 5) {
            let diffs = [];
            for (let i = 1; i < history.length; i++) {
                diffs.push(
                    new Date(history[i].timestamp).getTime() -
                    new Date(history[i - 1].timestamp).getTime()
                );
            }
            const diffMean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
            if (diffMean > 0) {
                steps = Math.round((WINDOW_SEC * 1000) / diffMean);
            }
        }

        if (steps > history.length) steps = history.length;

        const windowData = history.slice(history.length - steps);

        return {
            steps,
            windowSec: WINDOW_SEC,
            data: windowData,
        };
    }, [history]);

    return (
        <div
            style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                background: "#111827",
                color: "#f9fafb",
            }}
        >
            <h2>Thống kê & Chuẩn bị cho BiLSTM</h2>

            {!stats ? (
                <p>Chưa đủ dữ liệu để thống kê.</p>
            ) : (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                            gap: 12,
                            marginTop: 12,
                        }}
                    >
                        <StatBox label="Số mẫu" value={stats.n} />
                        <StatBox
                            label="Thời gian quan sát"
                            value={
                                stats.durationSec > 0
                                    ? stats.durationSec.toFixed(1) + " s"
                                    : "—"
                            }
                        />
                        <StatBox
                            label="Chu kỳ mẫu (xấp xỉ)"
                            value={
                                stats.sampleMs
                                    ? stats.sampleMs.toFixed(0) + " ms"
                                    : "không rõ"
                            }
                        />
                        <StatBox label="Min gas" value={stats.min.toFixed(1) + " ppm"} />
                        <StatBox label="Avg gas" value={stats.mean.toFixed(1) + " ppm"} />
                        <StatBox label="Max gas" value={stats.max.toFixed(1) + " ppm"} />
                        <StatBox
                            label="Số mẫu vượt ngưỡng"
                            value={`${stats.above} (${stats.abovePct.toFixed(1)}%)`}
                        />
                    </div>

                    {bilstmWindow && (
                        <div style={{ marginTop: 16 }}>
                            <h3>Window cuối cho BiLSTM (preview)</h3>
                            <p style={{ fontSize: 13, opacity: 0.8 }}>
                                Window ~{bilstmWindow.windowSec}s, gồm{" "}
                                <b>{bilstmWindow.steps}</b> bước thời gian. Đây chính là chuỗi
                                mà sau này sẽ đưa vào BiLSTM để dự đoán bình thường / rò rỉ.
                            </p>
                            <div
                                style={{
                                    maxHeight: 200,
                                    overflowY: "auto",
                                    borderRadius: 8,
                                    border: "1px solid #374151",
                                    fontSize: 12,
                                    marginTop: 8,
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        minWidth: 300,
                                    }}
                                >
                                    <thead>
                                        <tr style={{ background: "#020617" }}>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "4px 8px",
                                                    borderBottom: "1px solid #374151",
                                                }}
                                            >
                                                #
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "left",
                                                    padding: "4px 8px",
                                                    borderBottom: "1px solid #374151",
                                                }}
                                            >
                                                Thời gian
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: "right",
                                                    padding: "4px 8px",
                                                    borderBottom: "1px solid #374151",
                                                }}
                                            >
                                                Gas (ppm)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bilstmWindow.data.map((d, idx) => (
                                            <tr key={d.id || idx}>
                                                <td
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderBottom: "1px solid #111827",
                                                    }}
                                                >
                                                    {idx + 1}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderBottom: "1px solid #111827",
                                                    }}
                                                >
                                                    {new Date(d.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "3px 8px",
                                                        textAlign: "right",
                                                        borderBottom: "1px solid #111827",
                                                    }}
                                                >
                                                    {d.gas.toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
