// models/Invite.ts
import mongoose from 'mongoose';

const InviteSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  noteId: {
    type: mongoose.Schema.Types.Mixed, // Changed to Mixed to handle both ObjectId and String
    required: true,
    index: true,
  },
  inviterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  permission: {
    type: String,
    enum: ['view', 'edit'],
    default: 'view',
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Invite || mongoose.model('Invite', InviteSchema);