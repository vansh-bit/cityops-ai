FROM node:20-slim

WORKDIR /app

# Copy workspace manifests first
COPY package*.json ./
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
COPY shared/package*.json shared/

# Install all workspace dependencies
RUN npm ci

# Copy the repository
COPY . .

# Build shared first, then backend
RUN npm run build -w shared
RUN npm run build -w backend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

WORKDIR /app/backend

CMD ["npm", "start"]