"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
async function main() {
    try {
        console.log(" Connecting to MongoDB via Prisma...");
        await database_1.default.$connect();
        console.log(" Connected successfully");
        const count = await database_1.default.user.count();
        console.log(` User count: ${count}`);
    }
    catch (error) {
        console.error(" Prisma connection failed:", error);
    }
    finally {
        await database_1.default.$disconnect();
        console.log(" Disconnected");
    }
}
main();
//# sourceMappingURL=prisma-test.js.map