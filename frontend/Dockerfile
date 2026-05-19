# Estágio 1: Compilar a aplicação Vue
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Injeta o URL relativo para a API (vantagem do Nginx)
ENV VITE_API_URL=/api
RUN npm run build

# Estágio 2: Servir os ficheiros com Nginx
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]