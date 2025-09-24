// This layout must be a Server Component to export metadata.
// We keep it as a client boundary-free file by not using client-only APIs.
export const metadata = {
  robots: { index: false }
}

export default function AdminLayout({ children }) {
  return children
}


