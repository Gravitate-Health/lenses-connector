FROM node:22-slim

WORKDIR /app

# Instalar dependencias
COPY package.json package.json
RUN npm install

# Copiar el código fuente
COPY upload_jsons.js .
COPY json_urls.js .

# Comando para ejecutar el script
CMD ["node", "upload_jsons.js"]