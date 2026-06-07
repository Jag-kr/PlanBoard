const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const memberController = require("../controllers/memberController");

router.post("/:token/accept", auth, memberController.acceptInvitation);

module.exports = router;
