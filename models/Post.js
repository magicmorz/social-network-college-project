const mongoose = require("mongoose");
const { franc } = require("franc-min");
const langs = require("langs");

const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    default: "",
    maxLength: 500,
  },
  gifUrl: {
    type: String,
    default: "",
    maxLength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Custom validation to ensure at least one of text or gifUrl is provided
commentSchema.pre("validate", function (next) {
  if (!this.text && !this.gifUrl) {
    return next(new Error("Comment must have either text or a GIF"));
  }
  next();
});

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  caption: {
    type: String,
    maxLength: 2200,
    default: "",
  },
  language: {
    type: String,
    default: "en",
  },
  media: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "video"], // Aligned with postController.js
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [commentSchema],
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
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Place",
    index: true,
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
postSchema.index({ place: 1 });

// Maintain counts for likes, comments, and shares
postSchema.pre("save", function (next) {
  this.likesCount = this.likes.length;
  this.commentsCount = this.comments.length;
  this.sharesCount = this.sharesCount || 0; // No shares array, so keep as is
  next();
});

// Smart extraction middleware for hashtags, mentions, and language
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

    const supportedLanguages = [
      "da",
      "de",
      "en",
      "es",
      "fi",
      "fr",
      "hu",
      "it",
      "nb",
      "nl",
      "pt",
      "ro",
      "ru",
      "sv",
      "tr",
    ];

    const langCode = franc(this.caption, { whitelist: supportedLanguages });
    if (langCode !== "und") {
      const lang = langs.where("3", langCode);
      this.language = lang && lang["1"] ? lang["1"] : "en";
    } else {
      this.language = "en";
    }
  } else {
    this.hashtags = [];
    this.mentions = [];
    this.language = "en";
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
