import { files } from "../db/tables";

export type File = typeof files.$inferSelect;
