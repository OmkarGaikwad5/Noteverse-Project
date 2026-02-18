import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  token: string;
  noteId: string;
  inviterId: mongoose.Types.ObjectId | string;
  email: string;
  permission: 'view' | 'edit';
  message?: string;
  accepted?: boolean;
  acceptedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const InviteSchema: Schema = new Schema({
  token: { type: String, required: true, index: true, unique: true },
  noteId: { type: String, required: true, index: true },
  inviterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, index: true },
  permission: { type: String, enum: ['view','edit'], default: 'view' },
  message: { type: String },
  accepted: { type: Boolean, default: false },
  acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);
