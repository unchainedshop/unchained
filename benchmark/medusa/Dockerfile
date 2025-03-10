FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Create app directory
WORKDIR /app

# Install Medusa CLI
RUN npm install -g @medusajs/medusa-cli

# Create a new Medusa project
RUN medusa new . --seed

# Copy benchmark seed script
COPY benchmark/medusa/seed.js /app/scripts/seed.js
COPY benchmark/medusa/package.json /app/package.json

# Install additional dependencies for seeding
RUN npm install

# Set environment variables
ENV NODE_ENV=production
ENV PORT=9000
ENV DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa
ENV REDIS_URL=redis://redis:6379
ENV JWT_SECRET=supersecret
ENV COOKIE_SECRET=supersecret
ENV STORE_CORS=http://localhost:8000
ENV ADMIN_CORS=http://localhost:7000
ENV SMTP_HOST=mailcrab
ENV SMTP_PORT=1025
ENV SMTP_USER=noreply@localhost
ENV SMTP_PASS=noreply
ENV SMTP_FROM=noreply@localhost

# Expose port
EXPOSE 9000

# Start the app
CMD ["npm", "run", "start:benchmark"]