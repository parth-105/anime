'use client'
import { useState } from 'react'

export default function TestPage() {
  const [testResults, setTestResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const testVideo = async (url, name) => {
    setIsLoading(true)
    const results = []
    
    try {
      // Test 1: Check if URL is accessible
      const response = await fetch(url, { method: 'HEAD' })
      results.push({
        test: `${name} - URL Accessibility`,
        status: response.ok ? '✅ PASS' : '❌ FAIL',
        details: `Status: ${response.status}`
      })
    } catch (error) {
      results.push({
        test: `${name} - URL Accessibility`,
        status: '❌ FAIL',
        details: `Error: ${error.message}`
      })
    }

    // Test 2: Check if it's a valid HLS stream
    try {
      const response = await fetch(url)
      const content = await response.text()
      const isHLS = content.includes('#EXTM3U') || content.includes('#EXT-X-VERSION')
      results.push({
        test: `${name} - HLS Format`,
        status: isHLS ? '✅ PASS' : '❌ FAIL',
        details: isHLS ? 'Valid HLS manifest' : 'Not a valid HLS stream'
      })
    } catch (error) {
      results.push({
        test: `${name} - HLS Format`,
        status: '❌ FAIL',
        details: `Error: ${error.message}`
      })
    }

    setTestResults(prev => [...prev, ...results])
    setIsLoading(false)
  }

  const testAllVideos = async () => {
    setTestResults([])
    setIsLoading(true)
    
    const testUrls = [
      {
        url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
        name: 'Sintel Demo'
      },
      {
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        name: 'Mux Test 1'
      },
      {
        url: 'https://test-streams.mux.dev/test_001/stream.m3u8',
        name: 'Mux Test 2'
      }
    ]

    for (const test of testUrls) {
      await testVideo(test.url, test.name)
    }
    
    setIsLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Video Player Test Suite</h1>
      
      <div className="mb-6">
        <button 
          onClick={testAllVideos}
          disabled={isLoading}
          className="control-btn mr-4"
        >
          {isLoading ? 'Testing...' : 'Test All Video URLs'}
        </button>
        
        <button 
          onClick={() => setTestResults([])}
          className="control-btn"
        >
          Clear Results
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Results:</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-400">Click "Test All Video URLs" to start testing</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="card p-4 rounded">
              <div className="flex items-center justify-between">
                <span className="font-medium">{result.test}</span>
                <span className={result.status.includes('PASS') ? 'text-green-400' : 'text-red-400'}>
                  {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">{result.details}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Manual Testing:</h2>
        <div className="space-y-2">
          <p>1. Go to <a href="/" className="text-blue-400 underline">Home page</a> and click on a movie</p>
          <p>2. Try the video player controls:</p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
            <li>Click video to play/pause</li>
            <li>Use ◀ 10s and 10s ▶ buttons</li>
            <li>Try subtitle switching (if available)</li>
            <li>Use keyboard shortcuts: Space (play/pause), ← → (seek), N (next episode)</li>
          </ul>
          <p>3. Check browser console for any errors</p>
          <p>4. Test on different browsers (Chrome, Firefox, Safari)</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Common Issues & Solutions:</h2>
        <div className="space-y-2 text-sm">
          <div className="card p-3 rounded">
            <strong>Video not loading:</strong> Check if HLS.js is supported in your browser. Try refreshing the page.
          </div>
          <div className="card p-3 rounded">
            <strong>Autoplay blocked:</strong> Click the video to start playback manually.
          </div>
          <div className="card p-3 rounded">
            <strong>CORS errors:</strong> Some test streams may not work due to CORS policies.
          </div>
          <div className="card p-3 rounded">
            <strong>Network issues:</strong> Check your internet connection and try different test URLs.
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  robots: { index: false }
}