import http from "node:http";
import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "node:path";
import * as session from "express-session";
import { socketIO } from "./middlewares/socketIO";
import { errorHandler } from "./middlewares/errorHandler";
import apiRoutes from "./api";
import webRoutes from "./web";
import expressMysqlSession from "express-mysql-session";
import upload from './config/multerConfig';

// register all files that listening on event emitter
import './events';

upload.none();

dotenv.config();
process.env.TZ = process.env.APP_TIMEZONE || "Asia/Manila";
const app = express();
// Required on Vercel (and other reverse proxies) for correct client IP and secure cookies
if (process.env.VERCEL) {
    app.set("trust proxy", 1);
}
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

const MySQLStore = expressMysqlSession(session);
const sessionStore = new MySQLStore({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    clearExpired: true,
    expiration: 60 * 60000,
    createDatabaseTable: true,
    endConnectionOnClose: true,
    disableTouch: true,
    charset: "utf8mb4",
    schema: {
        tableName: "user_session",
        columnNames: {
            session_id: "session_id",
            expires: "expires",
            data: "data",
        },
    },
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 10,
});

app.use(
    session.default({
        secret: process.env.SESSION_SECRET || "session-secret",
        resave: true,
        saveUninitialized: false,
        store: sessionStore,
        rolling: true,
        cookie: {
            // secure: process.env.NODE_ENV === "production",
            maxAge: 12 * 60 * 60 * 1000, // 12 hours
            httpOnly: true,
        },
    })
);

/* Custom Middlewares */
app.use(socketIO(io));

/* Routers/Endpoints */
app.use("/api", apiRoutes);
app.use("/", webRoutes);

app.use(errorHandler);


process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const gracefulShutdown = () => {
    console.log('Received shutdown signal');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const PORT = process.env.PORT || 3000;
const ENVIRONMENT = process.env.NODE_ENV;

httpServer.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT} in ${ENVIRONMENT} Environment`);
});
