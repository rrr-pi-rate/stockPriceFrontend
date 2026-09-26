FROM node:22-alpine AS build
RUN apk add --no-cache openjdk21-jre-headless
WORKDIR /app
COPY package*.json openapitools.json ./
COPY patches ./patches
RUN npm ci
COPY . .
RUN npm run openapi
RUN npm run build

FROM nginx:alpine AS final
ENV BACKEND_BASE_URL=http://192.168.1.239:5151
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/stockPriceFrontend/browser /usr/share/nginx/html
EXPOSE 80
