import http from 'node:http'

// Required env vars
const sourceTraefikApiBaseUrl = process.env.SOURCE_TRAEFIK_API_BASE_URL?.replace(/\/+$/, "")
const sourceTraefikEndpointUrl = process.env.SOURCE_TRAEFIK_ENDPOINT_URL?.trim()
const proxyTraefikServiceName = process.env.PROXY_TRAEFIK_SERVICE_NAME
const proxyTraefikEntryPoints = process.env.PROXY_TRAEFIK_SERVICE_ENDPOINTS?.split(",").map(entrypoint => entrypoint.trim())

// Optional env vars
const sourceTraefikEntryPointsFilter = process.env.SOURCE_TRAEFIK_ENDPOINTS_FILTER?.split(",").map(entrypoint => entrypoint.trim()) || []
const port = isNaN( parseInt(process.env.PORT) ) ? 80 : parseInt(process.env.PORT)

if (!sourceTraefikApiBaseUrl || !sourceTraefikEndpointUrl || !proxyTraefikServiceName || !proxyTraefikEntryPoints) {
  throw Error("Not all required env vars provided")
}

async function getRoutes() {
  const endpoint = '/http/routers';
  let routes
    
  routes = await fetch(`${sourceTraefikApiBaseUrl}${endpoint}`).then(res => res.json());
  
  // We only care about redirecting routes that use the https endpoint
  if (sourceTraefikEntryPointsFilter.length) {
    routes = routes.filter(route => sourceTraefikEntryPointsFilter.some(endpointToFilterBy => route.entryPoints.includes(endpointToFilterBy)))
  }
  return routes
}

// Function to fetch and convert Traefik configuration
async function generateConfig() {
  const config = {
    http: {
      routers: {},
      services: {
        [proxyTraefikServiceName]: {
          loadBalancer: {
            servers: [
              {url: sourceTraefikEndpointUrl}

            ],
            serversTransport: proxyTraefikServiceName
          }
        }
      },
      serversTransports: {
        [proxyTraefikServiceName]: {
          insecureSkipVerify: true // Seems to be required for forwarding, not entirely sure why
        }
      }
    }
  };

  const routes = await getRoutes()
  
  for (const route of routes) {

    config.http.routers[`${proxyTraefikServiceName}-${route.name.split("@")[0]}`] = {
      rule: route.rule,
      entryPoints: proxyTraefikEntryPoints,
      service: proxyTraefikServiceName
    }
  }
  
  return config;
}

http.createServer(async (req, res) => {
  let config
  try {
    config = await generateConfig()
  } catch(error) {
    console.error(error)
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end("An error occurred when trying to generate the config");
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end( JSON.stringify(config) );
}).listen(port);
