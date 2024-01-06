FROM python:latest

# Environment variables
ENV \
    CARGO_NET_GIT_FETCH_WITH_CLI=true \
    DEBIAN_FRONTEND="noninteractive" \
    LANG="C.UTF-8" \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_PREFER_BINARY=1 \
    PS1="$(whoami)@$(hostname):$(pwd)$ " \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    S6_BEHAVIOUR_IF_STAGE2_FAILS=2 \
    S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0 \
    S6_CMD_WAIT_FOR_SERVICES=1

# Install base system
ARG BUILD_ARCH=amd64
ARG BASHIO_VERSION="v0.16.2"
ARG S6_OVERLAY_VERSION="3.1.6.2"
ARG TEMPIO_VERSION="2021.09.0"
RUN \
	apt-get update \
	&& apt-get install -y --no-install-recommends \
			postgresql-client \
			curl \
			inotify-tools \
			net-tools \
			nginx=1.22.1-9 \
			jq \
    \
	&& c_rehash \
	\
	&& S6_ARCH="${BUILD_ARCH}" \
	&& if [ "${BUILD_ARCH}" = "i386" ]; then S6_ARCH="i686"; \
	elif [ "${BUILD_ARCH}" = "amd64" ]; then S6_ARCH="x86_64"; \
	elif [ "${BUILD_ARCH}" = "armv7" ]; then S6_ARCH="arm"; fi \
	\
	&& curl -L -s "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-noarch.tar.xz" \
			| tar -C / -Jxpf - \
	\
	&& curl -L -s "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-${S6_ARCH}.tar.xz" \
			| tar -C / -Jxpf - \
	\
	&& curl -L -s "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-symlinks-noarch.tar.xz" \
			| tar -C / -Jxpf - \
	\
	&& curl -L -s "https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}/s6-overlay-symlinks-arch.tar.xz" \
			| tar -C / -Jxpf - \
	\
	&& mkdir -p /etc/fix-attrs.d \
	&& mkdir -p /etc/services.d \
	\
	&& curl -J -L -o /tmp/bashio.tar.gz \
			"https://github.com/hassio-addons/bashio/archive/${BASHIO_VERSION}.tar.gz" \
	&& mkdir /tmp/bashio \
	&& tar zxvf \
			/tmp/bashio.tar.gz \
			--strip 1 -C /tmp/bashio \
	\
	&& mv /tmp/bashio/lib /usr/lib/bashio \
	&& ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
	\
	&& curl -L -s -o /usr/bin/tempio \
			"https://github.com/home-assistant/tempio/releases/download/${TEMPIO_VERSION}/tempio_${BUILD_ARCH}" \
	&& chmod a+x /usr/bin/tempio \
	\
	&& apt-get purge -y --auto-remove \
			xz-utils \
	&& apt-get clean \
	&& rm -fr \
			/tmp/* \
			/var/{cache,log}/* \
			/var/lib/apt/lists/* \
			/etc/nginx \
	&& mkdir -p /var/log/nginx \
	&& touch /var/log/nginx/error.log

# Copy root filesystem
COPY rootfs /

# Copy s6-overlay adjustments
# COPY s6-overlay /package/admin/s6-overlay-${S6_OVERLAY_VERSION}/

RUN echo "alias ll='ls -lah --color=auto'" >> /etc/bash.bashrc

WORKDIR /usr/src/app
COPY web/ /usr/src/app/
RUN pip install -r requirements.txt

EXPOSE 8000
# CMD ["/bin/bash", "./run.sh"]
CMD ["/init"]