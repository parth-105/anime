/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'bitdash-a.akamaihd.net' },
      { protocol: 'https', hostname: 'test-streams.mux.dev' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' }
    ]
  }
}

module.exports = nextConfig


