'use client'

import { useState, useEffect } from 'react'

export default function TestBackendPage() {
  const [status, setStatus] = useState<string>('Loading...')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetch('http://localhost:8000/health')
      .then(res => res.json())
      .then(data => {
        setStatus('Backend connected: ' + JSON.stringify(data))
      })
      .catch(err => {
        setError('Direct connection failed: ' + err.message)
      })

    // Test through Next.js proxy
    fetch('/api/backend/health')
      .then(res => res.json())
      .then(data => {
        setStatus(prev => prev + ' | Proxy: ' + JSON.stringify(data))
      })
      .catch(err => {
        setError(prev => prev + ' | Proxy failed: ' + err.message)
      })
  }, [])

  return (
    <div className="p-8">
      <h1>Backend Connection Test</h1>
      <p>Status: {status}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  )
}
