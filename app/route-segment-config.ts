// This configuration forces all pages to be server-side rendered on every request
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';

// Disable data caching and revalidation
export const revalidate = 0;

// Disable static generation
export const generateStaticParams = undefined; 