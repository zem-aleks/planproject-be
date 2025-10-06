import { UserEntity } from '../types/entity';
import { User } from '../entities/user.entity';

export const mapToEntity = (user: User): UserEntity => {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    firstName: user.firstName,
    lastName: user.lastName,
    linkedIn: user.linkedIn,
    website: user.website,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
