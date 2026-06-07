const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole, attachWorkspaceRole } = require("../middleware/rbac");
const workspaceController = require("../controllers/workspaceController");
const memberController = require("../controllers/memberController");
const dashboardController = require("../controllers/dashboardController");

// All workspace routes require authentication
router.use(auth);

router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Workspace name is required.")],
  workspaceController.create,
);

router.get("/mine", workspaceController.getMine);

router.patch(
  "/:workspaceId",
  requireRole("ADMIN"),
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be blank."),
  ],
  workspaceController.update,
);

router.get(
  "/:workspaceId/stats",
  attachWorkspaceRole,
  dashboardController.getStats,
);

router.get(
  "/:workspaceId/members",
  requireRole("MANAGER"),
  memberController.getMembers,
);

router.post(
  "/:workspaceId/invite",
  requireRole("MANAGER"),
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required.")
      .normalizeEmail(),
    body("role")
      .optional()
      .isIn(["ADMIN", "MANAGER", "MEMBER"])
      .withMessage("Role must be ADMIN, MANAGER, or MEMBER."),
  ],
  memberController.invite,
);

router.patch(
  "/:workspaceId/members/:userId",
  requireRole("ADMIN"),
  [
    body("role")
      .isIn(["ADMIN", "MANAGER", "MEMBER"])
      .withMessage("Role must be ADMIN, MANAGER, or MEMBER."),
  ],
  memberController.updateRole,
);

router.delete(
  "/:workspaceId/members/:userId",
  requireRole("ADMIN"),
  memberController.removeMember,
);

module.exports = router;
