import "dotenv/config";
import { Pool } from "pg";
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 5432,
});
pool.on("connect", () => {
    console.log("Connected to the database");
});
pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
});
const query = (text, params) => {
    return pool.query(text, params);
};
export { query, pool };
//# sourceMappingURL=db.js.map