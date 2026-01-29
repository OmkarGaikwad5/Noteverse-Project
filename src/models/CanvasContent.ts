
import mongoose, { Schema, Document } from 'mongoose';

export interface ICanvasContent extends Document {
    noteId: string;
    data: {
        lines: [[Schema.Types.Mixed]],
        textBoxes: [[Schema.Types.Mixed]],
        shapes: [[Schema.Types.Mixed]][];
    };
    updatedAt: Date;
}

const LineSchema = new Schema({
    points: [Number],
    tool: { type: String, enum: ['pen', 'eraser'] },
    size: Number
}, { _id: false });

const TextBoxSchema = new Schema({
    id: String,
    x: Number,
    y: Number,
    text: String
}, { _id: false });

const ShapeSchema = new Schema({
    id: String,
    type: { type: String, enum: ['rectangle', 'circle', 'line'] },
    x: Number,
    y: Number,
    width: Number,
    height: Number
}, { _id: false });

const CanvasContentSchema: Schema = new Schema({
    noteId: { type: String, ref: 'Note', required: true, unique: true }, // Matches Note._id (String)
    data: {
        lines: [[LineSchema]],
        textBoxes: [[TextBoxSchema]],
        shapes: [[ShapeSchema]]
    },
    updatedAt: { type: Date, required: true }
});

export default mongoose.models.CanvasContent || mongoose.model<ICanvasContent>('CanvasContent', CanvasContentSchema);
