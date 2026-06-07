const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const taskController = require("../controllers/taskController");

router.get("/projects/:projectId/tasks", auth, taskController.getTasks);

router.post(
  "/projects/:projectId/tasks",
  auth,
  [body("title").trim().notEmpty().withMessage("Task title is required.")],
  taskController.createTask,
);

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

router.delete("/tasks/:taskId", auth, taskController.deleteTask);

module.exports = router;
