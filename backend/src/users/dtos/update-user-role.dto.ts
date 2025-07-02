// update-user-role.dto.ts
import { IsInt, IsArray } from 'class-validator';

export class UpdateUserRoleDto {
  @IsArray()
  @IsInt({ each: true })
  roleIds: number[];
}
