// backend/src/models/GasReading.js
import mongoose from "mongoose";

const gasReadingSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
    },
    gasValue: {
        type: Number,
        required: true,
    },
    rawAdc: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

gasReadingSchema.index({ createdAt: 1 });

const GasReading = mongoose.model("GasReading", gasReadingSchema);

export default GasReading;
