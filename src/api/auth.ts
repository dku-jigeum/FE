import { api, setToken } from "./client";
import type { AuthRequest, TokenResponse, ProfileRequest, ProfileResponse } from "../types/auth";

export async function login(req: AuthRequest): Promise<void> {
  const res = await api.post<TokenResponse>("/api/auth/login", req);
  setToken(res.token);
}

export async function signup(req: AuthRequest): Promise<void> {
  const res = await api.post<TokenResponse>("/api/auth/signup", req);
  setToken(res.token);
}

export async function createProfile(req: ProfileRequest): Promise<ProfileResponse> {
  return api.post<ProfileResponse>("/api/users/profile", req);
}

export async function getProfile(): Promise<ProfileResponse> {
  return api.get<ProfileResponse>("/api/users/profile");
}

export async function updateProfile(req: ProfileRequest): Promise<ProfileResponse> {
  return api.put<ProfileResponse>("/api/users/profile", req);
}
