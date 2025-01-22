import { User } from "../../entities/user";

export interface UserInput {
 id: string;
}
export interface IUserRepository {
  findById: (id: string) => Promise<User | null>;
  onboard: (userInput: UserInput) => Promise<User | null>
}
