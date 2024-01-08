server {
    listen 127.0.0.1:{{ .port }} default_server;
    listen {{ .interface }}:{{ .port }} default_server;

    include /etc/nginx/includes/server_params.conf;
    include /etc/nginx/includes/proxy_params.conf;

    # Set Home Assistant Ingress header
    proxy_set_header X-HA-Ingress "YES";

    location / {
        absolute_redirect off;

        allow   172.30.32.2;
        allow   127.0.0.1;
        deny    all;

        proxy_pass http://backend;
        proxy_redirect '/' $http_x_ingress_path/;
        sub_filter 'href="/' 'href="$http_x_ingress_path/';
        sub_filter 'action="/' 'action="$http_x_ingress_path/';
        sub_filter 'formaction="/' 'formaction="$http_x_ingress_path/';
        sub_filter '<script src="/' '<script src="$http_x_ingress_path/';
        sub_filter '<img src="/' '<img src="$http_x_ingress_path/';
        sub_filter "top.location.href='" "top.location.href='$http_x_ingress_path";

        sub_filter_once off;
    }
}