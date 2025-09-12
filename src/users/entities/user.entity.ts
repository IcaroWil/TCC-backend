export class UserEntity {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: Date;
  updatedAt: Date;
}