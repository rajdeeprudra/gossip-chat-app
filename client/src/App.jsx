import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./routs";
import { GoogleOAuthProvider } from "@react-oauth/google";

function App() {
  axios.defaults.baseURL = "https://gossip-backend-wv5l.onrender.com";
  axios.defaults.withCredentials = true;

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <UserContextProvider>
        <Routes />
      </UserContextProvider>
    </GoogleOAuthProvider>
  );
}

export default App;