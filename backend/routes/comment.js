const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

router.get("/tasks/:taskId/comments", auth, commentController.getComments);

router.post(
  "/tasks/:taskId/comments",
  auth,
  [body("body").trim().notEmpty().withMessage("Comment body cannot be empty.")],
  commentController.createComment,
);

router.delete("/comments/:commentId", auth, commentController.deleteComment);

module.exports = router;
