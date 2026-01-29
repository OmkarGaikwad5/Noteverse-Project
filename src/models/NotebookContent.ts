
import mongoose, { Schema, Document } from 'mongoose';

export interface INotebookContent extends Document {
    noteId: string;
    pages: string[][];
    updatedAt: Date;
}

const NotebookContentSchema: Schema = new Schema({
    noteId: { type: String, ref: 'Note', required: true, unique: true }, // Matches Note._id (String)
    pages: [[String]],
    updatedAt: { type: Date, required: true }
});

export default mongoose.models.NotebookContent || mongoose.model<INotebookContent>('NotebookContent', NotebookContentSchema);
