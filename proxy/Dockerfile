FROM envoyproxy/envoy:v1.28-latest

# Switch to root user to handle certificate permissions
USER root

# Create SSL directory
RUN mkdir -p /opt/ssl

# Copy SSL certificates
COPY fullchain.pem /opt/ssl/fullchain.pem
COPY privkey.pem /opt/ssl/privkey.pem

# Set proper permissions
RUN chmod 644 /opt/ssl/fullchain.pem && \
    chmod 644 /opt/ssl/privkey.pem

# Copy Envoy configuration
COPY envoy.yaml /etc/envoy/envoy.yaml

# Run Envoy as root
CMD ["/usr/local/bin/envoy", "-c", "/etc/envoy/envoy.yaml"]

