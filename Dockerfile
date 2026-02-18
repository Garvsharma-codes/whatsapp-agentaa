# 1. Start with Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:latest

# 2. Switch to root to fix the folder permissions
USER root

# 3. Create app directory and give ownership to the 'pptruser'
WORKDIR /app
RUN chown -R pptruser:pptruser /app

# 4. Switch back to the safe user
USER pptruser

# 5. Copy your package files with the correct owner
COPY --chown=pptruser:pptruser package*.json ./

# 6. Install libraries (now it has permission to write)
RUN npm install

# 7. Copy everything else
COPY --chown=pptruser:pptruser . .

# 8. Start the bot
CMD ["node", "bots/love-agent.js"]
