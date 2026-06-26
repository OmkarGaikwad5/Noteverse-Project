import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICanvasContent extends Document {
    noteId: string;
    data: {
        lines: any[][];
        textBoxes: any[][];
        shapes: any[][];
        stickyNotes: any[][];
        background: string;
    };
    updatedAt: Date;
}

// Define sub-schemas
const LineDataSchema = new Schema({
    points: [Number],
    tool: { type: String, enum: ['pen', 'highlighter', 'eraser'] },
    color: String,
    size: Number,
    opacity: Number
}, { _id: false });

const TextBoxDataSchema = new Schema({
    id: String,
    x: Number,
    y: Number,
    text: String,
    fontSize: Number,
    fontFamily: String,
    fill: String,
    align: { type: String, enum: ['left', 'center', 'right'] },
    bold: Boolean,
    italic: Boolean,
    underline: Boolean,
    width: Number,
    draggable: Boolean,
    isEditing: Boolean
}, { _id: false });

const ShapeDataSchema = new Schema({
    id: String,
    type: { type: String, enum: ['rectangle', 'circle', 'line', 'arrow', 'triangle', 'star'] },
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    fill: String,
    stroke: String,
    strokeWidth: Number,
    rotation: Number,
    draggable: Boolean
}, { _id: false });

const StickyNoteDataSchema = new Schema({
    id: String,
    x: Number,
    y: Number,
    text: String,
    color: String,
    width: Number,
    height: Number
}, { _id: false });

const CanvasContentSchema = new Schema({
    noteId: { type: String, ref: 'Note', required: true, unique: true },
    data: {
        lines: {
            type: [[LineDataSchema]],
            default: [[]]
        },
        textBoxes: {
            type: [[TextBoxDataSchema]],
            default: [[]]
        },
        shapes: {
            type: [[ShapeDataSchema]],
            default: [[]]
        },
        stickyNotes: {
            type: [[StickyNoteDataSchema]],
            default: [[]]
        },
        background: {
            type: String,
            default: '#ffffff'
        }
    },
    updatedAt: { type: Date, required: true }
});

// Remove pre-save middleware and handle defaults in API

const CanvasContent = (mongoose.models.CanvasContent as Model<ICanvasContent>) || 
    mongoose.model<ICanvasContent>('CanvasContent', CanvasContentSchema);

export default CanvasContent;