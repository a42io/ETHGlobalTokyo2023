# Dockerfile Best Practice Multi Stage Build Pattern

# ----------
# build stage
# ----------
FROM node:18-alpine3.15 as web
WORKDIR /web
COPY package*.json ./
COPY . .

RUN npm install && npm run build

# ----------
# runtime stage
# ----------
FROM node:18-alpine3.15
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=web /web/dist ./src
CMD [ "npm", "run", "start:prd"]
