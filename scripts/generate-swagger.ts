import fs from "node:fs";
import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import { swaggerOptions } from "@/server/lib/swagger";

const spec = swaggerJsdoc(swaggerOptions) as {
  paths?: Record<string, unknown>;
};
const outputPath = path.resolve(
  process.cwd(),
  "src/server/lib/swagger-spec.json",
);

fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
console.log(
  `[swagger] Generated OpenAPI spec with ${Object.keys(spec.paths || {}).length} paths at ${outputPath}`,
);
