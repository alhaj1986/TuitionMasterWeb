# ─────────────────────────────────────────
# Stage 1 – Build the React / Vite app
# ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────
# Stage 2 – Serve with Nginx (production)
# ─────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (SPA-friendly routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
