import { user } from '@prisma/client';

export interface UserResponseDTO {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  user_type: 'admin' | 'employee';
  created_at: string;
}

export const UserMapper = {
  fromPrisma(user: user): UserResponseDTO {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_type: user.user_type as 'admin' | 'employee',
      created_at: user.created_at.toISOString(),
    };
  },

  toPublic(user: user): Omit<UserResponseDTO, 'email'> {
    const dto = UserMapper.fromPrisma(user);
    const { email, ...publicData } = dto;
    return publicData;
  },
};
