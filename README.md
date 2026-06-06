# 🐳 Dockerized Node.js Service Deployment via GitHub Actions

[![Deploy to Server](https://github.com/your-repo/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-repo/actions/workflows/deploy.yml)

Ce projet démontre l’intégration continue et le déploiement (CI/CD) d’un service Node.js sécurisé :

- Application Node.js avec une route publique (`/`) et une route protégée par Basic Auth (`/secret`).
- Conteneurisation avec Docker.
- Déploiement automatisé sur un serveur Linux distant (AWS EC2, DigitalOcean, etc.).
- Pipeline CI/CD avec **GitHub Actions**.
- Gestion des secrets via variables d’environnement et **GitHub Secrets**.

📌 **Référence du projet** : [roadmap.sh - Dockerized Service Deployment](https://roadmap.sh/projects/dockerized-service-deployment)

---

## 📁 Structure du projet
Dockerized-Service/
├── app.js
├── package.json
├── .env # (non versionné)
├── .gitignore
├── Dockerfile
└── .github/workflows/deploy.yml


---

## 1️⃣ Partie 1 – Service Node.js

### 1.1 `app.js`

```javascript
require('dotenv').config();
const express = require('express');
const app = express();

const port = 3000;
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const secretMessage = process.env.SECRET_MESSAGE;

// Middleware Basic Auth
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

  if (user === username && pass === password) return next();
  res.status(403).send('Invalid credentials.');
}

app.get('/', (req, res) => res.send('Hello, world!'));
app.get('/secret', auth, (req, res) => res.send(secretMessage));

app.listen(port, () => console.log(`Listening on port ${port}`));

**package.json**
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

**.env**
SECRET_MESSAGE=This is the secret!
USERNAME=admin
PASSWORD=changeme

**.gitignore**
node_modules/
.env

**Local test**
npm install
npm start

**Dockerfile**
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

docker build -t node-secret-service .
docker run --env-file .env -p 3000:3000 node-secret-service

**Access your remote server**
ssh -i "votre-cle.pem" ubuntu@<IP_PUBLIQUE>
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker


Settings → Secrets and variables → Actions
Nom du secret	Description
DOCKERHUB_USERNAME	Username Docker Hub
DOCKERHUB_TOKEN	Token d’accès Docker Hub
SERVER_IP	server public IP
SERVER_USER	User SSH (ex: ubuntu)
SERVER_SSH_KEY	Private key (contain .pem)
USERNAME	username for Basic Auth
PASSWORD	Password for Basic Auth
SECRET_MESSAGE


**Workflow GitHub Actions**

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
            docker run -d --env-file .env -p 3000:3000 --name node-secret-service \
              ${{ secrets.DOCKERHUB_USERNAME }}/node-secret-service:latest



http://<IP_DU_SERVEUR>:3000 → Must display Hello, world!
 
http://<IP_DU_SERVEUR>:3000/secret → Enter credentials define in Secret git (USERNAME / PASSWORD) 

Project URL: https://roadmap.sh/projects/dockerized-service-deployment
