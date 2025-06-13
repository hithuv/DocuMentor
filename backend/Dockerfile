# 1. Start from an official Node.js image. The 'slim' version is a good balance of size and functionality.
FROM node:20-slim

# Add C++ build tools and python, which are needed for 'faiss-node'
RUN apt-get update && apt-get install -y build-essential python3

# 2. Set the working directory inside the container to /app
WORKDIR /app

# 3. Copy package.json and package-lock.json first.
# By copying these separately, Docker can use its cache to skip reinstalling dependencies if they haven't changed.
COPY package*.json ./

# 4. Install all dependencies (including dev dependencies needed for the build)
RUN npm install

# 5. Copy the rest of our project's files into the container
COPY . .

# 6. Run the TypeScript build command to compile our .ts files into .js files in the /dist folder
RUN npm run build

# 7. Tell Docker that our application listens on port 3000
EXPOSE 3000

# 8. Define the command to run when the container starts.
# This runs the compiled JavaScript app from the 'dist' folder.
CMD [ "npm", "run", "start" ]