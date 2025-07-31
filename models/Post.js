// models/Post.js
const mongoose = require("mongoose");
const { franc } = require("franc-min");
const langs = require("langs");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // ← NEW: reference to a Group
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },

  caption: {
    type: String,
    maxLength: 2200,
  },
  language: {
    type: String,
    default: "en",
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image", "video"],
    default: "image",
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      text: {
        type: String,
        required: true,
        maxLength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  likesCount: {
    type: Number,
    default: 0,
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  sharesCount: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
  },
  hashtags: [
    {
      type: String,
    },
  ],
  mentions: [
    {
      type: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1 });
postSchema.index({ caption: "text" });
postSchema.index({ type: 1 });
postSchema.index({ hashtags: 1 });

// Smart extraction middleware
postSchema.pre("save", function (next) {
  if (this.caption) {
    const hashtagRegex = /#\w+/g;
    const mentionRegex = /@\w+/g;
    const hashtags = this.caption.match(hashtagRegex) || [];
    const mentions = this.caption.match(mentionRegex) || [];

    this.hashtags = [
      ...new Set(hashtags.map((tag) => tag.slice(1).toLowerCase())),
    ];
    this.mentions = [
      ...new Set(mentions.map((user) => user.slice(1).toLowerCase())),
    ];

    const langCode = franc(this.caption);
    if (langCode !== "und") {
      const lang = langs.where("3", langCode);
      this.language = lang && lang["1"] ? lang["1"] : "en";
    } else {
      this.language = "en";
    }
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
