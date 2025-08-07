// models/Group.js

// Import the Mongoose library for defining schemas and interacting with MongoDB
const mongoose = require('mongoose');

// Define the schema (structure) for the Group collection in MongoDB
const groupSchema = new mongoose.Schema(
  {
    // The group's name (required field)
    name: { type: String, required: true },

    // A short description of the group (optional)
    description: { type: String },

    // Determines if the group is public (default is false = private)
    isPublic: { type: Boolean, default: false },

    // The user who created the group (required reference to User model)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // List of group members (array of User references)
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // List of group admins (array of User references)
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    // Adds createdAt and updatedAt timestamps automatically
    timestamps: true
  }
);

// Export the Group model to be used in other parts of the application
module.exports = mongoose.model('Group', groupSchema);
