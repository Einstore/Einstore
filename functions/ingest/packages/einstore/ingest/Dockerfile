FROM node:18-bullseye-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
