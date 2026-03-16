import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";

const app = express();

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = "secret123";

app.post("/login", async (req, res) => {
  console.log("Login request received", req.body);
  const { username, password } = req.body;

  // ví dụ user fake
  if (username !== "admin" || password !== "123456") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1d" });

  res.cookie("token", token, {
    httpOnly: true,
  });

  res.json({ message: "Login success" });
});

function auth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

app.get("/profile", auth, (req, res) => {
  res.json({
    user: req.user,
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.listen(3300, () => {
  console.log("Server running on port 3300");
});
