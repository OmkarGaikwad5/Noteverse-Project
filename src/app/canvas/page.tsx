'use client';
import dynamic from 'next/dynamic';
const CanvasBoard = dynamic(() => import('@/components/CanvasBoard'), { ssr: false });


function page() {
  return (
    <div>
        <CanvasBoard/>
    </div>
  )
}

export default page