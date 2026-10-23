#!/bin/bash
# StudyPilot EC2 bootstrap script (Amazon Linux 2023)
# Place this in EC2 User Data when launching the instance.

set -e

# Update and install packages
dnf update -y
dnf install -y httpd git nodejs npm

# Start & enable Apache
systemctl start httpd
systemctl enable httpd

# Clone the repository (replace YOUR_USERNAME)
cd /tmp
if [ -d studypilot-aws ]; then
  rm -rf studypilot-aws
fi
git clone https://github.com/YOUR_USERNAME/studypilot-aws.git
cd studypilot-aws

# Deploy frontend
cp -r frontend/* /var/www/html/

# Backend setup
cd backend
npm install --production

# Environment file — edit values after first boot if needed
cat > .env <<EOF
PORT=5000
AWS_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
S3_BUCKET=studypilot-notes-yourname
EOF

# Run backend with PM2
npm install -g pm2
pm2 start server.js --name studypilot-backend
pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Apache reverse proxy for /api
cat > /etc/httpd/conf.d/studypilot.conf <<'APACHE'
<VirtualHost *:80>
    DocumentRoot /var/www/html

    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:5000/api/
    ProxyPassReverse /api/ http://127.0.0.1:5000/api/

    # Optional: health endpoint proxy
    ProxyPass /health http://127.0.0.1:5000/health
    ProxyPassReverse /health http://127.0.0.1:5000/health
</VirtualHost>
APACHE

# Enable required Apache modules (usually already present on Amazon Linux)
# LoadModule proxy_module ... is typically handled by package

systemctl restart httpd

echo "StudyPilot bootstrap complete."
