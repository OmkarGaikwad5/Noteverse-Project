import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notebook from '@/models/Notebook';

export async function DELETE(req: Request) {
    await dbConnect();
    try {
        const url = new URL(req.url);
        const parts = url.pathname.split('/');
        const id = parts[parts.length - 1];

        if (!id) {
            return NextResponse.json({ message: 'Missing id' }, { status: 400 });
        }

        const notebook = await Notebook.findById(id);
        if (!notebook) {
            return NextResponse.json({ message: 'Not found' }, { status: 404 });
        }

        // Soft-delete
        notebook.isDeleted = true;
        await notebook.save();

        return NextResponse.json({ message: 'Deleted' }, { status: 200 });
    } catch (error) {
        console.error('Delete Notebook Error', error);
        return NextResponse.json({ message: 'Error deleting notebook' }, { status: 500 });
    }
}
