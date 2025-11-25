# --- BUILD STAGE ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependencias solo una vez
COPY package*.json ./
RUN npm install

# Copia el resto del proyecto
COPY . .

# Build de Next.js
RUN npm run build

# --- PRODUCTION STAGE ---
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Instala tsx (para db:init y db:seed dentro del contenedor)
RUN npm install -g tsx

# Copiamos solo lo necesario
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db ./src/db  
COPY --from=builder /app/src/lib ./src/lib

# Exponer puerto
EXPOSE 3000

CMD ["npm", "start"]
