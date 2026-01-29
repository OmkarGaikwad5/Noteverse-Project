
import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document<string> {
    _id: string; // Override _id to be string
    userId: mongoose.Types.ObjectId;
    title: string;
    type: 'canvas' | 'notebook';
    isDeleted: boolean;
    updatedAt: Date;
    serverUpdatedAt: Date;
    createdAt: Date;
}

const NoteSchema: Schema = new Schema({
    _id: { type: String, required: true }, // Client-side generated ID
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, default: 'Untitled' },
    type: { type: String, enum: ['canvas', 'notebook'], required: true },
    isDeleted: { type: Boolean, default: false },
    updatedAt: { type: Date, required: true },
    serverUpdatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

NoteSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
