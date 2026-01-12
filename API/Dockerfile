FROM node:20-bookworm-slim

ARG APKTOOL_VERSION=2.12.1
ARG BUNDLETOOL_VERSION=1.18.3
ARG BUILD_TOOLS_VERSION=36.1.0
ARG BUILD_TOOLS_ZIP=build-tools_r36.1_linux.zip

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    unzip \
    zip \
    openjdk-17-jre-headless \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /opt/android/build-tools \
  && curl -fsSL -o /tmp/build-tools.zip \
    https://dl.google.com/android/repository/${BUILD_TOOLS_ZIP} \
  && unzip -q /tmp/build-tools.zip -d /opt/android/build-tools \
  && rm /tmp/build-tools.zip \
  && AAPT2_PATH=$(find /opt/android/build-tools -type f -name aapt2 | head -n 1) \
  && test -n "$AAPT2_PATH" \
  && cp "$AAPT2_PATH" /usr/local/bin/aapt2 \
  && chmod +x /usr/local/bin/aapt2

RUN mkdir -p /usr/local/lib/apktool \
  && curl -fsSL -o /usr/local/lib/apktool/apktool.jar \
    https://github.com/iBotPeaches/Apktool/releases/download/v${APKTOOL_VERSION}/apktool_${APKTOOL_VERSION}.jar \
  && curl -fsSL -o /usr/local/bin/apktool \
    https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool \
  && chmod +x /usr/local/bin/apktool

RUN mkdir -p /usr/local/lib/bundletool \
  && curl -fsSL -o /usr/local/lib/bundletool/bundletool.jar \
    https://github.com/google/bundletool/releases/download/${BUNDLETOOL_VERSION}/bundletool-all-${BUNDLETOOL_VERSION}.jar \
  && printf '%s\n' '#!/bin/sh' 'exec java -jar /usr/local/lib/bundletool/bundletool.jar "$@"' \
    > /usr/local/bin/bundletool \
  && chmod +x /usr/local/bin/bundletool

ENV AAPT_PATH=/usr/local/bin/aapt2

WORKDIR /app

# Build auth + teams submodule dependencies
COPY Libraries/rafiki-auth ./Libraries/rafiki-auth
COPY Libraries/teams ./Libraries/teams
WORKDIR /app/Libraries/rafiki-auth
RUN npm install && npm run build
WORKDIR /app/Libraries/teams
RUN npm install && npm run build

# Copy feature flags dependency (no build step)
WORKDIR /app
COPY Libraries/feature-flags ./Libraries/feature-flags

# Install API dependencies
WORKDIR /app/API
COPY API/package.json API/package-lock.json* ./
RUN npm install

COPY API/prisma ./prisma
COPY API/tsconfig.json ./
COPY API/src ./src

RUN rm -rf node_modules/@unlikeother/auth/dist \
  && mkdir -p node_modules/@unlikeother/auth/dist \
  && cp -R /app/Libraries/rafiki-auth/dist/* node_modules/@unlikeother/auth/dist/
RUN rm -rf node_modules/@rafiki270/teams/dist \
  && mkdir -p node_modules/@rafiki270/teams/dist \
  && cp -R /app/Libraries/teams/dist/* node_modules/@rafiki270/teams/dist/

RUN npm run prisma:generate
RUN npm run build

EXPOSE 8100

CMD ["node", "dist/index.js"]
