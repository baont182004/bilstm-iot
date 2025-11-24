from pathlib import Path
from typing import List

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

print(f"[LOAD] Model từ {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"[LOAD] Scaler từ {SCALER_PATH}")
scaler = joblib.load(SCALER_PATH)

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

    # scale theo scaler đã học
    seq_scaled = scaler.transform(seq)
    seq_scaled = np.expand_dims(seq_scaled, axis=0)  # (1, SEQ_LEN, NUM_FEATURES)

    prob = float(model.predict(seq_scaled)[0][0])
    label = int(prob >= 0.5)

    return {
        "prob_leak": prob,
        "label": label,  # 1 = leak, 0 = normal
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
