FROM node:20-slim AS build
WORKDIR /app
COPY package.json ./package.json
COPY shared ./shared
COPY web ./web
COPY backend/package.json ./backend/package.json
RUN npm install --workspace web --ignore-scripts
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace web

FROM nginx:1.27-alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
