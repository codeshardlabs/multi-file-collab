import mongoose from "mongoose";
import { logger } from "./services/logger/logger";


export async function connectToDB() {
    mongoose.connect(process.env.MONGODB_URL!);
    const db = mongoose.connection;
    db.on('error', (err) => logger.error("database err: ", {
            message: err.message
    }));
    db.once("open", () => logger.info("Database connected successfully"));
}