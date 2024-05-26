Want traefik to dynamically forward any routes that are served by another instance of traefik to that instance? Why would that be useful? Say for example you have 2 or more home servers and your router is set to forward any HTTP traffic to traefik running one of those servers but you want a second instance of traefik running on that second server to also be accessible to the net. Well if that's what you're after then you're in the right place ☺️

traefik-to-traefik-forwarding-config (very clumsy name I know, open to better suggestions!) works by getting all the routers of one instance of traefik (let's call it upstream traefik instance) via it's API, converting them into the file/http traefik provider format, then serving them over HTTP. That allows you to add a http provider to other traefik instance (let's call this the proxy traefik instance) which reads in this config and adds those routes to it's own list of routes.

You can clone this repo and run the script directly, or you can use the provided docker image to run it: 

```yaml
services:
  app:
    image: ghcr.io/callumgare/traefik-to-traefik-forwarding-config
    ports:
      - '8000:80'
    environment:
      UPSTREAM_TRAEFIK_API_URL: http://example.com/api # The URL for the API endpoint of the upstream 
        # traefik instance
      NAME_FOR_SERVICE: forwarding-upstream # A name to use for the traefik service which will be added 
        # to the proxy traefik instance
      ENDPOINTS_FOR_SERVICE: example-endpoint,second-example-endpoint # A comma separated list of 
        # endpoints which the routers added to the proxy traefik instance will be attached to
      UPSTREAM_TRAEFIK_ENDPOINTS_FILTER: example-upstream-endpoint-to-filter-by # (optional) A comma 
        # separated list of endpoints which routers in the upstream traefik instance must be attached 
        # to in order for them to be included in the list to add to the proxy traefik instance
      PORT: 80 # (optional) The port which the script http server runs on. Defaults to 80.
```