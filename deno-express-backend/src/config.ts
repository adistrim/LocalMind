import dotnev from "npm:dotenv";
import process from "node:process";

dotnev.config();

const DATABASE_URL = process.env.DATABASE_URL;
const PORT = process.env.PORT;
const ORIGIN_URL = process.env.ORIGIN_URL;

export { DATABASE_URL, PORT, ORIGIN_URL };
