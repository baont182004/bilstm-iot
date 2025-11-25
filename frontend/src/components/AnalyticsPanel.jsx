// frontend/src/components/AnalyticsPanel.jsx
import React, { useMemo } from "react";

function StatCard({ label, value, highlight }) {
    return (
        <div
            style={{
                padding: 10,
                borderRadius: 8,
                background: "#020617",
                border: "1px solid #1f2937",
                minWidth: 0,
            }}
        >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
            <div
                style={{
                    marginTop: 2,
                    fontWeight: 600,
                    fontSize: 14,
                    color: highlight || "#e5e7eb",
                    wordBreak: "break-word",
                }}
            >
                {value}
            </div>
        </div>
    );
}

function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString("vi-VN", {
        hour12: false,
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export default function AnalyticsPanel({
    history,
    threshold,
    aiAnalysis,
    incidentSummary,
}) {
    const historyStats = useMemo(() => {
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
            above,
            abovePct,
        };
    }, [history, threshold]);

    const incidentStats = useMemo(() => {
        if (!incidentSummary) return null;

        const incidents = incidentSummary.incidents || [];
        const top = incidents.slice(0, 5).map((i) => {
            const start = i.startTime ? new Date(i.startTime) : null;
            const end = i.endTime ? new Date(i.endTime) : null;
            const durationMs =
                start && end ? Math.max(0, end.getTime() - start.getTime()) : 0;
            const durationMin =
                durationMs > 0 ? (durationMs / 60000).toFixed(1) : "—";

            return {
                id: i._id || i.id,
                severity: i.severity,
                mode: i.mode,
                start: formatDateTime(i.startTime),
                end: i.endTime ? formatDateTime(i.endTime) : "Đang diễn ra",
                durationMin,
                maxGas:
                    typeof i.maxGas === "number"
                        ? i.maxGas.toFixed(1)
                        : "—",
                maxProb:
                    typeof i.maxProbLeak === "number"
                        ? (i.maxProbLeak * 100).toFixed(1) + " %"
                        : "—",
            };
        });

        return {
            total: incidentSummary.totalIncidents ?? incidents.length,
            danger: incidentSummary.dangerIncidents ?? 0,
            maxGasPeak:
                typeof incidentSummary.maxGasPeak === "number"
                    ? incidentSummary.maxGasPeak.toFixed(1)
                    : "—",
            from: incidentSummary.from,
            to: incidentSummary.to,
            list: top,
        };
    }, [incidentSummary]);

    const baseline = aiAnalysis?.baseline;
    const smartT = aiAnalysis?.dynamicThreshold;

    return (
        <div
            style={{
                marginTop: 16,
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: 16,
            }}
        >
            {/* Bên trái: tóm tắt trong khung thời gian đang xem */}
            <div
                style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#020617",
                    border: "1px solid #1f2937",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                }}
            >
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                    }}
                >
                    Tóm tắt dữ liệu đang hiển thị
                </div>

                {historyStats ? (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: 8,
                        }}
                    >
                        <StatCard
                            label="Số lần đo"
                            value={historyStats.n}
                        />
                        <StatCard
                            label="Nhỏ nhất / lớn nhất"
                            value={`${historyStats.min.toFixed(
                                1
                            )} – ${historyStats.max.toFixed(1)} ppm`}
                        />
                        <StatCard
                            label="Giá trị trung bình"
                            value={`${historyStats.mean.toFixed(1)} ppm`}
                        />
                        <StatCard
                            label={`Tỷ lệ thời điểm vượt ngưỡng Blynk (${threshold} ppm)`}
                            value={`${historyStats.above} lần (${historyStats.abovePct.toFixed(
                                1
                            )}%)`}
                        />
                    </div>
                ) : (
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                        Chưa có dữ liệu đủ để thống kê.
                    </div>
                )}

                <div
                    style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid #1f2937",
                        fontSize: 13,
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 8,
                    }}
                >
                    <StatCard
                        label="Ngưỡng cảnh báo do AI đề xuất"
                        value={
                            smartT != null
                                ? `${smartT.toFixed(1)} ppm`
                                : "—"
                        }
                    />
                    <StatCard
                        label="Mức gas bình thường trung bình"
                        value={
                            baseline?.mean != null
                                ? `${baseline.mean.toFixed(1)} ppm`
                                : "—"
                        }
                    />
                    <StatCard
                        label="Độ dao động khí gas"
                        value={
                            baseline?.std != null
                                ? `${baseline.std.toFixed(2)}`
                                : "—"
                        }
                    />
                    <StatCard
                        label="Số điểm AI dùng để phân tích chuỗi"
                        value={
                            aiAnalysis?.seqLen
                                ? `${aiAnalysis.seqLen} lần đo`
                                : "—"
                        }
                    />
                </div>
            </div>

            {/* Bên phải: nhật ký rò rỉ trong 24 giờ qua */}
            <div
                style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#020617",
                    border: "1px solid #1f2937",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 600,
                    }}
                >
                    Nhật ký rò rỉ (24 giờ gần nhất)
                </div>

                {incidentStats ? (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: 8,
                            }}
                        >
                            <StatCard
                                label="Tổng số lần bất thường"
                                value={incidentStats.total}
                                highlight="#eab308"
                            />
                            <StatCard
                                label="Số lần ở mức nguy hiểm"
                                value={incidentStats.danger}
                                highlight="#ef4444"
                            />
                            <StatCard
                                label="Đỉnh gas cao nhất"
                                value={`${incidentStats.maxGasPeak} ppm`}
                                highlight="#38bdf8"
                            />
                            <StatCard
                                label="Khoảng thời gian hiển thị"
                                value={`${formatDateTime(
                                    incidentStats.from
                                )} → ${formatDateTime(incidentStats.to)}`}
                            />
                        </div>

                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 13,
                                opacity: 0.8,
                            }}
                        >
                            5 lần bất thường gần nhất:
                        </div>

                        <div
                            style={{
                                marginTop: 4,
                                borderRadius: 8,
                                border: "1px solid #1f2937",
                                overflow: "hidden",
                                fontSize: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "1.5fr 1.5fr 0.8fr 0.8fr 0.8fr 0.7fr",
                                    background: "#020617",
                                    borderBottom: "1px solid #1f2937",
                                    padding: "6px 8px",
                                    fontWeight: 600,
                                }}
                            >
                                <div>Bắt đầu</div>
                                <div>Kết thúc</div>
                                <div>Thời lượng (phút)</div>
                                <div>Gas cao nhất</div>
                                <div>AI đánh giá cao nhất</div>
                                <div>Mức</div>
                            </div>

                            {incidentStats.list.length === 0 ? (
                                <div
                                    style={{
                                        padding: 8,
                                        opacity: 0.7,
                                    }}
                                >
                                    Không có lần bất thường nào trong 24 giờ
                                    gần nhất.
                                </div>
                            ) : (
                                incidentStats.list.map((i) => (
                                    <div
                                        key={i.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "1.5fr 1.5fr 0.8fr 0.8fr 0.8fr 0.7fr",
                                            padding: "6px 8px",
                                            borderBottom:
                                                "1px solid #111827",
                                        }}
                                    >
                                        <div>{i.start}</div>
                                        <div>{i.end}</div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                            }}
                                        >
                                            {i.durationMin}
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                            }}
                                        >
                                            {i.maxGas}
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                            }}
                                        >
                                            {i.maxProb}
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color:
                                                    i.severity === "DANGER"
                                                        ? "#ef4444"
                                                        : i.severity ===
                                                            "WARNING"
                                                            ? "#eab308"
                                                            : "#22c55e",
                                            }}
                                        >
                                            {i.severity}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ fontSize: 13, opacity: 0.7 }}>
                        Đang tải dữ liệu nhật ký rò rỉ...
                    </div>
                )}
            </div>
        </div>
    );
}
