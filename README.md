Dockerized Node.js Service Deployment via GitHub Actions
📌 Project Overview
This project demonstrates:

Building a simple Node.js service with protected routes.
Dockerizing the service for portability.
Deploying to a remote Linux server (AWS/DigitalOcean/etc.).
Automating the build & deploy process with GitHub Actions.
Managing sensitive values securely via environment variables & GitHub Secrets.

1️⃣ Part 1 — Create the Node.js Service
1.1 Project Structure
Dockerized-Service/
│
├── app.js
├── package.json
├── .env           # Not committed to git
├── .gitignore
└── Dockerfile

1.2 app.js
require('dotenv').config();
const express = require('express');
const app = express();

const port = 3000;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const secretMessage = process.env.SECRET_MESSAGE;

// Middleware for Basic Auth
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic');
    return res.status(401).send('Authentication required.');
  }

  const [scheme, encoded] = authHeader.split(' ');
  if (scheme !== 'Basic') return res.status(400).send('Bad request.');

  const decoded = Buffer.from(encoded, 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user === username && pass === password) {
    return next();
  }
  res.status(403).send('Invalid credentials.');
}

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/secret', auth, (req, res) => {
  res.send(secretMessage);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

1.3 package.json
{
  "name": "node-secret-service",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "dotenv": "^17.0.0",
    "express": "^4.18.2"
  }
}

1.4 .env
SECRET_MESSAGE=This is the secret!
USERNAME=admin
PASSWORD=changeme

1.5 .gitignore
node_modules/
.env

1.6 Test Locally
npm install
npm start
Visit:

http://localhost:3000 → Hello, world!
http://localhost:3000/secret → prompts for Basic Auth.

2️⃣ Part 2 — Dockerizing the Node.js Service
2.1 Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

2.2 Build & Run Locally
docker build -t node-secret-service .
docker run --env-file .env -p 3000:3000 node-secret-service

3️⃣ Part 3 — Setup Remote Linux Server
Example with AWS EC2 (Ubuntu):

ssh -i "key.pem" ubuntu@<EC2_PUBLIC_IP>

sudo apt update && sudo apt upgrade -y
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker

4️⃣ Part 4 — Deploy via GitHub Actions
We’ll:

Build the Docker image in GitHub Actions.
Push to Docker Hub (or GHCR).
SSH into the server & run the container.

4.1 Store GitHub Secrets
In your GitHub repo:
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
SERVER_IP
SERVER_USER
SERVER_SSH_KEY (private key)
USERNAME (for app auth)
PASSWORD (for app auth)
SECRET_MESSAGE

4.2 .github/workflows/deploy.yml
name: Deploy Dockerized Node.js Service

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.DOCKERHUB_USERNAME }}/node-secret-service:latest .
          docker push ${{ secrets.DOCKERHUB_USERNAME }}/node-secret-service:latest

      - name: Deploy to remote server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKERHUB_USERNAME }}/node-secret-service:latest
            docker stop node-secret-service || true
            docker rm node-secret-service || true
            echo "USERNAME=${{ secrets.USERNAME }}" > .env
            echo "PASSWORD=${{ secrets.PASSWORD }}" >> .env
            echo "SECRET_MESSAGE=${{ secrets.SECRET_MESSAGE }}" >> .env
            docker run -d --env-file .env -p 3000:3000 --name node-secret-service ${{ secrets.DOCKERHUB_USERNAME }}/node-secret-service:latest
✅ Verification
After pushing to main, the GitHub Action will:

Build & push the Docker image to Docker Hub.
SSH into your server.
Pull the latest image & run it with secrets from .env.
Visit:

http://<SERVER_IP>:3000
http://<SERVER_IP>:3000/secret  (with Basic Auth)
📜 Summary
We’ve:

Built a secure Node.js API with Basic Auth.
Dockerized it without leaking .env.
Set up a remote server.
Automated deployment with GitHub Actions.
Managed secrets securely via GitHub Secrets.

https://roadmap.sh/projects/dockerized-service-deployment
