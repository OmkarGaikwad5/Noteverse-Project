
'use client';

import React from 'react';

interface NotebookCoverProps {
    title: string;
    coverColor: string;
    onClick: () => void;
}

export default function NotebookCover({ title, coverColor, onClick }: NotebookCoverProps) {
    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer flex flex-col items-center gap-2"
        >
            {/* Notebook Visual */}
            <div
                className="relative w-40 h-52 rounded-r-lg rounded-l-sm shadow-md transition-transform group-hover:-translate-y-1 group-hover:shadow-lg"
                style={{ backgroundColor: coverColor }}
            >
                {/* Spine */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10 rounded-l-sm z-10" />

                {/* Label Area */}
                <div className="absolute top-8 left-0 right-0 h-16 bg-white/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <span className="text-white font-serif italic text-lg opacity-90 px-2 truncate text-center w-full">
                        {title}
                    </span>
                </div>

                {/* Page Edges Effect */}
                <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-white/40 rounded-r-md" />
            </div>

            {/* Title Below */}
            <div className="text-center w-40">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                    {title}
                </h3>
            </div>
        </div>
    );
}
