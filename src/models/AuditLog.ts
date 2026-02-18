import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  noteId?: string;
  action: string;
  userId?: mongoose.Types.ObjectId | string;
  details?: any;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  noteId: { type: String, index: true },
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
