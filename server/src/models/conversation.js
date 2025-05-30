import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      default: '新对话'
    },
  },
  { 
    timestamps: true 
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;