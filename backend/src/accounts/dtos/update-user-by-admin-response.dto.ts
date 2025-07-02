// src/accounts/dtos/update-user-by-admin-response.dto.ts
export interface UpdateUserByAdminResponse {
  accountId: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}
