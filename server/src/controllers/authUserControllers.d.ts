import { type Request, type Response } from "express";
export declare const signupUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signinUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const meUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logoutUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authUserControllers.d.ts.map