export interface AuthUser {
  userId: string | number;
  email: string;
  roles: { name: string }[] | string[];
}