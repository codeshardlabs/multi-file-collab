import mongoose from "mongoose";

export async function connectToDB() {
    mongoose.connect(process.env.MONGODB_URL!);
    const db = mongoose.connection;
    db.on('error', (err) => console.log("database err: ", err));
    db.once("open", () => console.log("Database connected successfully"));
}