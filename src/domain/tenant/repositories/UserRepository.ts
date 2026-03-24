import { User } from "../../../types/user/type.user";

export interface UserRepository {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
}
