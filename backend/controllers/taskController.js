const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { Task, Project, WorkspaceMember, Comment, User } = require("../models");
const { hasRoleLevel } = require("../middleware/rbac");

/**
 * GET /api/projects/:projectId/tasks
 * List tasks for a project. Supports ?status=, ?assignee_id=, ?search=
 */
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, assignee_id, search } = req.query;

    // Verify project exists and user is in its workspace
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: project.workspace_id, user_id: req.user.id },
    });
    if (!member)
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });

    const where = { project_id: projectId };
    if (status) where.status = status;
    if (assignee_id) where.assignee_id = assignee_id;
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ tasks });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/projects/:projectId/tasks
 * Create a task. Any workspace member can create.
 * Only MANAGER+ can assign tasks (set assignee_id).
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { projectId } = req.params;
    const { title, description, status, priority, assignee_id, due_date } =
      req.body;

    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: "Project not found." });

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: project.workspace_id, user_id: req.user.id },
    });
    if (!member)
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });

    // Only MANAGER+ can create tasks
    const canAssign = hasRoleLevel(member.role, "MANAGER");
    if (!canAssign) {
      return res.status(403).json({
        error:
          "Insufficient permissions. Only Managers and Admins can create tasks.",
      });
    }

    // Only MANAGER+ can assign tasks to others
    if (assignee_id && !canAssign) {
      return res.status(403).json({
        error:
          "Insufficient permissions. Only Managers and Admins can assign tasks.",
      });
    }

    const task = await Task.create({
      project_id: projectId,
      title: title.trim(),
      description: description || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      assignee_id: assignee_id || null,
      due_date: due_date || null,
      created_by: req.user.id,
    });

    // Reload with associations
    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
      ],
    });

    return res.status(201).json({ task: fullTask });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/tasks/:taskId
 * Update task fields.
 * - ADMIN/MANAGER: can update any task field including assignee
 * - MEMBER: can only update tasks assigned to them; cannot change assignee
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, attributes: ["workspace_id"] }],
    });
    if (!task) return res.status(404).json({ error: "Task not found." });

    const workspaceId = task.Project.workspace_id;
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });
    if (!member)
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });

    const isPrivileged = hasRoleLevel(member.role, "MANAGER");

    // Members can only update tasks assigned to them
    if (!isPrivileged && task.assignee_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only update tasks assigned to you." });
    }

    const { title, description, status, priority, assignee_id, due_date } =
      req.body;

    // Only MANAGER+ can reassign tasks
    if (assignee_id !== undefined && !isPrivileged) {
      return res.status(403).json({
        error:
          "Insufficient permissions. Only Managers and Admins can assign tasks.",
      });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee_id !== undefined) task.assignee_id = assignee_id;
    if (due_date !== undefined) task.due_date = due_date;

    await task.save();

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: "assignee", attributes: ["id", "name", "email"] },
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
        { model: Project, attributes: ["id", "name", "workspace_id"] },
      ],
    });

    return res.status(200).json({ task: updatedTask });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tasks/:taskId
 * Delete a task and its comments. Requires MANAGER or ADMIN.
 */
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, attributes: ["workspace_id"] }],
    });
    if (!task) return res.status(404).json({ error: "Task not found." });

    const workspaceId = task.Project.workspace_id;
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });
    if (!member || !hasRoleLevel(member.role, "MANAGER")) {
      return res.status(403).json({
        error: "Insufficient permissions. Requires MANAGER or higher.",
      });
    }

    await Comment.destroy({ where: { task_id: taskId } });
    await task.destroy();

    return res.status(200).json({ message: "Task deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
