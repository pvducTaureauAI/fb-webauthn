import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

app.listen(3300, () => {
  console.log("Server running");
});
