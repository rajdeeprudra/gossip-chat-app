import axios from "axios";
import { useContext, useState } from "react"; 
import { UserContext } from "./UserContext"; // Make sure the path is correct

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext); // Correct the context import

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    try {
      const { data } = await axios.post(
        `https://gossip-backend-wv5l.onrender.com/${url}`, // Ensure you have the correct base URL here
        { username, password }
      );

      console.log("User created:", data);

      // Update context state
      if (setLoggedInUsername) setLoggedInUsername(username);
      if (setId) setId(data.id);
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
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
          {isLoginOrRegister === 'register' ? 'Register' : 'Log in'}
        </button>
        <div className="text-center mt-2">
          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?
              <button onClick={() => setIsLoginOrRegister('login')}>
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
            <div>
              Don't have an account?
              <button onClick={() => setIsLoginOrRegister('register')}>
                Register here
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
