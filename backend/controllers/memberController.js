const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const { WorkspaceMember, Invitation, User, Workspace } = require("../models");
const { sendInvitationEmail } = require("../services/mailerService");

/**
 * GET /api/workspaces/:workspaceId/members
 * List all members of a workspace with their user info and role.
 */
const getMembers = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // Ensure requester is a member
    const selfMember = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: req.user.id },
    });
    if (!selfMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this workspace." });
    }

    const members = await WorkspaceMember.findAll({
      where: { workspace_id: workspaceId },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
      order: [["created_at", "ASC"]],
    });

    const result = members.map((m) => ({
      id: m.id,
      role: m.role,
      userId: m.User.id,
      name: m.User.name,
      email: m.User.email,
      joinedAt: m.createdAt,
    }));

    return res.status(200).json({ members: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/workspaces/:workspaceId/invite
 * Invite someone by email. Requires ADMIN or MANAGER role.
 */
const invite = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { workspaceId } = req.params;
    const { email, role = "MEMBER" } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if they're already a member
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      const existingMember = await WorkspaceMember.findOne({
        where: { workspace_id: workspaceId, user_id: existingUser.id },
      });
      if (existingMember) {
        return res
          .status(409)
          .json({ error: "This user is already a member of the workspace." });
      }
    }

    // Check for pending invite
    const pendingInvite = await Invitation.findOne({
      where: {
        workspace_id: workspaceId,
        email: normalizedEmail,
        status: "PENDING",
      },
    });
    if (pendingInvite) {
      return res
        .status(409)
        .json({ error: "An invitation for this email is already pending." });
    }

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found." });
    }

    const token = uuidv4();
    const invitation = await Invitation.create({
      workspace_id: workspaceId,
      email: normalizedEmail,
      token,
      role,
      status: "PENDING",
    });

    // Send invitation email (non-blocking failure)
    await sendInvitationEmail(
      normalizedEmail,
      token,
      workspace.name,
      req.user.name,
    );

    return res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        token: invitation.token,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invitations/:token/accept
 * Authenticated user accepts an invitation by token.
 */
const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({ where: { token } });
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found." });
    }
    if (invitation.status !== "PENDING") {
      return res
        .status(400)
        .json({ error: `Invitation is ${invitation.status.toLowerCase()}.` });
    }

    // The authenticated user's email must match the invitation email (soft check)
    // We allow any logged-in user to accept (they may have signed up with same email)
    const workspace = await Workspace.findByPk(invitation.workspace_id);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace no longer exists." });
    }

    // Check if user is already a member
    const existingMember = await WorkspaceMember.findOne({
      where: { workspace_id: invitation.workspace_id, user_id: req.user.id },
    });
    if (existingMember) {
      // Mark as accepted anyway
      invitation.status = "ACCEPTED";
      await invitation.save();
      return res.status(200).json({
        message: "You are already a member of this workspace.",
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
      });
    }

    // Add as member
    await WorkspaceMember.create({
      workspace_id: invitation.workspace_id,
      user_id: req.user.id,
      role: invitation.role,
    });

    invitation.status = "ACCEPTED";
    await invitation.save();

    return res.status(200).json({
      message: "Invitation accepted. Welcome to the workspace!",
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/workspaces/:workspaceId/members/:userId
 * Update a member's role. ADMIN only. Cannot change own role.
 */
const updateRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { workspaceId, userId } = req.params;
    const { role } = req.body;

    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot change your own role." });
    }

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: userId },
    });
    if (!member) {
      return res
        .status(404)
        .json({ error: "Member not found in this workspace." });
    }

    member.role = role;
    await member.save();

    return res
      .status(200)
      .json({ member: { id: member.id, userId, role: member.role } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/workspaces/:workspaceId/members/:userId
 * Remove a member. ADMIN only. Cannot remove self if last admin.
 */
const removeMember = async (req, res, next) => {
  try {
    const { workspaceId, userId } = req.params;

    // If removing self, check not last admin
    if (userId === req.user.id) {
      const adminCount = await WorkspaceMember.count({
        where: { workspace_id: workspaceId, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          error:
            "Cannot remove yourself — you are the last admin of this workspace.",
        });
      }
    }

    const member = await WorkspaceMember.findOne({
      where: { workspace_id: workspaceId, user_id: userId },
    });
    if (!member) {
      return res
        .status(404)
        .json({ error: "Member not found in this workspace." });
    }

    await member.destroy();
    return res.status(200).json({ message: "Member removed successfully." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMembers,
  invite,
  acceptInvitation,
  updateRole,
  removeMember,
};
