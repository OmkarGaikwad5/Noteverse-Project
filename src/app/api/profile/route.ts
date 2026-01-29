import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Notebook from '@/models/Notebook';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // precise cookie extraction
        const cookieHeader = req.headers.get('cookie');
        const token = cookieHeader?.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        const user = await User.findById(decoded.userId).select('name email createdAt');
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Get stats
        const notesCount = await Notebook.countDocuments({ userId: user._id, type: { $ne: 'canvas' } });
        const canvasCount = await Notebook.countDocuments({ userId: user._id, type: 'canvas' });

        return NextResponse.json({
            user: {
                name: user.name || 'Guest User',
                email: user.email,
                joinedAt: user.createdAt
            },
            stats: {
                notes: notesCount,
                canvases: canvasCount
            }
        });

    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
