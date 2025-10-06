export type UserEntity = {
  id: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  firstName: string | null;
  lastName: string | null;
  linkedIn: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
};
