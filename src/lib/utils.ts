// Constants
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 5000 // 5 seconds

// Helper function to check if error is a network error
export function isNetworkError(error: any) {
  return (
    error.message === 'Failed to fetch' ||
    error.message === 'Network request failed' ||
    error.code === 20 || // CORS error
    error.name === 'TypeError'
  )
}

// Helper function to retry failed requests
export async function handleRequest<T>(
  request: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_RETRY_DELAY
): Promise<T> {
  let lastError: any
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      return await request()
    } catch (error: any) {
      lastError = error

      // Only retry on network errors or 5xx server errors
      if (!isNetworkError(error) && !(error.status >= 500 && error.status < 600)) {
        throw error
      }

      retryCount++
      
      if (retryCount === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(2, retryCount - 1) + Math.random() * 100,
        MAX_RETRY_DELAY
      )

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}