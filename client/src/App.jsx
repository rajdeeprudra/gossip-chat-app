import axios from "axios";
import { UserContextProvider } from "./userContext"; // Correct import
import Routes from "./routs"; // Correct import for your routes

function App() {
  axios.defaults.baseURL = "http://localhost:4040";
  axios.defaults.withCredentials = true;
 
  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
}

export default App;
