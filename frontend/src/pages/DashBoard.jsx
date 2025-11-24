import React, { useEffect, useState } from "react";

import { fetchGasData } from "../api/gasApi";

import CurrentGasCard from "../components/CurrentGasCard";
import GasChart from "../components/GasChart";
import AnalyticsPanel from "../components/AnalyticsPanel";

const POLL_MS = 2000;
const THRESHOLD_DEFAULT = 300;

export default function Dashboard() {
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [threshold] = useState(THRESHOLD_DEFAULT);

    const loadDataOnce = async () => {
        try {
            const { latest, history } = await fetchGasData(500);
            setLatest(latest);
            setHistory(history);
        } catch (err) {
            console.error("Lỗi tải dữ liệu gas:", err);
        }
    };

    useEffect(() => {
        loadDataOnce();
        const id = setInterval(loadDataOnce, POLL_MS);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#020617",
                color: "#f9fafb",
                padding: 24,
            }}
        >
            <h1 style={{ marginBottom: 16 }}>Gas Detector Analytics</h1>

            <div
                style={{
                    display: "grid",
                    gap: 16,
                    gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)",
                }}
            >
                <CurrentGasCard
                    gas={latest?.gas}
                    timestamp={latest?.timestamp}
                    threshold={threshold}
                />

                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "#111827",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    }}
                >
                    <h2>Trạng thái hệ thống</h2>
                    <p style={{ marginTop: 8, fontSize: 14 }}>
                        • Backend đang trả list từ <code>/api/gas/latest</code> (limit mặc định).<br />
                        • Dashboard chuẩn hoá lại thành <b>latest + history</b> để hiển thị và chuẩn bị cho BiLSTM.
                    </p>
                </div>
            </div>

            <GasChart data={history} threshold={threshold} />
            <AnalyticsPanel history={history} threshold={threshold} />
        </div>
    );
}
