FROM node

# Use Tint as root init process to ensure signals are correctly propigated
ENV TINI_VERSION v0.19.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

WORKDIR /home/node/app
COPY package*.json index.js ./
CMD ["node","index.js"]