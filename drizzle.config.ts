import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({
  path: ".env.local",
});

export default defineConfig({
  out: "./migrations",
  schema: "./src/db/tables",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
