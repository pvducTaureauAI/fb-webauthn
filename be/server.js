import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import cors from "cors";

const corsOptions = {
  origin: process.env.EXPECTED_ORIGIN,
  credentials: true,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(express.static("dist"));

app.use("/auth", authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

global.challengeStore = new Map();
