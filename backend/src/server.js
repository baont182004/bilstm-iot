import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();


const PORT = process.env.PORT;

try {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server đang chạy tại http://localhost:${PORT}`);
    });
} catch (err) {
    console.error("Lỗi kết nối DB hoặc khởi động server:", err);
    process.exit(1);
}