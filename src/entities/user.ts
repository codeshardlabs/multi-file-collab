import { users } from "../db/tables/users";

export type User = typeof users.$inferSelect;
