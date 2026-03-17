import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log("Register request received", req.body);

  const hash = await bcrypt.hash(password, 10);

  try {
    await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hash,
    ]);

    res.json({ message: "User created" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.log("Username already exists:", username);
      return res.status(400).json({ message: "Username exists" });
    }

    console.error("Error during registration:", err);
    res.status(500).json();
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const [rows] = await db.execute("SELECT * FROM users WHERE username=?", [
    username,
  ]);

  const user = rows[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({
    message: "Login success",
  });
});

router.get("/profile", auth, async (req, res) => {
  const [rows] = await db.execute(
    "SELECT id, username, created_at FROM users WHERE id=?",
    [req.user.id],
  );

  res.json({
    user: rows[0],
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");

  res.json({
    message: "Logged out",
  });
});

export default router;
