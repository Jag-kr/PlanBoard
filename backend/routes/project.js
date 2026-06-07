const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const projectController = require("../controllers/projectController");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management within workspaces
 */

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects:
 *   get:
 *     summary: List all projects in a workspace
 *     tags: [Projects]
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
 *         description: Array of projects with task counts
 *       403:
 *         description: Not a workspace member
 */
router.get(
  "/workspaces/:workspaceId/projects",
  auth,
  projectController.getProjects,
);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects:
 *   post:
 *     summary: Create a project in a workspace (MANAGER or higher)
 *     tags: [Projects]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Website Redesign
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Project created
 *       403:
 *         description: Insufficient permissions
 *       422:
 *         description: Validation error
 */
router.post(
  "/workspaces/:workspaceId/projects",
  auth,
  requireRole("MANAGER"),
  [body("name").trim().notEmpty().withMessage("Project name is required.")],
  projectController.createProject,
);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   patch:
 *     summary: Update a project (MANAGER or higher in owning workspace)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED]
 *     responses:
 *       200:
 *         description: Updated project
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.patch(
  "/projects/:projectId",
  auth,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be blank."),
    body("status")
      .optional()
      .isIn(["ACTIVE", "ARCHIVED"])
      .withMessage("Invalid status."),
  ],
  projectController.updateProject,
);

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Delete a project and all its tasks (MANAGER or higher)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Project not found
 */
router.delete("/projects/:projectId", auth, projectController.deleteProject);

module.exports = router;
