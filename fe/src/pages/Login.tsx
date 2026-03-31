import { useState } from "react";
import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import "./Login.css";
import { loginWithPasskey } from "../common/webauthn";

export default function Login() {
  const { fetchMe, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: { preventDefault: () => void }) {
    e.preventDefault();

    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      await fetchMe();
    } catch (error: any) {
      alert("Login failed");
    }
  }

  if (user) {
    return null;
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>

        <div className="input-group">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await loginWithPasskey(username);
              await fetchMe();
            } catch (error) {
              console.error("Passkey login error:", error);
            }
          }}
        >
          Sign In with Passkey
        </button>
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
