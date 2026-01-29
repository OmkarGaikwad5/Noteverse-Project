
import mongoose, { Schema, Document, Model } from 'mongoose';

// Define flexible layer data structures (can store Konva objects)
const LayerSchema = new Schema({
    lines: { type: Array, default: [] },
    shapes: { type: Array, default: [] },
    textBoxes: { type: Array, default: [] },
    images: { type: Array, default: [] },
}, { _id: false });

export interface IPage extends Document {
    notebookId: string;
    userId: string;
    pageIndex: number;
    layers: {
        lines: any[];
        shapes: any[];
        textBoxes: any[];
        images: any[];
    };
    thumbnailUrl?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    serverUpdatedAt: Date;
}

const PageSchema: Schema = new Schema({
    notebookId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    pageIndex: { type: Number, required: true },
    layers: { type: LayerSchema, default: {} },
    thumbnailUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
    serverUpdatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for efficient page retrieval
PageSchema.index({ notebookId: 1, pageIndex: 1 }, { unique: true });

const Page = (mongoose.models.Page as Model<IPage>) || mongoose.model<IPage>('Page', PageSchema);

export default Page;
