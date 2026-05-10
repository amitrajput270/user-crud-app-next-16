import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
    title: string;
    content: string;
    comments: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters'],
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
            minlength: [10, 'Content must be at least 10 characters'],
        },
        comments: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Add index for search performance
PostSchema.index({ name: 'text', email: 'text' });

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);