const { Op } = require('sequelize');
const { Project, Task, WorkspaceMember, User } = require('../models');

/**
 * GET /api/workspaces/:workspaceId/stats
 * Full dashboard statistics for a workspace.
 */
const getStats = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // Verify membership
    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id }
    });
    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this workspace.' });
    }

    // Get all project IDs in this workspace
    const projects = await Project.findAll({
      where: { workspace_id: workspaceId },
      attributes: ['id']
    });
    const projectIds = projects.map((p) => p.id);

    const today = new Date().toISOString().split('T')[0];

    const [totalProjects, openTasks, overdueTasks, completedTasks] = await Promise.all([
      Project.count({ where: { workspace_id: workspaceId } }),
      Task.count({
        where: {
          project_id: { [Op.in]: projectIds },
          status: { [Op.ne]: 'DONE' }
        }
      }),
      Task.count({
        where: {
          project_id: { [Op.in]: projectIds },
          due_date: { [Op.lt]: today },
          status: { [Op.ne]: 'DONE' }
        }
      }),
      Task.count({
        where: {
          project_id: { [Op.in]: projectIds },
          status: 'DONE'
        }
      })
    ]);

    // My tasks: assigned to the current user, not done
    const myTasks =
      projectIds.length === 0
        ? []
        : await Task.findAll({
            where: {
              project_id: { [Op.in]: projectIds },
              assignee_id: req.user.id,
              status: { [Op.ne]: 'DONE' }
            },
            include: [{ model: Project, attributes: ['id', 'name'] }],
            order: [['due_date', 'ASC NULLS LAST']],
            limit: 20
          });

    // Recent activity: last 10 updated tasks in workspace
    const recentActivity =
      projectIds.length === 0
        ? []
        : await Task.findAll({
            where: { project_id: { [Op.in]: projectIds } },
            include: [
              { model: Project, attributes: ['id', 'name'] },
              { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
            ],
            order: [['updated_at', 'DESC']],
            limit: 10
          });

    return res.status(200).json({
      totalProjects,
      openTasks,
      overdueTasks,
      completedTasks,
      myTasks,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
