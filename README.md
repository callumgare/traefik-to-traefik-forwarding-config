Want Traefik to dynamically forward any routes that are served by another instance of Traefik to that instance? Why would that be useful? Say for example you have 2 or more home servers and your router is set to forward any HTTP traffic to Traefik running one of those servers but you want a second instance of Traefik running on that second server to also be accessible to the net. Well if that's what you're after then you're in the right place ☺️

traefik-to-traefik-forwarding-config (very clumsy name I know, open to better suggestions!) works by getting all the routers of one instance of Traefik (let's call it the source Traefik instance) via it's API, converting them into the file/http Traefik provider format, then serving them over HTTP. That allows you to add a http provider to other Traefik instance (let's call this the proxy Traefik instance) which reads in this config and adds those routes to it's own list of routes.

You can clone this repo and run the script directly, or you can use the provided docker image to run it: 

```yaml
services:
  app:
    image: ghcr.io/callumgare/traefik-to-traefik-forwarding-config
    ports:
      - '8000:80'
    environment:
      # The URL for the API endpoint of the Traefik instance you wish to have traffic forwarded to. This
      # must be accessible by traefik-to-traefik-forwarding-config but does not need to be accessible to
      # the proxy Traefik instance.
      SOURCE_TRAEFIK_API_BASE_URL: http://traefik/api

      # The URL that which the proxy Traefik instances should forward traefik too.
      SOURCE_TRAEFIK_ENDPOINT_URL: https://192.168.1.100:443

      # A name to use for the traefik service which will be added to the proxy Traefik
      # instance
      PROXY_TRAEFIK_SERVICE_NAME: forwarding-to-secondary-traefik

      # A comma separated list of endpoints which the routers added to the proxy Traefik
      # instance will be attached to
      PROXY_TRAEFIK_SERVICE_ENDPOINTS: example-endpoint,second-example-endpoint
      
      # (optional) If given then only routers in the source Traefik instance that are attached to one of these endpoints will be setup to have traefik forwarded to. The format is a comma separated list.
      SOURCE_TRAEFIK_ENDPOINTS_FILTER: example-upstream-endpoint-to-filter-by

      # (optional) The port which the script http server runs on. Defaults to 80.
      PORT: 80 
```

## Related Projects
After creating this I've since come across [Traefik Kobling](https://github.com/ldellisola/TraefikKobling) which seems like it might do the same thing and appears to be better maintained/documented so you might want to use that instead.