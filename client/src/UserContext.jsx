import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    axios
      .get(
        "https://gossip-backend-wv5l.onrender.com/profile",
        { withCredentials: true }
      )
      .then((response) => {
        setUsername(response.data.username);
        setId(response.data.userId);
      })
      .catch((error) => {
        console.log("Not logged in");
      });
  }, []);

  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        id,
        setId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}