# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-alpine

LABEL maintainer="roysi"
LABEL description="Multi-turn AI chatbot built with LangChain.js and Google Gemini"
LABEL version="1.0.0"

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules




# Copy application source files
COPY package.json ./
COPY index.js ./
COPY chatbot.js ./
COPY .env.example ./

# The API key must be provided at runtime via environment variable
ENV GEMINI_API_KEY=""

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Start the chatbot (interactive CLI — requires -it flags)
CMD ["node", "index.js"]
