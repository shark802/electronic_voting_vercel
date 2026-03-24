import { User } from "./types/User";
import { Voter } from "./types/Voter";

export function getPaginatedUsers(users: (Partial<User> & Partial<Voter>[]), page: number, pageSize: number = 30) {

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return users.slice(startIndex, endIndex);
}