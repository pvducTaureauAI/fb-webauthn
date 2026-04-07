import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { auth } from "../middleware/auth.js";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const router = express.Router();

// const expectedOrigin = "https://nonrustic-jayse-uncomprehensively.ngrok-free.dev";
const expectedOrigin = process.env.EXPECTED_ORIGIN;

const getUserById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM users WHERE id=?", [id]);

  return rows[0];
};

const getUserPasskeys = async (userId) => {
  const [rows] = await db.execute(
    "SELECT * FROM webauthn_credentials WHERE user_id=?",
    [userId],
  );

  return rows.map((row) => ({
    credential_id: row.credential_id,
    public_key: row.public_key,
    counter: row.counter,
  }));
};

router.get("/webauthn/register/options", auth, async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const userPasskeys = await getUserPasskeys(user.id);

  const options = await generateRegistrationOptions({
    rpName: "Fishbird Demo",
    rpID: "localhost",
    userName: user.username,
    attestationType: "none",
    excludeCredentials: userPasskeys.map((pk) => ({
      id: pk.credential_id,
      type: "public-key",
    })),
    authenticatorSelection: {
      residentKey: "discouraged",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  global.challengeStore.set(String(user.id), options.challenge);

  res.json(options);
});

router.post("/webauthn/register/verify", auth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentChallenge = global.challengeStore.get(String(user.id));
    if (!currentChallenge) {
      return res.status(400).json({ message: "No challenge found" });
    }
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: currentChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: "localhost",

      requireUserVerification: false,
    });

    if (verification.verified) {
      const { registrationInfo } = verification;
      await db.execute(
        "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter) VALUES (?, ?, ?, ?)",
        [
          user.id,
          registrationInfo.credential.id,
          Buffer.from(registrationInfo.credential.publicKey).toString(
            "base64url",
          ),
          registrationInfo.credential.counter,
        ],
      );

      res.json({ message: "Passkey registered" });
    } else {
      res.status(400).json({ message: "Verification failed" });
    }
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Internal error" });
  }
});

router.get("/webauthn/login/options", async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: "Username required" });
  }

  const [rows] = await db.execute("SELECT * FROM users WHERE username=?", [
    username,
  ]);

  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const userPasskeys = await getUserPasskeys(user.id);

  if (userPasskeys.length === 0) {
    return res.status(400).json({ message: "No passkeys registered" });
  }

  try {
    const options = await generateAuthenticationOptions({
      rpID: "localhost",
      allowCredentials: userPasskeys.map((passkey) => ({
        id: passkey.credential_id,
        type: "public-key",
      })),
      userVerification: "preferred",
    });

    global.challengeStore.set(String(user.id), options.challenge);

    res.json(options);
  } catch (error) {
    console.error("Login options error:", error);
    res.status(500).json({ message: "Internal error" });
  }
});

const verifyLogin = async (req, res) => {
  try {
    const { username, ...body } = req.body;
    const [rows] = await db.execute("SELECT * FROM users WHERE username=?", [
      username,
    ]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const currentChallenge = global.challengeStore.get(String(user.id));
    if (!currentChallenge) {
      return res.status(400).json({ message: "No challenge found" });
    }
    const passkeys = await getUserPasskeys(user.id);

    if (!passkeys || passkeys.length === 0) {
      return res.status(400).json({ message: "No passkey registered" });
    }

    const credentialID = passkeys[0].credential_id;
    const counter = passkeys[0].counter;
    const publicKey = passkeys[0].public_key;
    const decodedPublicKey = Buffer.from(publicKey, "base64url");
    const toArray = new Uint8Array(decodedPublicKey);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: "localhost",
      credential: {
        id: credentialID,
        publicKey: toArray,
        counter: counter,
      },
      requireUserVerification: false,
    });

    if (verification.verified) {
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
      res.json({ message: "Login success" });
    } else {
      res.status(400).json({ message: "Verification failed" });
    }
  } catch (err) {
    console.error("Login verify error:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

router.post("/webauthn/login/verify", verifyLogin);

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  try {
    await db.execute("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hash,
    ]);

    res.json({ message: "User created" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
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
