# Environment Variables

This document provides an overview of all environment variables used in the application.

## General Configuration

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# NextAuth
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"

# Next.js Configuration
ALLOWED_ORIGINS="localhost:3000,yourdomain.com" # Comma-separated list of allowed origins for server actions
```

## Email Configuration

```env
# Email notifications
EMAILS_TO_NOTIFY_CLOSE=admin@example.com,support@example.com
```

### EMAILS_TO_NOTIFY_CLOSE

This environment variable contains a comma-separated list of email addresses that will receive notifications when a service request is closed by the customer support team.

Example:
```
EMAILS_TO_NOTIFY_CLOSE=manager@jket.in,serviceteam@jket.in,admin@jket.in
```

The notification includes:
- Service request ID
- Machine details
- Customer information
- Type of issue
- Total cost
- Assigned engineer
- Link to the service request page

## MinIO Configuration

For local development, a MinIO container is used for file storage. In production, you would use your configured storage solution.

```env
# MinIO
MINIO_ENDPOINT="localhost" # Internal MinIO endpoint
MINIO_PORT="9090"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="service-attachments"
MINIO_USE_SSL="false" # Set to "true" for production with SSL

# MinIO Reverse Proxy (optional - for production deployments)
MINIO_PUBLIC_URL="https://yourdomain.com" # Public domain for presigned URLs
MINIO_PUBLIC_PATH="/media" # Proxy path for MinIO requests
```

## PDF Service Configuration

The PDF generation service is used for generating PDF documents such as warranty certificates.

```env
# PDF Service
PDF_SERVICE_URL="http://localhost:3002"
``` 