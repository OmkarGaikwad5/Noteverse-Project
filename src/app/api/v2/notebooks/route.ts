
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { userId, title, coverColor, type } = await req.json();
        if (!userId || !title) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const notebook = await Notebook.create({
            userId,
            title,
            coverColor,
            type: type || 'canvas'
        });

        return NextResponse.json({ notebook }, { status: 201 });
    } catch (error) {
        console.error('Create Notebook Error', error);
        return NextResponse.json({ message: 'Error creating notebook' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
        }

        const notebooks = await Notebook.find({ userId, isDeleted: false }).sort({ updatedAt: -1 });
        return NextResponse.json({ notebooks }, { status: 200 });
    } catch (error) {
        console.error('List Notebooks Error', error);
        return NextResponse.json({ message: 'Error listing notebooks' }, { status: 500 });
    }
}
