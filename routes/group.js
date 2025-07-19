// routes/group.js
const express         = require("express");
const groupController = require("../Controllers/groupController");
const router          = express.Router();

// list all the groups this user belongs to
router.get("/",          groupController.getUserGroups);

// create a new group
router.post("/",         groupController.createGroup);

// join / leave
router.post("/:id/join",  groupController.joinGroup);
router.post("/:id/leave", groupController.leaveGroup);

// fetch one group’s details & its posts
router.get("/:id",        groupController.getGroupDetails);
router.get("/:id/posts",  groupController.getGroupPosts);

// discovery / search
router.get("/public",     groupController.getPublicGroups);
router.get("/search",     groupController.searchGroups);

router.get("/:id/posts", groupController.getGroupPosts);

module.exports = router;
