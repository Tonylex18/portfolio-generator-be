FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Debug: list files in src
RUN ls -l src
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]