const User = require('../models/User');

// GET login page
exports.getLogin = (req, res) => {
    res.render('auth/login');
};

// POST login form
exports.postLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }
        
        const user = await User.findOne({ username });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        req.session.userId = user._id;
        res.redirect('/home');
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error during login" });
    }
};

// GET register page
exports.getRegister = (req, res) => {
    res.render('auth/register');
};

// POST register form
exports.postRegister = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Username already exists" });
            } else {
                return res.status(400).json({ error: "Email already exists" });
            }
        }

        await new User({ username, email, password }).save(); // password is auto-hashed
        res.redirect('/auth/login');
    } catch (err) {
        console.error("Registration failed:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        res.status(500).json({ error: "Registration error" });
    }
};

// GET logout
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};
