import { ClerkProvider, SignIn, useAuth } from '@clerk/react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import BooksPage from '@/pages/BooksPage'
import BookDetailPage from '@/pages/BookDetailPage'
import AIPage from '@/pages/AIPage'
import StatsPage from '@/pages/StatsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
})

// 로그인 안 된 상태면 /sign-in 으로 보내는 래퍼
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return (
    <div className="h-screen flex items-center justify-center text-gray-400">
      로딩 중...
    </div>
  )
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/sign-in/*',
    element: (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" />
      </div>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <BooksPage /> },
      { path: 'books/:id', element: <BookDetailPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'ai', element: <AIPage /> },
    ],
  },
])

export default function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}
