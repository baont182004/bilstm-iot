// backend/src/models/GasIncident.js
import mongoose from "mongoose";

const gasIncidentSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
        },

        mode: {
            type: String,
            required: true,
        },

        severity: {
            type: String,
            required: true,
        },

        startTime: {
            type: Date,
            required: true,
        },

        // thời điểm kết thúc (có thể null nếu đang diễn ra)
        endTime: {
            type: Date,
        },

        // giá trị gas lớn nhất trong chuỗi
        maxGas: {
            type: Number,
            required: true,
        },

        // xác suất rò rỉ lớn nhất (nếu có AI)
        maxProbLeak: {
            type: Number,
        },

        // chuỗi đang mở (chưa kết thúc)
        isOpen: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

gasIncidentSchema.index({ deviceId: 1, startTime: -1 });

const GasIncident = mongoose.model("GasIncident", gasIncidentSchema);

export default GasIncident;
