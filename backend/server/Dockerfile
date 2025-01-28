# FROM node:23-alpine
FROM oven/bun:alpine
WORKDIR /usr/app
RUN mkdir -p /chroma/backup
COPY package*.json .
RUN bun install --force
# RUN npm install -g nodemon 
COPY . .
EXPOSE 8080
# EXPOSE 6969
CMD ["bun","run", "start"]
# CMD ["npm","run","dev"]
