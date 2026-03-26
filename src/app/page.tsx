import dynamic from 'next/dynamic'

const JerseyViewer = dynamic(() => import('@/components/JerseyViewer'), {
  ssr: false, // Three.js is browser-only
})

export default function Home() {
  return (
    <main style={{ minHeight: '400vh', paddingTop: '10vh' }}>
      
    </main>
  )
}