import type { JWTPayload } from "../types";
export declare const generateAccessToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const generateRefreshToken: (payload: Omit<JWTPayload, "iat" | "exp">) => string;
export declare const verifyToken: (token: string) => JWTPayload;
//# sourceMappingURL=jwt.d.ts.map