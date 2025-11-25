// frontend/src/components/GasChart.jsx
import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

export default function GasChart({ data, threshold, smartThreshold }) {
    const formatted = (data || []).map((d) => ({
        gas: d.gas,
        time: new Date(d.timestamp).toLocaleTimeString("vi-VN", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }),
    }));

    return (
        <div
            style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 12,
                background: "#020617",
                border: "1px solid #1f2937",
            }}
        >
            <div
                style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 8,
                }}
            >
                Biểu đồ nồng độ khí gas
            </div>
            <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                    <LineChart data={formatted}>
                        <CartesianGrid
                            stroke="#1f2937"
                            strokeDasharray="3 3"
                        />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            domain={["auto", "auto"]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#020617",
                                border: "1px solid #1f2937",
                                fontSize: 12,
                            }}
                        />

                        {typeof threshold === "number" && (
                            <ReferenceLine
                                y={threshold}
                                stroke="#ef4444"
                                strokeDasharray="4 4"
                                label={{
                                    value: "Ngưỡng Blynk",
                                    position: "insideTopRight",
                                    fill: "#ef4444",
                                    fontSize: 11,
                                }}
                            />
                        )}

                        {typeof smartThreshold === "number" && (
                            <ReferenceLine
                                y={smartThreshold}
                                stroke="#22c55e"
                                strokeDasharray="3 3"
                                label={{
                                    value: "Ngưỡng AI",
                                    position: "insideTopRight",
                                    fill: "#22c55e",
                                    fontSize: 11,
                                }}
                            />
                        )}

                        <Line
                            type="monotone"
                            dataKey="gas"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
