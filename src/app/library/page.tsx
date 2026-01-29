
import React from 'react';
import NotebookGrid from '@/components/Library/NotebookGrid';
import LegacyNotesMigration from '@/components/Library/LegacyNotesMigration';

export default function LibraryPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto pt-8 px-8">
                <LegacyNotesMigration />
            </div>
            <NotebookGrid />
        </div>
    );
}
