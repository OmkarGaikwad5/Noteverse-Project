
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
    try {
        await dbConnect();

        // Check for token in cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('token');

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = jwt.verify(token.value, JWT_SECRET) as { userId: string, email: string };

        // Get user from DB (excluding password)
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isGuest: user.isGuest
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { message: 'Invalid token' },
            { status: 401 }
        );
    }
}
