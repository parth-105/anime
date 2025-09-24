'use client'

import React from 'react'

export default function AnalyticsClient({ content = null }){
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const utm = { source: q.get('utm_source')||undefined, medium: q.get('utm_medium')||undefined, campaign: q.get('utm_campaign')||undefined }
    const base = () => ({
      ts: Date.now(),
      aid: undefined,
      type: 'pageview',
      path: window.location.pathname + window.location.search,
      utm,
      device: { w: window.innerWidth, h: window.innerHeight },
      content
    })

    const send = (events) => {
      navigator.sendBeacon?.('/api/analytics/collect', new Blob([JSON.stringify({ events })], { type: 'application/json' }))
    }

    // initial pageview
    send([ base() ])

    // heartbeat
    const interval = setInterval(() => {
      send([{ ...base(), type: 'heartbeat' }])
    }, 15000)

    const onVisibility = () => {
      if(document.visibilityState === 'hidden'){
        send([{ ...base(), type: 'exit' }])
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onVisibility)
    }
  }, [content])

  return null
}


