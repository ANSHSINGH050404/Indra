import React, { ReactNode, useState } from "react";
import UserContext from "./UserContext";

interface User {
  id: string;
  fullname: string;
  email: string;
}

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;