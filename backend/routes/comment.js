const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Task comments
 */

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   get:
 *     summary: Get all comments for a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of comments with author info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       body:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       User:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       403:
 *         description: Not a workspace member
 *       404:
 *         description: Task not found
 */
router.get("/tasks/:taskId/comments", auth, commentController.getComments);

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     summary: Add a comment to a task (any workspace member)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 example: This looks good, will review tomorrow.
 *     responses:
 *       201:
 *         description: Comment created. Socket event comment:added emitted.
 *       403:
 *         description: Not a workspace member
 *       422:
 *         description: Validation error (body is empty)
 */
router.post(
  "/tasks/:taskId/comments",
  auth,
  [body("body").trim().notEmpty().withMessage("Comment body cannot be empty.")],
  commentController.createComment,
);

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (author or MANAGER/ADMIN)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Not author or insufficient role
 *       404:
 *         description: Comment not found
 */
router.delete("/comments/:commentId", auth, commentController.deleteComment);

module.exports = router;
