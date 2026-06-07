const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const workspaceController = require("../controllers/workspaceController");
const memberController = require("../controllers/memberController");
const dashboardController = require("../controllers/dashboardController");

// All workspace routes require authentication
router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Workspaces
 *   description: Workspace management
 */

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Engineering
 *     responses:
 *       201:
 *         description: Workspace created
 *       422:
 *         description: Validation error
 */
router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Workspace name is required.")],
  workspaceController.create,
);

/**
 * @swagger
 * /api/workspaces/mine:
 *   get:
 *     summary: Get workspaces the current user belongs to
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces with member count and user role
 */
router.get("/mine", workspaceController.getMine);

/**
 * @swagger
 * /api/workspaces/{workspaceId}:
 *   patch:
 *     summary: Update workspace name (ADMIN only)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated workspace
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Workspace not found
 */
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

/**
 * @swagger
 * /api/workspaces/{workspaceId}/stats:
 *   get:
 *     summary: Get dashboard statistics for a workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard stats object
 */
router.get("/:workspaceId/stats", dashboardController.getStats);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members:
 *   get:
 *     summary: List all members of a workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of members with role and user info
 */
router.get("/:workspaceId/members", memberController.getMembers);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/invite:
 *   post:
 *     summary: Invite a user to the workspace by email (MANAGER or higher)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, MEMBER]
 *                 default: MEMBER
 *     responses:
 *       201:
 *         description: Invitation created and email sent
 *       409:
 *         description: User already a member or invite pending
 */
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

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members/{userId}:
 *   patch:
 *     summary: Update a member's role (ADMIN only)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, MANAGER, MEMBER]
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Cannot change own role
 *       403:
 *         description: Insufficient permissions
 */
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

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members/{userId}:
 *   delete:
 *     summary: Remove a member from workspace (ADMIN only)
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: Last admin protection triggered
 *       403:
 *         description: Insufficient permissions
 */
router.delete(
  "/:workspaceId/members/:userId",
  requireRole("ADMIN"),
  memberController.removeMember,
);

module.exports = router;
