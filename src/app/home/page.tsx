'use client'
import React from 'react'
import dynamic from 'next/dynamic'

const NoteSelector = dynamic(() => import('@/components/NoteSelector'), {ssr: false});

function page() {
  return (
    <div>
        <NoteSelector/>
    </div>
  )
}

export default page