import { LoginPayload, LoginResponse } from "../types/authTypes";

export interface AuthService {
  login(payload: LoginPayload): Promise<LoginResponse>;
  register(payload: { name: string; email: string; password: string }): Promise<LoginResponse>;
  me(token: string): Promise<LoginResponse["user"]>;
}