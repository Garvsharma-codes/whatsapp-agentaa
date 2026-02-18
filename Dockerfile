# 1. Use an image that has Chrome pre-installed for Puppeteer
FROM ghcr.io/puppeteer/puppeteer:latest

# 2. Set the working directory inside the cloud computer
WORKDIR /app

# 3. Copy your package files first to install libraries
COPY package*.json ./
RUN npm install

# 4. Copy all your files (bots, etc.) into the folder
COPY . .

# 5. Tell the bot it's running in the cloud (No screen)
ENV HEADLESS=true

# 6. The command to start your bot
CMD ["node", "bots/love-agent.js"]
