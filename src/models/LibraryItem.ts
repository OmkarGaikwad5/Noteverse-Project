import mongoose, { Schema, Document } from 'mongoose';

export interface ILibraryItem extends Document {
    userId: mongoose.Types.ObjectId;
    noteId: string;
    title: string;
    type: 'canvas' | 'note';
    content?: any; // Store the note content
    importedAt: Date;
}

const LibraryItemSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: String, ref: 'Note', required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['canvas', 'note'], required: true },
    content: { type: Schema.Types.Mixed, default: null }, // Store content
    importedAt: { type: Date, default: Date.now }
});

LibraryItemSchema.index({ userId: 1, noteId: 1 }, { unique: true });

export default mongoose.models.LibraryItem || mongoose.model<ILibraryItem>('LibraryItem', LibraryItemSchema);