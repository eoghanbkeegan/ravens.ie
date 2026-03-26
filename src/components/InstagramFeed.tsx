'use client'

import { useEffect } from 'react'

export default function InstagramFeed() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.curator.io/published/YOUR-FEED-ID.js'
    script.charset = 'UTF-8'
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-white">Follow the Ravens</h2>
        
         <a href="https://instagram.com/dublin_ravens_road_club"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ravens-muted text-sm hover:text-white transition-colors"
        >
          @dublin_ravens_road_club ↗
        </a>
      </div>
      <div id="curator-feed-default-feed-layout" />
    </div>
  )
}