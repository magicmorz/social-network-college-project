const express = require('express');
const router = express.Router();

// GET login page
router.get('/login', (req, res) => {
  res.render('auth/login'); // path is views/auth/login.ejs
});

module.exports = router;
