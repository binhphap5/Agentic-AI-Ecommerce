FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

# Start the server
CMD [ "npm", "run", "dev" ]
