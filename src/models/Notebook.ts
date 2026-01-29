
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotebook extends Document {
    userId: string;
    title: string;
    coverColor: string;
    type: 'canvas' | 'note';
    totalPages: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    serverUpdatedAt: Date;
}

const NotebookSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    coverColor: { type: String, default: '#3B82F6' }, // Royal Blue default
    type: { type: String, enum: ['canvas', 'note'], default: 'canvas' },
    totalPages: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    serverUpdatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Prevent overwrite during hot-reload
const Notebook = (mongoose.models.Notebook as Model<INotebook>) || mongoose.model<INotebook>('Notebook', NotebookSchema);

export default Notebook;
