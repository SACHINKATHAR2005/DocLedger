export declare const createOrgQuery: (name: string, created_by: string) => Promise<{
    organization: any;
}>;
export declare const getOrganizationsByUserId: (userId: string) => Promise<any[]>;
export declare const isOrgAdmin: (userId: string, orgId: string) => Promise<boolean>;
export declare const updateOrganizationQuery: (orgId: string, name: string) => Promise<any>;
export declare const deleteOrganizationQuery: (orgId: string) => Promise<boolean | undefined>;
export declare const addMemberToOrganizationQuery: (orgId: string, userId: string, role: "ADMIN" | "MEMBER" | "TEAM_LEAD", adminId: string) => Promise<any>;
export declare const getAllOrganizationMembersQuery: (orgId: string, reqUserId: string) => Promise<any[] | undefined>;
export declare const updateOrganizationMemberRoleQuery: (role: "ADMIN" | "MEMBER" | "TEAM_LEAD", orgId: string, targetUserId: string) => Promise<{
    success: boolean;
}>;
export declare const isMemberOfOrg: (orgId: string, memberId: string) => Promise<boolean>;
export declare const removeMemberFromOrganizationQuery: (orgId: string, memberId: string) => Promise<{
    success: boolean;
}>;
//# sourceMappingURL=organizationsService.d.ts.map