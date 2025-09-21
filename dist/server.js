"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const PORT = process.env.PORT || 5000;
async function connectDatabase() {
    try {
        await database_1.default.$connect();
        console.log("Database connected successfully");
    }
    catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}
async function gracefulShutdown() {
    console.log("Shutting down gracefully...");
    try {
        await database_1.default.$disconnect();
        console.log("Database disconnected");
        process.exit(0);
    }
    catch (error) {
        console.error(" Error during shutdown:", error);
        process.exit(1);
    }
}
async function startServer() {
    await connectDatabase();
    const server = app_1.default.listen(PORT, () => {
        console.log(` NHRMS API Server running on port ${PORT}`);
    });
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
    return server;
}
startServer().catch((error) => {
    console.error(" Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map