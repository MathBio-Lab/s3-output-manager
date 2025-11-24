# --- Etapa de build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generar build de Next.js
RUN npm run build

# --- Etapa de producción ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
RUN npm install -g serve

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]
