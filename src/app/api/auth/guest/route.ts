
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST() {
    await dbConnect();

    try {
        const user = await User.create({ isGuest: true });
        return NextResponse.json({ userId: user._id });
    } catch (error) {
        console.error('Error creating guest user:', error);
        return NextResponse.json({ error: 'Failed to create guest user' }, { status: 500 });
    }
}
