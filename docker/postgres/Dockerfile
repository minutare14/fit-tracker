FROM postgres:16-alpine

COPY start-with-password-sync.sh /usr/local/bin/start-with-password-sync.sh

RUN chmod +x /usr/local/bin/start-with-password-sync.sh

ENTRYPOINT ["/usr/local/bin/start-with-password-sync.sh"]
