# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY scripts/vendor.mjs ./scripts/vendor.mjs
COPY tests ./tests
COPY dist ./dist
RUN npm run build && npm test

FROM nginx:stable-alpine AS runtime
LABEL org.opencontainers.image.title="Vector Studio" \
      org.opencontainers.image.description="Browser-local raster to SVG editor" \
      org.opencontainers.image.source="https://github.com/wahid672/vector-studio"
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
