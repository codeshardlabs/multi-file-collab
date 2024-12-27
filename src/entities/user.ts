import { Shard } from "./shard";

export interface User {
    name: string;
    email: string;
    password: string;
    shards: Shard[];
    followers: string[];

}