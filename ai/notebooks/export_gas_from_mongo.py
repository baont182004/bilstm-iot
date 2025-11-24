from pymongo import MongoClient
import pandas as pd

# 1. KẾT NỐI MONGODB ATLAS
MONGODB_URI = "mongodb+srv://<user>:<password>@<cluster>/<dbname>?retryWrites=true&w=majority"
DB_NAME = "<dbname>"          # ví dụ: "iot_gas"
COLLECTION = "<collection>"   # ví dụ: "gasreadings"

DEVICE_ID = "esp8266-gas-01"  # nếu chỉ train cho 1 thiết bị

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
col = db[COLLECTION]

query = {"deviceId": DEVICE_ID}
cursor = col.find(query).sort("createdAt", 1)

docs = list(cursor)
df = pd.DataFrame(docs)

# 2. CHỈ GIỮ CÁC CỘT CẦN THIẾT
df = df[["createdAt", "gasValue", "rawAdc", "deviceId"]]
df = df.rename(columns={"createdAt": "timestamp", "gasValue": "gas"})

# 3. CHUẨN HOÁ KIỂU THỜI GIAN
df["timestamp"] = pd.to_datetime(df["timestamp"])

print(df.head())
print("Số dòng:", len(df))

df.to_csv("gas_readings_raw.csv", index=False)
print("Đã lưu ra gas_readings_raw.csv")
