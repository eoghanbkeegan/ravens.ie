import dynamic from 'next/dynamic'

const JerseyViewer = dynamic(() => import('@/components/JerseyViewer'), {
  ssr: false, // Three.js is browser-only
})

export default function Home() {
  return (
    <main style={{ minHeight: '400vh', background: '#0f0f0f', paddingTop: '10vh' }}>
      <JerseyViewer />
    </main>
  )
}