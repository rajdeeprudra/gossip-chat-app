import axios from "axios";
import { createContext, useEffect, useState } from "react";

// Create the context
export const UserContext = createContext({});

// Create the provider component
export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:4040/profile", { withCredentials: true })
      .then((response) => {
        setUsername(response.data.username);
        setId(response.data.id);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
      });
  }, []);

  return (
    <UserContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </UserContext.Provider>
  );
}
