# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --workspaces --include-workspace-root
COPY frontend ./frontend
COPY backend ./backend
COPY tools ./tools
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache postgresql-client
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm ci --omit=dev --workspaces --include-workspace-root && npm cache clean --force
COPY --from=build /app/frontend/dist ./frontend/dist
COPY backend ./backend
COPY deployment ./deployment
RUN mkdir -p /app/backend/backups && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node backend/scripts/migrate.js && node backend/src/server.js"]
