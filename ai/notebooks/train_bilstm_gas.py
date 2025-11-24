from pathlib import Path
import json

import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score
from sklearn.utils.class_weight import compute_class_weight

import tensorflow as tf
from tensorflow.keras import layers, models
import joblib

# ================== CẤU HÌNH ==================
SEQ_LEN = 30          # số bước thời gian mỗi window
TEST_SIZE = 0.2
VAL_SIZE = 0.2
RANDOM_STATE = 42
FEATURE_COLS = ["gas", "rawAdc"]
LABEL_COL = "label"

BASE_DIR = Path(__file__).resolve().parents[1]

DATA_PATH = BASE_DIR / "data" / "gas_readings_augmented.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)
MODEL_PATH = MODELS_DIR / "bilstm_gas_leak.h5"
SCALER_PATH = MODELS_DIR / "gas_feature_scaler.pkl"
THRESH_PATH = MODELS_DIR / "bilstm_thresholds.json"


# ================== HÀM TẠO WINDOW ==================
def create_windows_last_label(df, seq_len, feature_cols, label_col):
    """
    df: DataFrame đã sort theo timestamp.
    Trả về:
      X: shape (num_samples, seq_len, num_features)
      y: shape (num_samples,)

    Label = label tại bước cuối cùng trong window.
    """
    values = df[feature_cols].values
    labels = df[label_col].values

    X, y = [], []
    for i in range(len(df) - seq_len + 1):
        window = values[i: i + seq_len]
        window_label = labels[i + seq_len - 1]  # <-- quan trọng
        X.append(window)
        y.append(window_label)

    return np.array(X), np.array(y)


# ================== 1. ĐỌC DỮ LIỆU ==================
print(f"[INFO] Đọc dữ liệu từ {DATA_PATH}")
df_raw = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
df_raw = df_raw.sort_values("timestamp").reset_index(drop=True)

print(df_raw.head())
print("Các cột:", df_raw.columns.tolist())
print("Số dòng:", len(df_raw))
print("Tỉ lệ leak (row-level):", df_raw[LABEL_COL].mean())

# ================== 2. CHỌN CỘT CẦN THIẾT ==================
df = df_raw[["timestamp"] + FEATURE_COLS + [LABEL_COL, "scenario", "deviceId"]].copy()

# ================== 3. TẠO WINDOW (CHƯA SCALE) ==================
X_all, y_all = create_windows_last_label(df, SEQ_LEN, FEATURE_COLS, LABEL_COL)
print("[INFO] X_all shape:", X_all.shape)
print("[INFO] y_all shape:", y_all.shape, "tỉ lệ leak (window):", y_all.mean())

# ================== 4. CHIA TRAIN / VAL / TEST ==================
X_train, X_temp, y_train, y_temp = train_test_split(
    X_all, y_all, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y_all
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=VAL_SIZE, random_state=RANDOM_STATE, stratify=y_temp
)

print("Train:", X_train.shape, "Val:", X_val.shape, "Test:", X_test.shape)

# ================== 5. SCALE FEATURE TRÊN TẬP TRAIN ==================
num_features = X_all.shape[2]
scaler = StandardScaler()

X_train_flat = X_train.reshape(-1, num_features)
scaler.fit(X_train_flat)

def scale_windows(X):
    flat = X.reshape(-1, num_features)
    flat_scaled = scaler.transform(flat)
    return flat_scaled.reshape(-1, SEQ_LEN, num_features)

X_train = scale_windows(X_train)
X_val = scale_windows(X_val)
X_test = scale_windows(X_test)

print("[INFO] Đã scale feature với StandardScaler (fit trên train).")

# ================== 6. TÍNH CLASS WEIGHT ==================
classes = np.array([0, 1])
class_weights_arr = compute_class_weight(
    class_weight="balanced", classes=classes, y=y_train
)
class_weight = {int(c): float(w) for c, w in zip(classes, class_weights_arr)}
print("[INFO] class_weight:", class_weight)

# ================== 7. XÂY DỰNG MÔ HÌNH BiLSTM ==================
model = models.Sequential(
    [
        layers.Input(shape=(SEQ_LEN, num_features)),
        layers.Bidirectional(layers.LSTM(64, return_sequences=True)),
        layers.Dropout(0.3),
        layers.Bidirectional(layers.LSTM(32)),
        layers.Dense(32, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(1, activation="sigmoid"),
    ]
)

model.compile(
    loss="binary_crossentropy",
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    metrics=["accuracy"],
)

model.summary()

# ================== 8. TRAIN ==================
callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=8, restore_best_weights=True
    )
]

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=80,
    batch_size=64,
    callbacks=callbacks,
    class_weight=class_weight,
)

# ================== 9. TÌM NGƯỠNG XÁC SUẤT TỐI ƯU (TRÊN VAL) ==================
y_val_prob = model.predict(X_val).ravel()

best_thr = 0.5
best_f1 = -1.0

for thr in np.linspace(0.1, 0.9, 81):  # bước 0.01
    y_val_pred = (y_val_prob >= thr).astype(int)
    f1 = f1_score(y_val, y_val_pred)
    if f1 > best_f1:
        best_f1 = f1
        best_thr = float(thr)

print(f"[THRESH] Ngưỡng prob tối ưu trên VAL: {best_thr:.3f} (F1={best_f1:.4f})")

# ================== 10. ĐÁNH GIÁ TRÊN TEST ==================
y_test_prob = model.predict(X_test).ravel()
y_test_pred = (y_test_prob >= best_thr).astype(int)

print("\n[RESULT] Classification report (test):\n")
print(classification_report(y_test, y_test_pred, digits=4))

f1_test = f1_score(y_test, y_test_pred)
print("[RESULT] F1-score (test):", f1_test)

# ================== 11. TÍNH NGƯỠNG AN TOÀN CHO GAS (PPM) ==================
normal_gas = df_raw[df_raw[LABEL_COL] == 0]["gas"].values
safe_quantile = 0.95
safe_gas_threshold = float(np.quantile(normal_gas, safe_quantile))

print(
    f"[SAFE] Ngưỡng an toàn AI (gas) ~ percentile {int(safe_quantile*100)} "
    f"của dữ liệu bình thường: {safe_gas_threshold:.3f} ppm"
)

# ================== 12. LƯU MÔ HÌNH, SCALER & THRESHOLDS ==================
model.save(MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)

thresholds = {
    "decision_threshold": best_thr,
    "safe_gas_threshold_ppm": safe_gas_threshold,
    "safe_gas_quantile": safe_quantile,
}

with open(THRESH_PATH, "w", encoding="utf-8") as f:
    json.dump(thresholds, f, ensure_ascii=False, indent=2)

print(f"[SAVE] Đã lưu model vào: {MODEL_PATH}")
print(f"[SAVE] Đã lưu scaler vào: {SCALER_PATH}")
print(f"[SAVE] Đã lưu thresholds vào: {THRESH_PATH}")
