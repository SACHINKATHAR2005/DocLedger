import { z } from "zod";
import { addMemberToOrganizationQuery, createOrgQuery, deleteOrganizationQuery, getAllOrganizationMembersQuery, getOrganizationsByUserId, isOrgAdmin, removeMemberFromOrganizationQuery, updateOrganizationMemberRoleQuery, updateOrganizationQuery } from "../service/organizationsService.js";
import { pool } from "../config/db.js";
const createOrgSchema = z.object({
    name: z.string().min(3)
});
export const createOrganization = async (req, res) => {
    try {
        const paredData = createOrgSchema.safeParse(req.body);
        if (!paredData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: paredData.error.issues,
                success: false
            });
        }
        const { name } = paredData.data;
        const userId = req.user?.id;
        const newOrg = await createOrgQuery(name, userId);
        return res.status(201).json({
            message: "Organization created successfully",
            success: true,
            data: newOrg
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
export const getUsersOrganizations = async (req, res) => {
    try {
        const userId = req.user?.id;
        const organizations = await getOrganizationsByUserId(userId);
        return res.status(200).json({
            message: "Organizations fetched successfully",
            success: true,
            data: { organizations }
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
const updateOrgSchema = z.object({
    name: z.string().min(3)
});
export const updateOrganization = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orgId = req.params.orgId;
        const parssedData = updateOrgSchema.safeParse(req.body);
        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({
                message: "Forbidden - You are not an admin of this organization",
                success: false
            });
        }
        if (!parssedData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parssedData.error.issues,
                success: false
            });
        }
        const { name } = parssedData.data;
        const updateOrgName = await updateOrganizationQuery(orgId, name);
        return res.status(200).json({
            message: "Organization updated successfully",
            success: true,
            data: updateOrgName
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
export const deleteOrganization = async (req, res) => {
    try {
        const userId = req.user?.id;
        const orgId = req.params.orgId;
        const isAdmin = await isOrgAdmin(userId, orgId);
        if (!isAdmin) {
            return res.status(403).json({
                message: "Forbidden - You are not an admin of this organization",
                success: false
            });
        }
        const deleteOrg = await deleteOrganizationQuery(orgId);
        return res.status(200).json({
            message: "Organization deleted successfully",
            success: true,
            data: deleteOrg
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
const invitationUserSchema = z.object({
    email: z.string().email(),
    role: z.enum(["ADMIN", "MEMBER", "TEAM_LEAD"])
});
export const inviteUserToOrganization = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const orgId = req.params.orgId;
        const parsedData = invitationUserSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parsedData.error.issues,
                success: false
            });
        }
        const { email, role } = parsedData.data;
        const userResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (!userResult.rowCount) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }
        const userId = userResult.rows[0].id;
        const addMember = await addMemberToOrganizationQuery(orgId, userId, role, adminId);
        return res.status(200).json({
            message: "User invited to organization successfully",
            success: true,
            data: addMember
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
export const allMembersInOrganization = async (req, res) => {
    try {
        const orgId = req.params.orgId;
        const userId = req.user?.id;
        const getAllMember = await getAllOrganizationMembersQuery(orgId, userId);
        return res.status(200).json({
            message: "Organization members fetched successfully",
            success: true,
            data: { members: getAllMember }
        });
    }
    catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
const updateMemberOfOrgSchema = z.object({
    role: z.enum(["ADMIN", "MEMBER", "TEAM_LEAD"]),
});
export const updateMemberOfOrganization = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const orgId = req.params.orgId;
        const memberId = req.params.memberId;
        const parsedData = updateMemberOfOrgSchema.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parsedData.error.issues,
                success: false
            });
        }
        const { role } = parsedData.data;
        const isAdmin = await isOrgAdmin(adminId, orgId);
        if (!isAdmin) {
            return res.status(403).json({
                message: "Forbidden - You are not an admin of this organization",
                success: false
            });
        }
        const roleUpdateResult = await updateOrganizationMemberRoleQuery(role, orgId, memberId);
        return res.status(200).json({
            message: "Organization member role updated successfully",
            success: true,
            data: roleUpdateResult
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
export const deleteMemberFromOrganization = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const orgId = req.params?.orgId;
        const memberId = req.params?.memberId;
        const isAdmin = await isOrgAdmin(adminId, orgId);
        if (!isAdmin) {
            return res.status(403).json({
                message: "Forbidden - You are not an admin of this organization",
                success: false
            });
        }
        const deleteMemberResult = await removeMemberFromOrganizationQuery(orgId, memberId);
        return res.status(200).json({
            message: "Member removed from organization successfully",
            success: true,
            data: deleteMemberResult
        });
    }
    catch (error) {
        if (error.message === "User is not a member of this organization") {
            return res.status(404).json({
                message: "User is not a member of this organization",
                error: error.message,
                success: false
            });
        }
        if (error.message === "CANNOT_REMOVE_LAST_ADMIN") {
            return res.status(400).json({
                message: "Cannot remove the last admin from organization",
                error: error.message,
                success: false
            });
        }
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
//# sourceMappingURL=orgControllers.js.map