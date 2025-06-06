# ---- Stage 1: Build ----
# This stage installs all dependencies (including dev) and builds our TypeScript code.
# We use a specific Node.js version for consistency.
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of our source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build


# ---- Stage 2: Production ----
# This stage creates the final, lean image for production.
# It starts from a fresh, clean base image.
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy only the necessary package files from the builder stage
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the compiled JavaScript code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD [ "node", "dist/index.js" ]