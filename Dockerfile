# Use official Bun image
FROM oven/bun:latest AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build the Next.js + Payload app
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Start the server
EXPOSE 3000
CMD ["bun", "run", "start"]