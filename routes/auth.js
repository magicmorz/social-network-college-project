const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authController');

// GET login page
router.get('/login', authController.getLogin);

// POST login form
router.post('/login', authController.postLogin);

// Optional: register routes if needed
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Optional: logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
