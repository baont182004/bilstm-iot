// src/components/GasChart.jsx
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
        time: d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : "",
    }));

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
            <h2 style={{ marginBottom: 8 }}>Biểu đồ nồng độ khí gas</h2>
            <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={formatted}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="gas"
                            stroke="#3b82f6"
                            dot={false}
                            strokeWidth={2}
                        />
                        {threshold && (
                            <ReferenceLine
                                y={threshold}
                                stroke="#ef4444"
                                strokeDasharray="4 4"
                                label="Ngưỡng Blynk"
                            />
                        )}
                        {smartThreshold && (
                            <ReferenceLine
                                y={smartThreshold}
                                stroke="#22c55e"
                                strokeDasharray="3 3"
                                label="Ngưỡng AI"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
