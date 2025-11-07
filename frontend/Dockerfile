# Use a fixed version of Nginx for consistency
FROM nginx:1.24-alpine

# Remove default static files and default config
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/default.conf

# Copy your static assets
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
# If you have additional assets (images, js), copy them too
# Example: COPY assets/ /usr/share/nginx/html/assets/

# Copy your custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
