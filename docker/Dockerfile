ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base-python:latest

FROM ${BUILD_FROM}

RUN apk add --no-cache \
    py3-pip=23.3.1-r0 \
    curl \
    net-tools \
    inotify-tools \
    nano \
    nginx

# Copy root filesystem
COPY rootfs /

WORKDIR /usr/src/app
COPY web/ /usr/src/app/
RUN pip install -r requirements.txt --break-system-packages

RUN echo "alias ll='ls -lah --color=auto'" >> /etc/bash/bashrc

EXPOSE 8000
# CMD ["/bin/bash", "./run.sh"]
# CMD ["/init"]