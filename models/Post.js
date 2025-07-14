const mongoose = require("mongoose");
const { franc } = require("franc-min");
const langs = require("langs");

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  caption: {
    type: String,
    maxLength: 2200,
  },
  language: {
    type: String,
    default: "und", // ISO 639-1 code like 'en', 'es', or 'und' for undetermined
  },
  image: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    default: 'image'
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
postSchema.index({ createdAt: -1 }); // Index for sorting by creation date
postSchema.index({ user: 1 }); // Index for user lookups
postSchema.index({ caption: 'text' }); // Text index for caption search
postSchema.index({ type: 1 }); // Index for post type filtering
postSchema.index({ hashtags: 1 }); // Index for hashtag search

// Smart extraction middleware - extracts hashtags and mentions from the caption
// and detects the language of the caption

postSchema.pre("save", function (next) {
  if (this.caption) {
    // --- Hashtag & Mention Extraction ---
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

    // --- Language Detection ---
    const langCode = franc(this.caption);
    if (langCode !== "und") {
      const lang = langs.where("3", langCode);
      this.language = lang && lang["1"] ? lang["1"] : "und"; // 2-letter code like 'en'
    } else {
      this.language = "und";
    }
  }

  next();
});

module.exports = mongoose.model("Post", postSchema);
