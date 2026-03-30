import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import { GoogleLogin } from "@react-oauth/google";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState("register");

  const { setUsername: setLoggedInUsername, setId } =
    useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();

    const url = isLoginOrRegister === "register" ? "register" : "login";

    try {
      const { data } = await axios.post(
        `https://gossip-backend-wv5l.onrender.com/${url}`,
        { username, password },
        { withCredentials: true }
      );

      setLoggedInUsername(username);
      setId(data.id);
    } catch (error) {
      console.error(
        "Auth error:",
        error.response?.data || error.message
      );
    }
  }

  async function handleGoogleLogin(credentialResponse) {
    try {
      const { data } = await axios.post(
        "https://gossip-backend-wv5l.onrender.com/google-login",
        {
          token: credentialResponse.credential,
        },
        { withCredentials: true }
      );

      setLoggedInUsername(data.username);
      setId(data.id);
    } catch (err) {
      console.error("Google login error", err);
    }
  }

  return (
    <div className="bg-purple-200 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          type="text"
          placeholder="Username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        <button className="bg-purple-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === "register"
            ? "Register"
            : "Log in"}
        </button>

        <div className="mt-3 text-center">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Login Failed")}
          />
        </div>

        <div className="text-center mt-2">
          {isLoginOrRegister === "register" && (
            <div>
              Already a member?
              <button
                type="button"
                onClick={() => setIsLoginOrRegister("login")}
              >
                Login here
              </button>
            </div>
          )}

          {isLoginOrRegister === "login" && (
            <div>
              Don't have an account?
              <button
                type="button"
                onClick={() =>
                  setIsLoginOrRegister("register")
                }
              >
                Register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}