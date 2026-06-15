export interface AuthRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
}

export interface ProfileRequest {
  age: number;
  occupation: string;
  interestTags: string[];
}

export interface ProfileResponse {
  userId: string;
  age: number;
  occupation: string;
  interestTags: string[];
  hasEmbedding: boolean;
}
