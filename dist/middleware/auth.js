"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireSuperAdmin = exports.requireHospitalAdmin = exports.requirePatient = exports.requireDoctor = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../config/jwt");
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
const validRoles = Object.values(client_1.UserRole);
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
            });
        }
        const token = authHeader.substring(7);
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!validRoles.includes(decoded.role)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid user role',
            });
        }
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                nationalId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                password: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                createdBy: true,
                updatedBy: true,
                doctor: { select: { hospitalId: true } },
                adminUser: { select: { hospitalId: true } },
                labTech: { select: { hospitalId: true } },
            },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or inactive user',
            });
        }
        req.user = {
            ...user,
            hospitalId: user.doctor?.hospitalId ||
                user.adminUser?.hospitalId ||
                user.labTech?.hospitalId,
        };
        return next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};
exports.authenticate = authenticate;
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
        }
        return next();
    };
};
exports.authorize = authorize;
exports.requireDoctor = (0, exports.authorize)([client_1.UserRole.doctor]);
exports.requirePatient = (0, exports.authorize)([client_1.UserRole.patient]);
exports.requireHospitalAdmin = (0, exports.authorize)([client_1.UserRole.hospital_admin]);
exports.requireSuperAdmin = (0, exports.authorize)([client_1.UserRole.super_admin, client_1.UserRole.moh_admin]);
exports.requireAdmin = (0, exports.authorize)([client_1.UserRole.hospital_admin, client_1.UserRole.super_admin, client_1.UserRole.moh_admin]);
//# sourceMappingURL=auth.js.map