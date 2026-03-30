import { api } from "../api/api";
import { useAuth } from "../auth/useAuth";
import "./Profile.css";

export default function Profile() {
  const { user } = useAuth();
  console.log("User in Profile:", user);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    api("/auth/logout", { method: "POST" }).then(() => {
      console.log("Logged out");
      window.location.reload();
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">{user.username.charAt(0)}</div>

        <h1>{user.username}</h1>
        <p className="profile-welcome">Welcome back to your profile</p>

        <div className="profile-info">
          <div className="profile-info-item">
            <span className="profile-info-label">Username</span>
            <span className="profile-info-value">{user.username}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">Created At</span>
            <span className="profile-info-value">
              {new Date(user.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
