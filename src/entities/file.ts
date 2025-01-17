import { files } from "../db/tables/files";

export type File = typeof files.$inferSelect;
