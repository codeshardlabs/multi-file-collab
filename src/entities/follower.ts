import { followers } from "../db/tables/users";

export type Follower = typeof followers.$inferSelect;
