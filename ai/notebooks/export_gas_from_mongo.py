from pymongo import MongoClient
import pandas as pd

# 1. KẾT NỐI MONGODB ATLAS
MONGODB_URI = "mongodb+srv://baontb22at032_db_user:bDdGjFKDWN2SQJmH@gas-data.qxakogc.mongodb.net/?appName=gas-data"
DB_NAME = "test"
COLLECTION = "gasreadings"
DEVICE_ID = "esp8266-gas-01"

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
col = db[COLLECTION]

query = {"deviceId": DEVICE_ID}
cursor = col.find(query).sort("createdAt", 1)

docs = list(cursor)
df = pd.DataFrame(docs)

# 2. CHỈ GIỮ CÁC CỘT CẦN THIẾT

print("Columns từ Mongo:", df.columns)  

df = df[["createdAt", "gasValue", "rawAdc", "deviceId"]]

# 3. CHUẨN HOÁ KIỂU THỜI GIAN
df["createdAt"] = pd.to_datetime(df["createdAt"])

print(df.head())
print("Số dòng:", len(df))

df.to_csv("gas_readings_raw.csv", index=False)
print("Đã lưu ra gas_readings_raw.csv")
