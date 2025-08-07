const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    groups: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      maxlength: [150, "Bio cannot exceed 150 characters"],
      default: "",
    },
    country: {
      type: String,
      maxlength: [50, "Country cannot exceed 50 characters"],
      default: "",
    },
    followers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        followedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    following: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        followedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  // Hash password with salt of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual to get follower count
userSchema.virtual("followerCount").get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual to get following count
userSchema.virtual("followingCount").get(function () {
  return this.following ? this.following.length : 0;
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Create the model
const User = mongoose.model("User", userSchema);

module.exports = User;
