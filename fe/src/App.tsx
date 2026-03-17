import { AuthProvider } from "./auth/AuthContext";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <AuthProvider>
      <Login />
      <Profile />
    </AuthProvider>
  );
}
