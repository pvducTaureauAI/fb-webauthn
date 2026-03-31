import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";

console.log("ENV CHECK:", {
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
});

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(express.static("dist"));

app.use("/auth", authRoutes);

app.listen(3300, () => {
  console.log("Server running");
});

global.challengeStore = new Map();
