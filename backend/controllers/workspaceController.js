const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const {
  Workspace,
  WorkspaceMember,
  Project,
  Task,
  User,
  sequelize,
} = require("../models");

/**
 * POST /api/workspaces
 * Create a workspace and make the creator an ADMIN member.
 */
const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const workspace = await Workspace.create({
      name: name.trim(),
      owner_id: req.user.id,
    });

    // Add creator as ADMIN
    await WorkspaceMember.create({
      workspace_id: workspace.id,
      user_id: req.user.id,
      role: "ADMIN",
    });

    return res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/workspaces/mine
 * Return all workspaces where the current user is a member.
 */
const getMine = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Workspace,
          include: [
            {
              model: WorkspaceMember,
              attributes: ["id"],
            },
          ],
        },
      ],
    });

    const workspaces = memberships.map((m) => {
      const ws = m.Workspace.toJSON();
      ws.memberCount = m.Workspace.WorkspaceMembers
        ? m.Workspace.WorkspaceMembers.length
        : 0;
      ws.role = m.role;
      delete ws.WorkspaceMembers;
      return ws;
    });

    return res.status(200).json({ workspaces });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId
 * Update a workspace's name. ADMIN only.
 */
const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { workspaceId } = req.params;
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const { name } = req.body;
    if (name && name.trim() !== workspace.name) {
      workspace.name = name.trim();
    }

    await workspace.save();
    return res.status(200).json({ workspace });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/workspaces/:workspaceId/stats
 * Return aggregated stats for a workspace's dashboard.
 */
const getStats = async (req, res, next) => {
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

    // Get all project IDs in this workspace
    const projects = await Project.findAll({
      where: { workspace_id: workspaceId },
      attributes: ["id"],
    });
    const projectIds = projects.map((p) => p.id);

    const today = new Date().toISOString().split("T")[0];

    const [totalProjects, openTasks, overdueTasks, completedTasks] =
      await Promise.all([
        Project.count({ where: { workspace_id: workspaceId } }),
        Task.count({
          where: {
            project_id: { [Op.in]: projectIds },
            status: { [Op.ne]: "DONE" },
          },
        }),
        Task.count({
          where: {
            project_id: { [Op.in]: projectIds },
            due_date: { [Op.lt]: today },
            status: { [Op.ne]: "DONE" },
          },
        }),
        Task.count({
          where: { project_id: { [Op.in]: projectIds }, status: "DONE" },
        }),
      ]);

    // Recent activity: last 10 updated tasks with project name
    const recentActivity = await Task.findAll({
      where: { project_id: { [Op.in]: projectIds } },
      include: [
        { model: Project, attributes: ["id", "name"] },
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
      ],
      order: [["updated_at", "DESC"]],
      limit: 10,
    });

    return res.status(200).json({
      totalProjects,
      openTasks,
      overdueTasks,
      completedTasks,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getMine, update, getStats };
