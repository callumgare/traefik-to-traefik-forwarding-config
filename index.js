import http from 'node:http'

// Required env vars
const baseUrl = process.env.UPSTREAM_TRAEFIK_API_URL
const serviceName = process.env.NAME_FOR_SERVICE
const entryPoints = process.env.ENDPOINTS_FOR_SERVICE?.split(",").map(entrypoint => entrypoint.trim())

// Optional env vars
const entryPointsFilter = process.env.UPSTREAM_TRAEFIK_ENDPOINTS_FILTER?.split(",").map(entrypoint => entrypoint.trim()) || []
const port = isNaN( parseInt(process.env.PORT) ) ? 80 : parseInt(process.env.PORT)

if (!baseUrl || !serviceName || !entryPoints) {
  throw Error("Not all required env vars provided")
}

async function getRoutes() {
  const endpoint = '/http/routers';
  let routes
    
  routes = await fetch(`${baseUrl}${endpoint}`).then(res => res.json());
  
  // We only care about redirecting routes that use the https endpoint
  if (entryPointsFilter.length) {
    routes = routes.filter(route => entryPointsFilter.some(endpointToFilterBy => route.entryPoints.includes(endpointToFilterBy)))
  }
  return routes
}

// Function to fetch and convert Traefik configuration
async function generateConfig() {
  const config = {
    http: {
      routers: {},
      services: {
        [serviceName]: {
          loadBalancer: {
            servers: [
              {url: "https://192.168.1.20:443/"}
            ],
            serversTransport: serviceName
          }
        }
      },
      serversTransports: {
        [serviceName]: {
          insecureSkipVerify: true // Seems to be required for forwarding, not entirely sure why
        }
      }
    }
  };

  const routes = await getRoutes()
  
  for (const route of routes) {

    config.http.routers[`${serviceName}-${route.name.split("@")[0]}`] = {
      rule: route.rule,
      entryPoints,
      service: serviceName
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
