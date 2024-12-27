import { Shard } from "./shard";

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    shards: Shard[];
    followers: string[];
}