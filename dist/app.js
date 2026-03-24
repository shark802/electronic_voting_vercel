"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = __importDefault(require("node:http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const session = __importStar(require("express-session"));
const socketIO_1 = require("./middlewares/socketIO");
const errorHandler_1 = require("./middlewares/errorHandler");
const api_1 = __importDefault(require("./api"));
const web_1 = __importDefault(require("./web"));
const express_mysql_session_1 = __importDefault(require("express-mysql-session"));
const multerConfig_1 = __importDefault(require("./config/multerConfig"));
// register all files that listening on event emitter
require("./events");
multerConfig_1.default.none();
dotenv_1.default.config();
const app = (0, express_1.default)();
// Required on Vercel (and other reverse proxies) for correct client IP and secure cookies
if (process.env.VERCEL) {
    app.set("trust proxy", 1);
}
const httpServer = node_http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", node_path_1.default.join(__dirname, "../views"));
app.use(express_1.default.static(node_path_1.default.join(__dirname, "../public")));
const MySQLStore = (0, express_mysql_session_1.default)(session);
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
app.use(session.default({
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
}));
/* Custom Middlewares */
app.use((0, socketIO_1.socketIO)(io));
/* Routers/Endpoints */
app.use("/api", api_1.default);
app.use("/", web_1.default);
app.use(errorHandler_1.errorHandler);
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
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
