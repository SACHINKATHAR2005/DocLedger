import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { allMembersInOrganization, createOrganization, deleteMemberFromOrganization, deleteOrganization, getUsersOrganizations, inviteUserToOrganization, updateMemberOfOrganization, updateOrganization } from "../controllers/orgControllers.js";
const router = Router();
// http://localhost:8000/api/orgs/create
router.post("/create", authMiddleware, createOrganization);
router.get("/", authMiddleware, getUsersOrganizations);
// http://localhost:8000/api/orgs/update/:orgId
router.put("/update/:orgId", authMiddleware, updateOrganization);
// http://localhost:8000/api/orgs/delete/:orgId
router.delete("/delete/:orgId", authMiddleware, deleteOrganization);
// http://localhost:8000/api/orgs/add-member/:orgId
router.post("/add-member/:orgId", authMiddleware, inviteUserToOrganization);
// http://localhost:8000/api/orgs/members/:orgId
router.get("/members/:orgId", authMiddleware, allMembersInOrganization);
// http://localhost:8000/api/orgs/members/update-role/:orgId/:memberId
router.put("/members/update-role/:orgId/:memberId", authMiddleware, updateMemberOfOrganization);
// http://localhost:8000/api/orgs/members/remove/:orgId/:memberId
router.delete("/members/remove/:orgId/:memberId", authMiddleware, deleteMemberFromOrganization);
export default router;
//# sourceMappingURL=orgRoutes.js.map