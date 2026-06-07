const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const projectController = require("../controllers/projectController");

router.get(
  "/workspaces/:workspaceId/projects",
  auth,
  projectController.getProjects,
);

router.post(
  "/workspaces/:workspaceId/projects",
  auth,
  requireRole("MANAGER"),
  [body("name").trim().notEmpty().withMessage("Project name is required.")],
  projectController.createProject,
);

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

router.delete("/projects/:projectId", auth, projectController.deleteProject);

module.exports = router;
