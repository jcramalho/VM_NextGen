# 1. Escolha de uma imagem estável e leve do Node.js
FROM node:22-alpine

# 2. Definição do diretório de trabalho dentro do contentor
WORKDIR /app

# 3. Copiar apenas os ficheiros de dependências primeiro
# Isto aproveita a cache do Docker e acelera os builds seguintes se os pacotes não mudarem
COPY package*.json ./

# 4. Instalar as dependências do Node.js
RUN npm install

# 5. Copiar o resto do código fonte da API para o contentor
COPY . .

# 6. Expor a porta em que o Express está configurado para correr (50520)
EXPOSE 50520

# 7. Comando para iniciar a API
CMD ["npm", "start"]