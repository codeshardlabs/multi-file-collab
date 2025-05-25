import { followers } from "../db/tables";

export type Follower = typeof followers.$inferSelect;
