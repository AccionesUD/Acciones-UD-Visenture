export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MfaVerification {
  token: string;
  email: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role?: string; // Making it optional as roles array will be primary
  roles?: string[]; // Add roles array
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number; 
}
