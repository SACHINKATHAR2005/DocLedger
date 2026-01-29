



import { pool } from "../config/db.js";

export const createOrgQuery = async (name: string, created_by: string) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const orgResult = await client.query(
            "INSERT INTO organizations (name, created_by) VALUES ($1, $2) RETURNING *",
            [name, created_by]
        )

        const orgId = orgResult.rows[0].id;

        await client.query(
            "INSERT INTO organization_members (organization_id,user_id,role,joined_at) VALUES ($1,$2,'ADMIN',NOW())",
            [orgId, created_by]
        )

        await client.query("COMMIT");
        return { organization: orgResult.rows[0] };

    } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("Error creating organization:", error.message);
        throw new Error("Could not create organization");
    } finally {
        client.release();

    }
}


export const getOrganizationsByUserId = async (userId: string) => {
    const client = await pool.connect();

    try {
        const orgResult = await client.query(
            `SELECT o.id, o.name, o.created_at, om.role
                FROM organizations o
                JOIN organization_members om
                    ON o.id = om.organization_id
                    WHERE om.user_id = $1; `,
            [userId]
        )
        return orgResult.rows;

    } catch (error: any) {
        client.query("RollBACK");
        console.error("Error fetching organizations:", error.message);
        throw new Error("Could not fetch organizations");


    } finally {
        client.release()
    }
}

export const isOrgAdmin = async (
    userId: string,
    orgId: string
): Promise<boolean> => {
    const result = await pool.query(
        `SELECT 1
     FROM organization_members
     WHERE user_id = $1
       AND organization_id = $2
       AND role = 'ADMIN'`,
        [userId, orgId]
    );

    return (result.rowCount ?? 0) > 0;
};

export const updateOrganizationQuery = async (
    orgId: string,
    name: string
) => {
    try {
        const result = await pool.query(
            `UPDATE organizations
            SET name = $1
            WHERE id = $2
            RETURNING *`,
            [name, orgId]
        )
        return result.rows[0];

    } catch (error: any) {
        console.error(error);
    }
}

export const deleteOrganizationQuery = async (
    orgId: string
) => {
    try {
        const result = await pool.query(
            `DELETE FROM organizations
            WHERE id = $1
            RETURNING *
            `,
            [orgId]
        )
        return (result.rowCount ?? 0) > 0;

    } catch (error: any) {
        console.error(error);
    }
}

export const addMemberToOrganizationQuery = async (
    orgId: string,
    userId: string,
    role: "ADMIN" | "MEMBER" | "TEAM_LEAD",
    adminId: string
) => {
    try {

        const isAdmin = await isOrgAdmin(adminId, orgId);
        if (!isAdmin) {
            throw new Error("Forbidden - You are not an admin of this organization");
        }

        const isUserExists = await pool.query(
            `Select 1 FROM users WHERE id = $1`,
            [userId]
        )
        if (!isUserExists.rowCount) {
            throw new Error("User does not exist");
        }

        const isAlreadyMember = await pool.query(
            `SELECT 1 FROM organization_members
            WHERE organization_id = $1 AND user_id = $2`,
            [orgId, userId]
        )
        if (isAlreadyMember.rowCount) {
            throw new Error("User is already a member of this organization");
        }
        const result = await pool.query(
            `INSERT INTO organization_members (organization_id,user_id,role)
            VALUES ($1,$2,$3)
            RETURNING *`,
            [orgId, userId, role]
        )
        return result.rows[0];
    } catch (error: any) {
        console.error(error);

    }
}

export const getAllOrganizationMembersQuery = async (
    orgId: string,
    reqUserId: string
) => {
    try {
        const isMember = await pool.query(
            `SELECT role
     FROM organization_members
     WHERE user_id = $1 AND organization_id = $2`,
            [reqUserId, orgId]
        )
        if (!isMember.rowCount) {
            throw new Error("Forbidden - You are not a member of this organization");
        }

        const result = await pool.query(
            `SELECT
       om.organization_id,
       om.user_id,
       om.role,
       om.joined_at,
       jsonb_build_object(
           'id', u.id,
           'name', u.name,
           'email', u.email,
           'created_at', u.created_at
       ) AS user
     FROM organization_members om
     JOIN users u ON u.id = om.user_id
     WHERE om.organization_id = $1`,
            [orgId]
        );
        return result.rows;

    } catch (error) {
        console.error(error);
    }
}

export const updateOrganizationMemberRoleQuery = async (
    role: "ADMIN" | "MEMBER" | "TEAM_LEAD",
    orgId: string,
    targetUserId: string,

) => {

    const targetMember = await pool.query(
        `SELECT role FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, targetUserId]
    );
    if (!targetMember.rowCount) {
        throw new Error("User is not a member of this organization");
    }
    const currentRole = targetMember.rows[0].role;
    if (currentRole === "ADMIN" && role !== "ADMIN") {
        const adminCountResult = await pool.query(
            `SELECT COUNT(*) FROM organization_members
       WHERE organization_id = $1 AND role = 'ADMIN'`,
            [orgId]
        );

        const adminCount = Number(adminCountResult.rows[0].count);

        if (adminCount === 1) {
            throw new Error("CANNOT_DOWNGRADE_LAST_ADMIN");
        }
    }

    await pool.query(
        `UPDATE organization_members
     SET role = $1
     WHERE organization_id = $2 AND user_id = $3`,
        [role, orgId, targetUserId]
    );

    return { success: true };

}


export const isMemberOfOrg = async (
    orgId: string,
    memberId: string
) => {
    const result = await pool.query(
        `SELECT 1 FROM organization_members
         WHERE organization_id = $1 AND user_id = $2`,
        [orgId, memberId]
    )

    return (result.rowCount ?? 0) > 0;
}

export const removeMemberFromOrganizationQuery = async (
    orgId: string,
    memberId: string

) => {
    const memberResult = await pool.query(
        `SELECT role FROM organization_members
         WHERE organization_id = $1 AND user_id = $2`,
        [orgId, memberId]
    );

    if (!memberResult.rowCount || !memberResult.rows[0]) {
        throw new Error("User is not a member of this organization");
    }

    const targetMemberRole = memberResult.rows[0].role;

    if (targetMemberRole === "ADMIN") {
        const adminCountResult = await pool.query(
            `SELECT COUNT(*) FROM organization_members
       WHERE organization_id = $1 AND role = 'ADMIN'`,
            [orgId]
        );

        const adminCount = Number(adminCountResult.rows[0].count);

        if (adminCount === 1) {
            throw new Error("CANNOT_REMOVE_LAST_ADMIN");
        }
    }


    await pool.query(
        `DELETE FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
        [orgId, memberId]
    );

    return { success: true };
}