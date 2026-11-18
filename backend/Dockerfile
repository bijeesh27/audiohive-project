FROM node:22-slim

# Set working directory
WORKDIR /app

# Install native dependencies build tools if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests
COPY package*.json ./

# Install dependencies (tsx and typescript are needed at runtime)
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Ensure logs directory exists
RUN mkdir -p logs

# Expose backend port
EXPOSE 3000

# Start backend application
CMD ["npm", "start"]
