// services/auth.ts
import { api } from "../lib/api";

export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/auth/login", {
    email,
    password,
  });
  return res.data;
};


export const registerUser = async (
  fullname: string,
  email: string,
  password: string
) => {
  const res = await api.post("/auth/register", {
    fullname,
    email,
    password,
  });
  return res.data;
};
