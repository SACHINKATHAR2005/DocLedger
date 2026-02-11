import type { Request, Response } from "express";
export declare const createOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUsersOrganizations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const inviteUserToOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const allMembersInOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMemberOfOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMemberFromOrganization: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=orgControllers.d.ts.map