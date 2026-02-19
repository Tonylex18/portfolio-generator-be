import dotenv from "dotenv";
dotenv.config();
import { createServer } from "http";
import { Server } from "socket.io";
import { app, port } from "./app";
import { config } from "./config/config";
import logger from "./utils/logging";

const server = createServer(app)
export const io = new Server(server, {
    cors: {
        // origin: ["http://localhost:3000"]
        origin: "*"
    }
})


server.listen(port, () => {
    logger.general.info(`listening on ${config.apiEndPoint}.`);
});

