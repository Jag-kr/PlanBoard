const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const memberController = require("../controllers/memberController");

/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: Workspace invitation acceptance
 */

/**
 * @swagger
 * /api/invitations/{token}/accept:
 *   post:
 *     summary: Accept a workspace invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The invitation token received via email
 *     responses:
 *       200:
 *         description: Invitation accepted, user added to workspace
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workspace:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *       400:
 *         description: Invitation already accepted or expired
 *       404:
 *         description: Invitation not found
 */
router.post("/:token/accept", auth, memberController.acceptInvitation);

module.exports = router;
