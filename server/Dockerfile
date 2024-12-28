FROM node:18-alpine
WORKDIR /usr/app
RUN mkdir -p /chroma/backup
COPY package*.json .
RUN npm install --force
COPY . .
EXPOSE 8080
EXPOSE 6969
CMD ["npm","start"]
