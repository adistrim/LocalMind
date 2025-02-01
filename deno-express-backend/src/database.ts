import mongoose from "npm:mongoose";
import { DATABASE_URL } from "./config.ts";

let dbConnection: mongoose.Connection | null = null;

export function getDBConnection(): mongoose.Connection | null {
    return dbConnection;
}

export async function connectDB(): Promise<mongoose.Connection> {
    if (!DATABASE_URL || DATABASE_URL.trim() === "") {
        throw new Error("Please define the DATABASE_URL environment variable inside .env");
    }

    if (dbConnection && dbConnection.readyState === 1) {
        return dbConnection;
    }

    try {
        const mongooseInstance = await mongoose.connect(DATABASE_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        dbConnection = mongooseInstance.connection;

        dbConnection.on("connected", () => {
            console.log(`✅ MongoDB connected: ${dbConnection?.name}`);
        });

        dbConnection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        dbConnection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected");
            dbConnection = null;
        });

        console.log(`✅ MongoDB initial connection established: ${dbConnection.name}`);
        return dbConnection;
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        throw error;
    }
}
