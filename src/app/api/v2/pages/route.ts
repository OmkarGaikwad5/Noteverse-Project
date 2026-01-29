
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Page from '@/models/Page';
import Notebook from '@/models/Notebook';

export async function POST(req: Request) {
    await dbConnect();
    try {
        const { notebookId, userId, pageIndex, layers } = await req.json();

        if (!notebookId || !userId || pageIndex === undefined) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Upsert the page
        const page = await Page.findOneAndUpdate(
            { notebookId, pageIndex },
            {
                userId,
                layers,
                $set: { serverUpdatedAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Update Notebook timestamp
        await Notebook.findByIdAndUpdate(notebookId, { updatedAt: new Date() });

        return NextResponse.json({ page }, { status: 200 });

    } catch (error) {
        console.error('Sync Page Error', error);
        return NextResponse.json({ message: 'Error syncing page' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const notebookId = searchParams.get('notebookId');
        const pageIndexParam = searchParams.get('pageIndex');

        if (!notebookId) {
            return NextResponse.json({ message: 'Missing notebookId' }, { status: 400 });
        }

        if (pageIndexParam !== null) {
            const pageIndex = parseInt(pageIndexParam, 10);
            if (isNaN(pageIndex)) {
                return NextResponse.json({ message: 'Invalid pageIndex' }, { status: 400 });
            }

            const page = await Page.findOne({ notebookId, pageIndex });
            if (!page) return NextResponse.json({ message: 'Page not found' }, { status: 404 });
            return NextResponse.json({ page }, { status: 200 });
        } else {
            const pages = await Page.find({ notebookId }).sort({ pageIndex: 1 });
            return NextResponse.json({ pages }, { status: 200 });
        }

    } catch (error) {
        console.error('Get Page Error', error);
        return NextResponse.json({ message: 'Error fetching page' }, { status: 500 });
    }
}
