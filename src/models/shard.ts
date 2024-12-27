import { Schema, model } from "mongoose";
import { fileSchema } from "./file";
import { dependencySchema } from "./dependency";
import { User } from "./user";
import { Comment } from "./comment";

const shardSchema = new Schema(
  {
    title: {
      type: String,
      default: "Untitled",
    },
    creator: {
      type: String,
    },
    isTemplate: {
      type: Boolean,
      required: true,
      default: false,
    },
    templateType: String,
    files: [fileSchema],
    dependencies: [dependencySchema],
    tags: [String],
    type: {
      type: String,
      default: "public",
      enum: ["public", "private", "forked"],
    },
    mode: {
      type: String,
      default: "normal",
      enum: ["normal", "collaboration"],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: "User",
    },
    commentThread: Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  },
);

shardSchema.pre("save", function (next) {
    if (this.isTemplate) {
      this.html = undefined;
      this.css = undefined;
      this.js = undefined;
    } else {
      this.templateType = undefined;
    }
  
    next();
});
  
export const Shard = model("Shard", shardSchema);
