#!/bin/bash
set -e
set -x

if [ ! -z "$1" ]; then
	arch="$1"
else
	arch=$(uname -m)
fi

echo "Compiling for arch '$arch'"
cp /root/.conan2/profiles/default /root/.conan2/profiles/host

function add_arch_to_sys {
	add_arch="$1"
	if [ ! -f "/etc/apt/sources.list.d/debian.sources.bak" ]; then
		cp /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.sources.bak
	fi
	cp /etc/apt/sources.list.d/debian.sources.bak /etc/apt/sources.list.d/debian.sources

	echo "Adding arch $add_arch to system architectures."
	eval $(dpkg-architecture)
	dpkg --add-architecture $add_arch
	sed -i "/Components.*/a arch=$DEB_HOST_ARCH,$add_arch" /etc/apt/sources.list.d/debian.sources
	apt update
	apt -y install libssl-dev:$add_arch openssl:$add_arch libcurl4-openssl-dev:$add_arch
}

if [[ "$arch" == x86_64 ]]; then
	add_arch=""
	build_arch="x86_64"
elif [[ "$arch" == armv7 ]]; then
	add_arch="armel"
	add_arch_to_sys "$add_arch"
	build_arch="armv7"
	apt -y install binutils-arm-linux-gnueabi gcc-arm-linux-gnueabi g++-arm-linux-gnueabi
	cat <<EOF >>/root/.conan2/profiles/host
[buildenv]
CC=arm-linux-gnueabi-gcc-12
CXX=arm-linux-gnueabi-g++-12
LD=arm-linux-gnueabi-ld
EOF
elif [[ "$arch" == aarch64 ]]; then
	add_arch="arm64"
	add_arch_to_sys "$add_arch"
	build_arch="armv8"
	apt -y install binutils-arm-linux-gnueabi gcc-arm-linux-gnueabi g++-arm-linux-gnueabi
	cat <<EOF >>/root/.conan2/profiles/host
[buildenv]
CC=arm-linux-gnueabi-gcc-12
CXX=arm-linux-gnueabi-g++-12
LD=arm-linux-gnueabi-ld
EOF
elif [[ "$arch" == armhf ]]; then
	add_arch="armhf"
	build_arch="armv7hf"
	add_arch_to_sys "$add_arch"
	apt -y install binutils-arm-linux-gnueabihf gcc-arm-linux-gnueabihf g++-arm-linux-gnueabihf
	cat <<EOF >>/root/.conan2/profiles/host
[buildenv]
CC=arm-linux-gnueabihf-gcc-12
CXX=arm-linux-gnueabihf-g++-12
LD=arm-linux-gnueabihf-ld
EOF
fi

BASEDIR=$(dirname "$0")
pushd "$BASEDIR"

cd /MQTTManager/

rm -rf build
#if [ -e CMakeCache.txt ]; then
#	rm CMakeCache.txt
#fi

sed -i "s/^arch.*/arch=$build_arch/g" /root/.conan2/profiles/host
# Get build type from conan profile
BUILD_TYPE=$(grep -E "^build_type=" /root/.conan2/profiles/default | cut -d'=' -f 2)

conan install . --output-folder=build --build=missing -pr:b default -pr:h host
cd build
source "conanbuild.sh"
cmake .. -DCMAKE_TOOLCHAIN_FILE=conan_toolchain.cmake -DCMAKE_BUILD_TYPE=$BUILD_TYPE
cmake --build . --config $BUILD_TYPE
sed -i "s|/MQTTManager/|/home/tim/NSPanelManager/docker/MQTTManager/|g" compile_commands.json
cp compile_commands.json ../

cp nspm_mqttmanager /usr/src/app/
