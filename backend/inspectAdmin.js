// backend/inspectAdmin.js (run with: node --experimental-modules inspectAdmin.js OR use your project ESM runner)
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/internconnect");

const admin = await mongoose.connection.db.collection("admin").findOne({});
console.log(admin);
process.exit(0);
