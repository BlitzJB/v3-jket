export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up E2E test environment...\n')

  // Cleanup happens in individual test afterEach hooks
  // This is just for final cleanup
  console.log('✓ E2E test environment cleaned up\n')
}
