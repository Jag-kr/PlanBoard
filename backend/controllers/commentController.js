const { validationResult } = require("express-validator");
const { Comment, Task, Project, WorkspaceMember, User } = require("../models");
const { hasRoleLevel } = require("../middleware/rbac");

/**
 * GET /api/tasks/:taskId/comments
 * Get all comments for a task with author info.
 */
const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, attributes: ["workspace_id"] }],
    });
    if (!task) return res.status(404).json({ error: "Task not found." });

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: task.Project.workspace_id, user_id: req.user.id },
    });
    if (!member)
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });

    const comments = await Comment.findAll({
      where: { task_id: taskId },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({ comments });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tasks/:taskId/comments
 * Create a comment. Any workspace member.
 */
const createComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { taskId } = req.params;
    const { body } = req.body;

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
    if (!isPrivileged && task.assignee_id !== req.user.id) {
      return res.status(403).json({
        error:
          "Insufficient permissions. Members can only comment on tasks assigned to them.",
      });
    }

    const comment = await Comment.create({
      task_id: taskId,
      user_id: req.user.id,
      body: body.trim(),
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    return res.status(201).json({ comment: fullComment });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/comments/:commentId
 * Delete a comment. Author can delete own; ADMIN/MANAGER can delete any.
 */
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId, {
      include: [
        {
          model: Task,
          include: [{ model: Project, attributes: ["workspace_id"] }],
        },
      ],
    });
    if (!comment) return res.status(404).json({ error: "Comment not found." });

    const workspaceId = comment.Task.Project.workspace_id;
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });
    if (!member)
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });

    const isPrivileged = hasRoleLevel(member.role, "MANAGER");
    const isAuthor = comment.user_id === req.user.id;

    if (!isPrivileged && !isAuthor) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments." });
    }

    await comment.destroy();
    return res.status(200).json({ message: "Comment deleted successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, createComment, deleteComment };
