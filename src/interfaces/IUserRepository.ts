import { User } from "../entities/user"

export interface IUserRepository {
    findByUsername: (username: string) => Promise<User | null>
    save(doc: User): Promise<void> 
}