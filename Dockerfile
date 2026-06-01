# Step 1: Grab Node.js from the cloud
FROM node:20

# Step 2: Create a folder inside the container for our code
WORKDIR /app

# Step 3: Copy our package files and install dependencies
COPY package*.json ./
RUN npm install

# Step 4: Copy the rest of your Express app files 
COPY . .

# Step 5: Tell the container to open port 5000
EXPOSE 5000

# Step 6: The command to start your Express app
CMD ["node", "server.js"]