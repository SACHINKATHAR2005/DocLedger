import "dotenv/config";
import { Pool } from "pg";
declare const pool: Pool;
declare const query: (text: string, params?: any[]) => Promise<import("pg").QueryResult<any>>;
export { query, pool };
//# sourceMappingURL=db.d.ts.map