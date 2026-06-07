const { Op } = require("sequelize");
const { Project, Task, WorkspaceMember, User } = require("../models");
const { hasRoleLevel } = require("../middleware/rbac");

/**
 * GET /api/workspaces/:workspaceId/stats
 * Full dashboard statistics for a workspace.
 * Role-aware: members only see activity for tasks assigned to them.
 */
const getStats = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // req.memberRole is attached by attachWorkspaceRole middleware on this route
    const memberRole = req.memberRole;
    const userId = req.user.id;
    const isPrivileged = hasRoleLevel(memberRole, "MANAGER");

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
          where: {
            project_id: { [Op.in]: projectIds },
            status: "DONE",
          },
        }),
      ]);

    // My tasks: assigned to the current user, not done
    const myTasks =
      projectIds.length === 0
        ? []
        : await Task.findAll({
            where: {
              project_id: { [Op.in]: projectIds },
              assignee_id: userId,
              status: { [Op.ne]: "DONE" },
            },
            include: [{ model: Project, attributes: ["id", "name"] }],
            order: [["due_date", "ASC NULLS LAST"]],
            limit: 20,
          });

    // Recent activity:
    // - ADMIN/MANAGER: last 10 updated tasks across the whole workspace
    // - MEMBER: last 10 tasks assigned to them
    const activityWhere =
      projectIds.length === 0
        ? null
        : isPrivileged
          ? { project_id: { [Op.in]: projectIds } }
          : { project_id: { [Op.in]: projectIds }, assignee_id: userId };

    const recentActivity =
      activityWhere === null
        ? []
        : await Task.findAll({
            where: activityWhere,
            include: [
              { model: Project, attributes: ["id", "name"] },
              {
                model: User,
                as: "assignee",
                attributes: ["id", "name", "email"],
              },
            ],
            order: [["updated_at", "DESC"]],
            limit: 10,
          });

    return res.status(200).json({
      totalProjects,
      openTasks,
      overdueTasks,
      completedTasks,
      myTasks,
      recentActivity,
      role: memberRole,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
