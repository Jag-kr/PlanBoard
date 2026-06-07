const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const taskController = require("../controllers/taskController");

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management within projects
 */

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   get:
 *     summary: List tasks in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search on task title
 *     responses:
 *       200:
 *         description: Array of tasks with assignee and creator info
 *       403:
 *         description: Not a workspace member
 *       404:
 *         description: Project not found
 */
router.get("/projects/:projectId/tasks", auth, taskController.getTasks);

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Create a task in a project (any workspace member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Build login page
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *               priority:
 *                 type: string
 *                 enum: [URGENT, HIGH, MEDIUM, LOW]
 *               assignee_id:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Task created.
 *       403:
 *         description: Not a workspace member
 *       422:
 *         description: Validation error
 */
router.post(
  "/projects/:projectId/tasks",
  auth,
  [body("title").trim().notEmpty().withMessage("Task title is required.")],
  taskController.createTask,
);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE]
 *               priority:
 *                 type: string
 *                 enum: [URGENT, HIGH, MEDIUM, LOW]
 *               assignee_id:
 *                 type: string
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task updated.
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.patch(
  "/tasks/:taskId",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be blank."),
    body("status")
      .optional()
      .isIn(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
      .withMessage("Invalid status."),
    body("priority")
      .optional()
      .isIn(["URGENT", "HIGH", "MEDIUM", "LOW"])
      .withMessage("Invalid priority."),
  ],
  taskController.updateTask,
);

/**
 * @swagger
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task and its comments (MANAGER or higher)
 *     tags: [Tasks]
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
 *         description: Task deleted.
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Task not found
 */
router.delete("/tasks/:taskId", auth, taskController.deleteTask);

module.exports = router;
