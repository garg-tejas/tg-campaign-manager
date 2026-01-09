export async function register() {
  // Only run worker on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startWorker } = await import('./lib/worker')
  }
}
