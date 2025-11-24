from pathlib import Path
from typing import List
import json

import numpy as np
import joblib
from fastapi import FastAPI
from pydantic import BaseModel
import tensorflow as tf
import uvicorn

BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "bilstm_gas_leak.h5"
SCALER_PATH = MODELS_DIR / "gas_feature_scaler.pkl"
THRESH_PATH = MODELS_DIR / "bilstm_thresholds.json"

print(f"[LOAD] Model từ {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)

print(f"[LOAD] Scaler từ {SCALER_PATH}")
scaler = joblib.load(SCALER_PATH)

# tải thresholds (nếu có)
try:
    with open(THRESH_PATH, "r", encoding="utf-8") as f:
        thresholds = json.load(f)
    DECISION_THRESHOLD = float(thresholds.get("decision_threshold", 0.5))
    SAFE_GAS_THRESHOLD = thresholds.get("safe_gas_threshold_ppm", None)
    if SAFE_GAS_THRESHOLD is not None:
        SAFE_GAS_THRESHOLD = float(SAFE_GAS_THRESHOLD)
    print(f"[LOAD] Thresholds từ {THRESH_PATH}: {thresholds}")
except FileNotFoundError:
    DECISION_THRESHOLD = 0.5
    SAFE_GAS_THRESHOLD = None
    print(f"[WARN] Không tìm thấy {THRESH_PATH}, dùng mặc định decision_threshold=0.5")

SEQ_LEN = model.input_shape[1]
NUM_FEATURES = model.input_shape[2]


class WindowRequest(BaseModel):
    # mỗi phần tử là [gas, rawAdc] (giống FEATURE_COLS)
    window: List[List[float]]


app = FastAPI(title="BiLSTM Gas Leak API")


@app.post("/predict-window")
def predict_window(req: WindowRequest):
    seq = np.array(req.window, dtype=float)

    if seq.shape != (SEQ_LEN, NUM_FEATURES):
        return {
            "error": f"window shape phải là ({SEQ_LEN}, {NUM_FEATURES}), hiện tại: {tuple(seq.shape)}"
        }

    # giữ bản gốc để tính ngưỡng an toàn theo ppm
    gas_values = seq[:, 0]  # giả định FEATURE_COLS = ["gas", "rawAdc"]
    gas_mean = float(gas_values.mean())
    gas_max = float(gas_values.max())

    # scale theo scaler đã học
    seq_scaled = scaler.transform(seq)
    seq_scaled = np.expand_dims(seq_scaled, axis=0)  # (1, SEQ_LEN, NUM_FEATURES)

    prob = float(model.predict(seq_scaled)[0][0])
    label = int(prob >= DECISION_THRESHOLD)

    above_safe = None
    if SAFE_GAS_THRESHOLD is not None:
        above_safe = bool(gas_mean >= SAFE_GAS_THRESHOLD)

    return {
        "prob_leak": prob,
        "decision_threshold": DECISION_THRESHOLD,
        "label": label,  # 1 = leak, 0 = normal
        "gas_mean": gas_mean,
        "gas_max": gas_max,
        "safe_gas_threshold_ppm": SAFE_GAS_THRESHOLD,
        "above_safe_threshold": above_safe,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
