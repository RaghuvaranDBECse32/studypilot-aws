# StudyPilot — AI Study Companion

**Alexa-style AI study companion** built with Amazon EC2, Apache, Amazon Bedrock, Amazon S3, IAM, and EBS.

Students paste their own lecture notes and receive:
- A 5-point revision summary + 90-minute study plan (**Revise today**)
- Five practice questions with answers (**Make quiz**)
- A plain-English explanation of the hardest concept (**Explain simply**)

Notes are stored privately in S3. The app runs on EC2 with Apache reverse-proxying the Node.js backend.

---

## Architecture

```
Student → Classic Load Balancer (HTTP :80)
              ├── EC2 Instance 1 (Apache + Node.js)
              └── EC2 Instance 2 (Apache + Node.js)
                        │
                        ▼
                   Amazon Bedrock
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
         Amazon S3            Amazon EBS
     (private notes)     (persistent disk)
```

**Security**
- Port 80 open to the world (Apache)
- Port 22 (SSH) restricted to your IP
- EC2 IAM role grants `bedrock:InvokeModel` and `s3:PutObject` only — **no AWS keys in code**

---

## Project Structure

```
studypilot-aws/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── bedrock.js
│   ├── s3.js
│   └── package.json
├── scripts/
│   └── user-data.sh
├── docs/
├── LICENSE
└── README.md
```

---

## Quick Start (Local Development)

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # create and fill values
   npm start
   ```

2. **Frontend**  
   Serve the `frontend/` folder with any static server, or open `index.html` after pointing API calls to `http://localhost:5000`.

---

## AWS Deployment (EWB-style)

### 1. Create GitHub repo
Push this repository to `https://github.com/YOUR_USERNAME/studypilot-aws`.

### 2. Launch EC2
| Setting        | Value                                          |
|----------------|------------------------------------------------|
| Name           | studypilot-server-1                            |
| AMI            | Amazon Linux 2023                              |
| Instance type  | t2.micro / t3.micro                            |
| Key pair       | studypilot-key.pem                             |
| Root volume    | 8 GB (EBS)                                     |
| Security group | SSH 22 from My IP · HTTP 80 from Anywhere      |

Paste the contents of `scripts/user-data.sh` into **User data** (replace `YOUR_USERNAME` and bucket name).

### 3. IAM Role
Attach an EC2 instance role with:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::YOUR_PRIVATE_BUCKET/notes/*"
    }
  ]
}
```

### 4. Private S3 Bucket
```bash
aws s3 mb s3://studypilot-notes-yourname --region ap-south-1
```
Keep **Block Public Access** enabled.

### 5. Bedrock Model Access
In the Bedrock console, request access to Claude 3 Haiku (or the model ID you set in `.env`).

### 6. Apache Reverse Proxy
The user-data script creates `/etc/httpd/conf.d/studypilot.conf`.  
If you configure manually:

```apache
<VirtualHost *:80>
    DocumentRoot /var/www/html
    ProxyPreserveHost On
    ProxyPass /api/ http://127.0.0.1:5000/api/
    ProxyPassReverse /api/ http://127.0.0.1:5000/api/
</VirtualHost>
```

### 7. Test
Open `http://YOUR_EC2_PUBLIC_IP` (or Elastic IP / Load Balancer DNS).

---

## Load Balancer (optional, after core demo works)

1. Launch a second identical EC2 instance.
2. Create a **Classic Load Balancer**:
   - Listener: HTTP 80 → instance port 80
   - Health check: `/index.html` or `/health` on port 80
   - Register both instances

---

## Environment Variables

| Variable          | Description                          | Example                                      |
|-------------------|--------------------------------------|----------------------------------------------|
| `PORT`            | Backend port                         | `5000`                                       |
| `AWS_REGION`      | AWS region                           | `ap-south-1`                                 |
| `BEDROCK_MODEL_ID`| Bedrock model ID                     | `anthropic.claude-3-haiku-20240307-v1:0`     |
| `S3_BUCKET`       | Private notes bucket                 | `studypilot-notes-yourname`                  |

---

## Cost-Safe Cleanup

- Stop / terminate EC2 when finished
- Release unassociated Elastic IPs (they incur hourly charges)
- Delete test objects from S3
- Delete unused EBS volumes

---

## Submission Notes

**EWB Project Title**  
StudyPilot — AI Study Companion Deployed on AWS EC2 with S3 and Bedrock

**Devpost Tracks**  
- Primary: Alexa+ (simulated experience)  
- Mini challenge: AWS Builder

---

## License

MIT
