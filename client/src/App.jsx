import axios from "axios";
import { UserContextProvider } from "./UserContext"; // Correct import
import Routes from "./routs"; // Correct import for your routes

function App() {
  axios.defaults.baseURL = "https://gossip-backend-wv5l.onrender.com";
  axios.defaults.withCredentials = true;
 
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
}

export default App;
