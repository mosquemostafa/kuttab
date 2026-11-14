import * as schema from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/server/lib/env";

export const db = drizzle(env.DATABASE_URL, { schema });
