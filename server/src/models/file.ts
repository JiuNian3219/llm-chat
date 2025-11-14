import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    originalname: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    isImage: {
      type: Boolean,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      index: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);

export default File;
