import cookieParser from 'cookie-parser';
import express from "express";
import path from "path";
import "express-async-errors";
import { config } from "./config/config";
import { ENV } from "./config/env";
import bootstrap from "./bootstrap";


export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Handle Important Configs
bootstrap.handleCompression(app);
bootstrap.handleCors(app);
bootstrap.handleSecurity(app);
bootstrap.handleRateLimiting(app);

// All App Routes
bootstrap.handleRoutes(app);

// Server Listening Configs
export const port = Number(ENV.PORT) || config.defaults.port;

async function main() {
	await bootstrap.handleDBConnect(app);
}
main();
