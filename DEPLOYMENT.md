# Production Deployment Instructions

This guide covers the complete deployment setup for the Vancouver application, including MinIO reverse proxy configuration for presigned URL uploads.

## Overview

The application uses MinIO for file storage and generates presigned URLs for direct client uploads. In production, MinIO is accessed through a reverse proxy to:
- Keep everything under the same domain (avoid CORS issues)
- Hide MinIO's internal port from external access
- Provide clean URLs like `yourdomain.com/media/file.jpg`
- Simplify SSL certificate management

## Prerequisites

- VM/Server with Docker installed
- Domain name pointed to your server
- SSL certificate (Let's Encrypt recommended)
- Web server (Nginx recommended)

## Step 1: Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="https://yourdomain.com"

# Next.js Configuration
ALLOWED_ORIGINS="yourdomain.com"

# Email Configuration
EMAILS_TO_NOTIFY_CLOSE="admin@yourdomain.com,support@yourdomain.com"

# MinIO Configuration (Internal)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9090"
MINIO_ACCESS_KEY="your-secure-access-key"
MINIO_SECRET_KEY="your-secure-secret-key"
MINIO_BUCKET_NAME="service-attachments"
MINIO_USE_SSL="false"

# MinIO Reverse Proxy Configuration
MINIO_PUBLIC_URL="https://yourdomain.com"
MINIO_PUBLIC_PATH="/media"

# PDF Service Configuration
PDF_SERVICE_URL="http://localhost:3002"
```

**Important Security Notes:**
- Replace `your-secret-key-here` with a strong random string
- Use secure MinIO credentials (not the default `minioadmin`)
- Keep the `.env` file secure and never commit it to version control

## Step 2: Docker Compose Setup

Update your `docker-compose.yml` to use environment variables:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-vancouver}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  minio:
    image: minio/minio
    command: server /data --console-address ":9091"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9090:9000"  # API
      - "9091:9091"  # Console (optional, for admin access)

  app:
    build: .
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - AUTH_URL=${AUTH_URL}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_PORT=${MINIO_PORT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
      - MINIO_USE_SSL=${MINIO_USE_SSL}
      - MINIO_PUBLIC_URL=${MINIO_PUBLIC_URL}
      - MINIO_PUBLIC_PATH=${MINIO_PUBLIC_PATH}
    ports:
      - "3000:3000"
    depends_on:
      - db
      - minio

volumes:
  postgres_data:
  minio_data:
```

## Step 3: Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/yourdomain.com`:

```nginx
upstream app {
    server localhost:3000;
}

upstream minio {
    server localhost:9090;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Main application
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # MinIO reverse proxy for presigned URL uploads
    location /media/ {
        # Remove /media prefix and proxy to MinIO
        rewrite ^/media/(.*)$ /$1 break;
        
        proxy_pass http://minio;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # S3-specific headers
        proxy_set_header Connection '';
        proxy_buffering off;
        
        # Handle preflight requests for CORS
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        # Add CORS headers for actual requests
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Increase upload limits
        client_max_body_size 100M;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

**Enable the site:**

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

## Step 5: Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Check if app is responding
curl -f http://localhost:3000/api/health || {
    echo "Health check failed!"
    docker-compose logs app
    exit 1
}

echo "Deployment completed successfully!"
echo "Application available at: https://yourdomain.com"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Step 6: Testing the Setup

### 1. Test Basic Application
```bash
curl -f https://yourdomain.com
```

### 2. Test Presigned URL Generation
```bash
curl -X POST https://yourdomain.com/api/media/presigned-url \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.jpg", "fileType": "image/jpeg"}'
```

### 3. Test File Upload (using presigned URL from step 2)
```bash
# Use the presignedUrl from the previous response
curl -X PUT "https://yourdomain.com/media/service-attachments/[object-name]?[query-params]" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test-image.jpg
```

## Step 7: Monitoring and Logs

### Check application logs:
```bash
docker-compose logs -f app
```

### Check MinIO logs:
```bash
docker-compose logs -f minio
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues:

1. **Presigned URLs still pointing to localhost**
   - Verify `MINIO_PUBLIC_URL` and `MINIO_PUBLIC_PATH` are set correctly
   - Restart the application after changing environment variables

2. **CORS errors on file upload**
   - Check Nginx CORS headers configuration
   - Ensure `ALLOWED_ORIGINS` includes your domain

3. **File upload timeouts**
   - Increase Nginx timeout values
   - Check MinIO container resources

4. **SSL issues**
   - Verify certificate paths in Nginx config
   - Check certificate expiry: `sudo certbot certificates`

### Useful Commands:

```bash
# Restart all services
docker-compose restart

# View MinIO console (optional)
# Access: https://yourdomain.com:9091 (if console port is exposed)

# Check environment variables
docker-compose exec app env | grep MINIO

# Reset MinIO data (WARNING: destroys all files)
docker-compose down -v
docker volume rm $(docker volume ls -q | grep minio)
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **MinIO Credentials**: Use strong, unique credentials for production
3. **Firewall**: Only expose ports 80, 443, and 22 (SSH) to the internet
4. **Regular Updates**: Keep Docker images and system packages updated
5. **Backup**: Implement regular backups of PostgreSQL and MinIO data
6. **Monitoring**: Set up monitoring for application and infrastructure health

## Backup Strategy

```bash
# Database backup
docker-compose exec db pg_dump -U postgres dbname > backup_$(date +%Y%m%d).sql

# MinIO backup
docker-compose exec minio mc mirror local/service-attachments s3/backup-bucket/
```

---

**Note**: Replace `yourdomain.com` with your actual domain name throughout this configuration.