# Step 1: Use Node alpine for a smaller image size
FROM node:20-alpine

# Step 2: Create app directory
WORKDIR /app

# Step 3: Copy package files and install ALL dependencies (including typescript)
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of your TypeScript application files
COPY . .

# Step 5: Compile TypeScript to JavaScript inside the container
RUN npm run build

# Step 6: Expose your backend port
EXPOSE 5000

# Step 7: Run the compiled JavaScript file (usually inside the 'dist' folder)
CMD ["node", "dist/server.js"]