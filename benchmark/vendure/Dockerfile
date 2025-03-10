FROM node:22-alpine

# Install dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Create app directory
WORKDIR /app

# Install @vendure/create
RUN npm install -g @vendure/create

# Create a new Vendure project
RUN vendure init . --ci

# Copy benchmark seed script and package.json
COPY benchmark/vendure/seed.ts /app/src/seed.ts
COPY benchmark/vendure/package.json /app/package.json

# Install additional dependencies for seeding
RUN npm install

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_HOST=postgres
ENV DB_PORT=5432
ENV DB_NAME=vendure
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV SUPERADMIN_USERNAME=admin
ENV SUPERADMIN_PASSWORD=admin
ENV SMTP_HOST=mailcrab
ENV SMTP_PORT=1025
ENV SMTP_USER=noreply@localhost
ENV SMTP_PASS=noreply
ENV SMTP_FROM=noreply@localhost

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:benchmark"]