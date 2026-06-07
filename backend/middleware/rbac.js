const { WorkspaceMember } = require("../models");

/**
 * Role hierarchy: ADMIN > MANAGER > MEMBER
 */
const ROLE_HIERARCHY = {
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
};

/**
 * attachWorkspaceRole — middleware that looks up the requesting user's
 * WorkspaceMember record for the current workspace and attaches it to the
 * request object. Must run AFTER auth middleware.
 *
 * Expects workspaceId to be in req.params.workspaceId.
 */
const attachWorkspaceRole = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: "workspaceId param is required." });
    }

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });

    if (!member) {
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });
    }

    req.memberRole = member.role;
    req.workspaceMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireRole(minRole) — factory that returns a middleware enforcing a
 * minimum role level. Calls attachWorkspaceRole internally so it does NOT
 * need to be chained separately when using requireRole.
 *
 * @param {string} minRole - 'ADMIN' | 'MANAGER' | 'MEMBER'
 */
const requireRole = (minRole) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.workspaceId;
      if (!workspaceId) {
        return res
          .status(400)
          .json({ error: "workspaceId is required for role check." });
      }

      const member = await WorkspaceMember.findOne({
        where: { workspace_id: workspaceId, user_id: req.user.id },
      });

      if (!member) {
        return res
          .status(403)
          .json({ error: "You are not a member of this workspace." });
      }

      req.memberRole = member.role;
      req.workspaceMember = member;

      const userLevel = ROLE_HIERARCHY[member.role] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: `Insufficient permissions. Required: ${minRole}, your role: ${member.role}.`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * hasRoleLevel — utility used inside controllers (not as middleware) to
 * compare two role strings.
 *
 * @param {string} userRole
 * @param {string} minRole
 * @returns {boolean}
 */
const hasRoleLevel = (userRole, minRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
};

module.exports = {
  requireRole,
  attachWorkspaceRole,
  hasRoleLevel,
  ROLE_HIERARCHY,
};
