from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, f1_score

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

# ================== HÀM TẠO WINDOW ==================


def create_windows(df, seq_len, feature_cols, label_col):
    """
    df: DataFrame đã sort theo timestamp.
    Trả về:
      X: shape (num_samples, seq_len, num_features)
      y: shape (num_samples,)
    Window label = 1 nếu trong window có ít nhất 1 điểm rò rỉ.
    """
    values = df[feature_cols].values
    labels = df[label_col].values

    X, y = [], []
    for i in range(len(df) - seq_len + 1):
        window = values[i : i + seq_len]
        window_label = 1 if labels[i : i + seq_len].max() == 1 else 0
        X.append(window)
        y.append(window_label)

    return np.array(X), np.array(y)


# ================== 1. ĐỌC DỮ LIỆU ==================

print(f"[INFO] Đọc dữ liệu từ {DATA_PATH}")
df = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
df = df.sort_values("timestamp").reset_index(drop=True)

print(df.head())
print("Các cột:", df.columns.tolist())
print("Số dòng:", len(df))

# ================== 2. TIỀN XỬ LÝ ==================

# Giữ đúng các cột cần thiết
df = df[["timestamp"] + FEATURE_COLS + [LABEL_COL, "scenario", "deviceId"]]

# Scale gas, rawAdc
scaler = StandardScaler()
df[FEATURE_COLS] = scaler.fit_transform(df[FEATURE_COLS])

# ================== 3. TẠO WINDOW ==================

X, y = create_windows(df, SEQ_LEN, FEATURE_COLS, LABEL_COL)
print("[INFO] X shape:", X.shape)  # (num_samples, seq_len, num_features)
print("[INFO] y shape:", y.shape, "tỷ lệ leak:", y.mean())

# ================== 4. CHIA TRAIN / VAL / TEST ==================

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=VAL_SIZE, random_state=RANDOM_STATE, stratify=y_temp
)

print("Train:", X_train.shape, "Val:", X_val.shape, "Test:", X_test.shape)

# ================== 5. XÂY DỰNG MÔ HÌNH BiLSTM ==================

num_features = X.shape[2]

model = models.Sequential(
    [
        layers.Input(shape=(SEQ_LEN, num_features)),
        layers.Bidirectional(layers.LSTM(64, return_sequences=True)),
        layers.Dropout(0.2),
        layers.Bidirectional(layers.LSTM(32)),
        layers.Dense(32, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(1, activation="sigmoid"),
    ]
)

model.compile(
    loss="binary_crossentropy",
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    metrics=["accuracy"],
)

model.summary()

# ================== 6. TRAIN ==================

callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True
    )
]

history = model.fit(
    X_train,
    y_train,
    validation_data=(X_val, y_val),
    epochs=50,
    batch_size=64,
    callbacks=callbacks,
)

# ================== 7. ĐÁNH GIÁ ==================

y_pred_prob = model.predict(X_test).ravel()
y_pred = (y_pred_prob >= 0.5).astype(int)

print("\n[RESULT] Classification report:\n")
print(classification_report(y_test, y_pred, digits=4))

f1 = f1_score(y_test, y_pred)
print("[RESULT] F1-score:", f1)

# ================== 8. LƯU MÔ HÌNH & SCALER ==================

model.save(MODEL_PATH)
joblib.dump(scaler, SCALER_PATH)

print(f"[SAVE] Đã lưu model vào: {MODEL_PATH}")
print(f"[SAVE] Đã lưu scaler vào: {SCALER_PATH}")
