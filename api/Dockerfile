# api/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Instalar TODO (incluyendo @prisma/client)
RUN npm install
RUN npm install @prisma/client@6.19.2

COPY . .

# Generar el cliente normalmente (se irá a node_modules)
RUN npx prisma@6.19.2 generate

EXPOSE 4000

CMD ["npm", "run", "dev"]