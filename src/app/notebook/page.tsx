
'use client';
import dynamic from 'next/dynamic';
import React from 'react';


const Notebook = dynamic(() => import('@/components/Notebook'), { ssr: false });

function page() {
  return (
    <div>
        <Notebook/>
    </div>
  )
}

export default page