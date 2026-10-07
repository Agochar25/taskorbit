FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./package.json
COPY web/package.json ./web/package.json
COPY shared ./shared
COPY backend ./backend
RUN npm install --workspace backend --workspace shared
WORKDIR /app/backend
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/server.js"]
