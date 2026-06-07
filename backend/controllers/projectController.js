const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Project, Task, WorkspaceMember, Comment } = require("../models");
const { hasRoleLevel } = require("../middleware/rbac");

/**
 * GET /api/workspaces/:workspaceId/projects
 * List all projects in a workspace with task count.
 */
const getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // Verify membership
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });
    if (!member) {
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });
    }

    const projects = await Project.findAll({
      where: { workspace_id: workspaceId },
      include: [{ model: Task, attributes: ["id"] }],
      order: [["created_at", "DESC"]],
    });

    const result = projects.map((p) => {
      const json = p.toJSON();
      json.taskCount = json.Tasks ? json.Tasks.length : 0;
      delete json.Tasks;
      return json;
    });

    return res.status(200).json({ projects: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/workspaces/:workspaceId/projects
 * Create a project. Requires MANAGER or ADMIN role.
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { workspaceId } = req.params;
    const { name, description } = req.body;

    const project = await Project.create({
      workspace_id: workspaceId,
      name: name.trim(),
      description: description || null,
      created_by: req.user.id,
    });

    return res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/projects/:projectId
 * Update name, description, or status. Requires MANAGER or ADMIN in owning workspace.
 */
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Check role in owning workspace
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: project.workspace_id, user_id: req.user.id },
    });
    if (!member || !hasRoleLevel(member.role, "MANAGER")) {
      return res.status(403).json({
        error: "Insufficient permissions. Requires MANAGER or higher.",
      });
    }

    const { name, description, status } = req.body;
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();
    return res.status(200).json({ project });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/projects/:projectId
 * Delete a project and cascade its tasks + comments. Requires MANAGER or ADMIN.
 */
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }

    // Check role in owning workspace — Delete requires ADMIN
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: project.workspace_id, user_id: req.user.id },
    });
    if (!member || !hasRoleLevel(member.role, "ADMIN")) {
      return res.status(403).json({
        error: "Insufficient permissions. Only Admins can delete projects.",
      });
    }

    // Cascade: delete comments, then tasks, then project
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      attributes: ["id"],
    });
    const taskIds = tasks.map((t) => t.id);

    if (taskIds.length > 0) {
      await Comment.destroy({ where: { task_id: taskIds } });
      await Task.destroy({ where: { project_id: projectId } });
    }

    await project.destroy();
    return res.status(200).json({ message: "Project deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };
