import React, { createContext, Dispatch, SetStateAction } from "react";

interface User {
  id: string;
  fullname: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export default UserContext;