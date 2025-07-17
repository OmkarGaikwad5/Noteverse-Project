'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'

const Bin = dynamic(() => import('@/components/Bin'), { ssr: false })

function Page() {
    useEffect(() => {
        document.title = "Bin - NoteVerse";
    }, []);
    return (
        <div>
            <Bin />
        </div>
    )
}

export default Page