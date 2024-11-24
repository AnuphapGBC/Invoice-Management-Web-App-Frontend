# Use a Node.js base image for building
FROM node:16-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Serve the application using nginx
FROM nginx:alpine

# Copy the build output to nginx's HTML directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose the default port for nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
