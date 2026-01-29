
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    email?: string;
    password?: string;
    isGuest: boolean;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    isGuest: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
