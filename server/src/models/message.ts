import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      enum: ["text", "object_string"],
      required: true,
    },
    status: {
      type: String,
      enum: ["normal", "error"],
      default: "normal",
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        default: [],
      },
    ],
    followUps: [String],
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
