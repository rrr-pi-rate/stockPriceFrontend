FROM node:22-alpine AS build
RUN apk add --no-cache openjdk21-jre-headless
WORKDIR /app
COPY package*.json openapitools.json ./
RUN npm ci
COPY . .
RUN npm run openapi
RUN npm run build

FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/stockPriceFrontend/browser /usr/share/nginx/html
EXPOSE 80
