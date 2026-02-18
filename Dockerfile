# 1. Use the official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:latest

# 2. Switch to root temporarily to fix permissions
USER root

# 3. Create the app directory and give ownership to the puppeteer user
WORKDIR /app
RUN chown -R pptruser:pptruser /app

# 4. Switch back to the non-root user for security
USER pptruser

# 5. Copy package files (ownership will be handled by the user)
COPY --chown=pptruser:pptruser package*.json ./

# 6. Install dependencies
RUN npm install

# 7. Copy the rest of your code
COPY --chown=pptruser:pptruser . .

# 8. Set environment to headless
ENV HEADLESS=true

# 9. Start the bot
CMD ["node", "bots/love-agent.js"]
