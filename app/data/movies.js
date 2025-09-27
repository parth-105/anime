// Comprehensive entertainment content library
export const contentTypes = {
  movie: { name: 'Movies', icon: '🎬', color: 'blue' },
  series: { name: 'TV Series', icon: '📺', color: 'green' },
  webseries: { name: 'Web Series', icon: '💻', color: 'purple' },
  kdrama: { name: 'K-Drama', icon: '🇰🇷', color: 'pink' },
  anime: { name: 'Anime', icon: '🎌', color: 'orange' },
  drama: { name: 'Drama', icon: '🎭', color: 'red' },
  documentary: { name: 'Documentary', icon: '📚', color: 'yellow' },
  reality: { name: 'Reality TV', icon: '📹', color: 'indigo' },
  comedy: { name: 'Comedy', icon: '😂', color: 'lime' },
  'top-rated': { name: 'Top Rated', icon: '⭐', color: 'gold' },
  trending: { name: 'Trending', icon: '🔥', color: 'red' }
}

export const genres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western', 'Reality', 'Talk Show'
]

export const library = [
//   {
//     id: 'm1',
//     type: 'movie',
//     title: 'Sintel',
//     year: 2010,
//     duration: 888,
//     genre: ['Animation', 'Adventure', 'Fantasy'],
//     rating: 8.2,
//     description: 'An open-source animated short film about a girl named Sintel who searches for a baby dragon.',
//     poster: 'https://i.imgur.com/8Km9tLL.jpg',
//     trailer: 'https://example.com/trailer1',
//     cast: ['Sintel (Character)', 'Dragon (Character)'],
//     director: 'Colin Levy',
//     country: 'Netherlands',
//     language: 'English',
//     sources: [
//       {
//         quality: 'hls_master',
//         src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
//         subtitles: [
//           { lang: 'en', label: 'English', src: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt' },
//           { lang: 'es', label: 'Spanish', src: 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_es.vtt' }
//         ]
//       }
//     ]
//   },
//   {
//     id: 's1',
//     type: 'series',
//     title: 'Demo Series',
//     year: 2023,
//     genre: ['Drama', 'Thriller'],
//     rating: 7.8,
//     description: 'A gripping drama series exploring complex relationships and modern life challenges.',
//     poster: 'https://i.imgur.com/3GvwNBf.jpg',
//     cast: ['John Doe', 'Jane Smith', 'Mike Johnson'],
//     director: 'Sarah Wilson',
//     country: 'USA',
//     language: 'English',
//     seasons: [
//       {
//         season: 1,
//         episodes: [
//           {
//             id: 's1-e1',
//             title: 'Episode 1: Pilot',
//             duration: 2400,
//             src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
//             subtitles: [
//               { lang: 'en', label: 'English', src: 'https://demo-subtitles.s3.amazonaws.com/episode1-en.vtt' }
//             ]
//           },
//           {
//             id: 's1-e2',
//             title: 'Episode 2: The Plot Thickens',
//             duration: 2520,
//             src: 'https://test-streams.mux.dev/test_001/stream.m3u8',
//             subtitles: []
//           }
//         ]
//       },
//       {
//         season: 2,
//         episodes: [
//           {
//             id: 's2-e1',
//             title: 'Episode 1: New Beginnings',
//             duration: 2460,
//             src: 'https://test-streams.mux.dev/bbb-abr/bbb.m3u8',
//             subtitles: []
//           },
//           {
//             id: 's2-e2',
//             title: 'Episode 2: Rising Tension',
//             duration: 2505,
//             src: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
//             subtitles: []
//           }
//         ]
//       }
//     ]
//   },
//   {
//     id: 'kd1',
//     type: 'kdrama',
//     title: 'Crash Landing on You',
//     year: 2019,
//     genre: ['Romance', 'Drama', 'Comedy'],
//     rating: 9.1,
//     description: 'A South Korean heiress crash-lands in North Korea and falls in love with a North Korean officer.',
//     poster: 'https://i.imgur.com/8Km9tLL.jpg',
//     cast: ['Hyun Bin', 'Son Ye-jin'],
//     director: 'Lee Jung-hyo',
//     country: 'South Korea',
//     language: 'Korean',
//     seasons: [
//       {
//         season: 1,
//         episodes: [
//           {
//             id: 'kd1-e1',
//             title: 'Episode 1',
//             duration: 3600,
//             src: 'https://test-streams.mux.dev/kdrama1.m3u8',
//             subtitles: [
//               { lang: 'ko', label: 'Korean', src: 'https://demo-subtitles.s3.amazonaws.com/kdrama1-ko.vtt' },
//               { lang: 'en', label: 'English', src: 'https://demo-subtitles.s3.amazonaws.com/kdrama1-en.vtt' }
//             ]
//           }
//         ]
//       }
//     ]
//   },
//   {
//     id: 'anime1',
//     type: 'anime',
//     title: 'Attack on Titan',
//     year: 2013,
//     genre: ['Action', 'Drama', 'Fantasy'],
//     rating: 9.5,
//     description: 'Humanity fights for survival against the Titans, giant humanoid creatures that devour humans.',
//     poster: 'https://i.imgur.com/3GvwNBf.jpg',
//     cast: ['Yuki Kaji', 'Yui Ishikawa', 'Marina Inoue'],
//     director: 'Tetsurō Araki',
//     country: 'Japan',
//     language: 'Japanese',
//     seasons: [
//       {
//         season: 1,
//         episodes: [
//           {
//             id: 'anime1-e1',
//             title: 'To You, in 2000 Years',
//             duration: 1440,
//             src: 'https://test-streams.mux.dev/anime1.m3u8',
//             subtitles: [
//               { lang: 'ja', label: 'Japanese', src: 'https://demo-subtitles.s3.amazonaws.com/anime1-ja.vtt' },
//               { lang: 'en', label: 'English', src: 'https://demo-subtitles.s3.amazonaws.com/anime1-en.vtt' }
//             ]
//           }
//         ]
//       }
//     ]
//   },
//   {
//     id: 'web1',
//     type: 'webseries',
//     title: 'The Office (Web Series)',
//     year: 2021,
//     genre: ['Comedy', 'Mockumentary'],
//     rating: 8.7,
//     description: 'A mockumentary sitcom about the everyday lives of office employees.',
//     poster: 'https://i.imgur.com/8Km9tLL.jpg',
//     cast: ['Steve Carell', 'John Krasinski', 'Jenna Fischer'],
//     director: 'Greg Daniels',
//     country: 'USA',
//     language: 'English',
//     seasons: [
//       {
//         season: 1,
//         episodes: [
//           {
//             id: 'web1-e1',
//             title: 'Pilot',
//             duration: 1800,
//             src: 'https://test-streams.mux.dev/webseries1.m3u8',
//             subtitles: [
//               { lang: 'en', label: 'English', src: 'https://demo-subtitles.s3.amazonaws.com/webseries1-en.vtt' }
//             ]
//           }
//         ]
//       }
//     ]
//   }
]


