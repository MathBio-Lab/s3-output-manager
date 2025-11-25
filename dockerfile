# --- BUILD STAGE ---
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependencias
COPY package*.json ./
RUN npm install

# Copia el resto del proyecto
COPY . .

# Genera Prisma Client (OBLIGATORIO)
RUN npx prisma generate

# Build de Next.js
RUN npm run build

# --- PRODUCTION STAGE ---
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copiamos package.json para instalar SOLO prod deps
COPY package*.json ./

# Instala dependencias de producción
RUN npm install --omit=dev

# Copia la app ya compilada y el client prisma generado
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
