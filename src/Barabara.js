const _ = require('lodash');
// Not using lodash kebabCase since it transaform 'v1' to 'v-1'
const toSlubCase = require('to-slug-case');
const fs = require('fs');
const path = require('path');

function extractOpenApiSecurityRequirements (security) {
  const securityRequirements = {};

  for (const key in security) {
    if (Object.prototype.hasOwnProperty.call(security, key)) {
      securityRequirements[key] = security[key].requirements || [];
    }
  }

  return securityRequirements;
}

const buildOpenApiBaseObject = (openApiParams) => {
  if (typeof openApiParams !== 'object') {
    throw new Error('OpenAPI parameters must be present and be an object');
  }
  if (!openApiParams.title || typeof openApiParams.title !== 'string') {
    throw new Error('OpenAPI title must be present and be a string');
  }
  if (!openApiParams.version || typeof openApiParams.version !== 'string') {
    throw new Error('OpenAPI version must be present and be a string');
  }
  if (!openApiParams.description || typeof openApiParams.description !== 'string') {
    throw new Error('OpenAPI description must be present and be a string');
  }
  if (
    openApiParams.termsOfService &&
    typeof openApiParams.termsOfService !== 'string'
  ) {
    throw new Error('OpenAPI termsOfService must be a string');
  }
  if (openApiParams.contact && typeof openApiParams.contact !== 'object') {
    throw new Error('OpenAPI contact must be an object');
  }
  if (openApiParams.license && typeof openApiParams.license !== 'object') {
    throw new Error('OpenAPI license must be an object');
  }
  if (!openApiParams.servers || !Array.isArray(openApiParams.servers)) {
    throw new Error('OpenAPI servers must be present and be an array');
  }
  if (openApiParams.tags && !Array.isArray(openApiParams.tags)) {
    throw new Error('OpenAPI tags must be an array');
  }
  if (openApiParams.security && typeof openApiParams.security !== 'object') {
    throw new Error('OpenAPI security must be an object');
  }

  return {
    openapi: '3.0.1',
    info: {
      title: openApiParams.title,
      version: openApiParams.version,
      description: openApiParams.description,
      termsOfService: openApiParams.termsOfService || undefined,
      contact: openApiParams.contact || undefined,
      license: openApiParams.license || undefined
    },
    servers: openApiParams.servers || [],
    tags: openApiParams.tags || [],
    paths: {},
    components: {
      schemas: {},
      responses: {},
      parameters: {},
      securitySchemes: openApiParams.security ? openApiParams.security : {}
    },
    security: openApiParams.security ? extractOpenApiSecurityRequirements(openApiParams.security) : {}
  };
};

class Barabara {
  constructor (Router, actionsMap, openApi = false) {
    this.Router = Router;
    this.actionsMap = actionsMap;
    if (openApi !== false) {
      this.openApi = buildOpenApiBaseObject(openApi);
    } else {
      this.openApi = null;
    }
  }

  routeFromPath (basePath, filePath) {
    return (
      filePath
        .substr(basePath.length)
        .replace(/(\/index)?(\.js|\.ts)$/i, '')
        .split('/')
        .map(toSlubCase)
        .join('/') || '/'
    );
  }

  findControllers (basePath) {
    const files = fs.readdirSync(basePath);
    const controllerFiles = [];

    files.forEach((file) => {
      // Skip ., .., .something_hidden
      if (file[0] === '.') {
        return;
      }

      const fullPath = path.join(basePath, file);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        controllerFiles.push(...this.findControllers(fullPath));
      }

      if (['.js', '.ts'].includes(path.extname(file))) {
        controllerFiles.push(fullPath);
      }
    });
    // Important to have the files from directories first for routing
    return controllerFiles;
  }

  createRouteHandler (controller, action, metaList) {
    return async (req, res, next) => {
      const options = Object.assign({}, req.query, req.body, req.params);

      if (_.has(req, 'files.data')) {
        options.files = req.files;
      }

      const meta = _.reduce(
        req,
        (result, value, key) => {
          // Additional req keys needed (e.q.: 'user')
          if (metaList.indexOf(key) !== -1) {
            result[key] = value;
          }

          return result;
        },
        {}
      );

      try {
        const result = await controller[action](options, meta);
        if (typeof result === 'object') {
          if (typeof result.barabara === 'object') {
            if (result.barabara.redirect) {
              return res.redirect(result.barabara.redirect);
            }

            if (result.barabara.contentType) {
              res.set('Content-Type', result.barabara.contentType);
              return res.send(result.buffer);
            }
          }

          return res.json(result);
        } else {
          return res.send(result);
        }
      } catch (e) {
        return next(e);
      }
    };
  }

  registerController (router, baseRoute, controller, metaList) {
    Object.keys(controller).forEach((action) => {
      if (!(action in this.actionsMap)) {
        return;
      }
      // 'Verb should be 'head', 'get', 'post', 'put', 'patch', 'delete'
      const verb = this.actionsMap[action].toLowerCase();
      let finalRoutes;

      if (['head', 'get'].includes(verb) && baseRoute !== '/') {
        // Need to define 2 routes ('/resource' & '/resource/:id')
        finalRoutes = [baseRoute, baseRoute.replace(/\/$/, '') + '/:id'];
      } else if (
        ['put', 'delete', 'patch'].indexOf(verb) !== -1 &&
        baseRoute !== '/'
      ) {
        // Need to have the id in the route ('/resource/:id')
        finalRoutes = [baseRoute.replace(/\/$/, '') + '/:id'];
      } else {
        // For the post verb
        finalRoutes = [baseRoute];
      }
      const routeHandler = this.createRouteHandler(
        controller,
        action,
        metaList
      );
      // Assign routeHandler to routes
      finalRoutes.forEach((finalRoute) => {
        if (controller.openApi && this.openApi) {
          const openApiPath = finalRoute.replace(/\/:id$/, '/{id}');
          if (!this.openApi.paths[openApiPath]) {
            this.openApi.paths[openApiPath] = {};
          }

          if (controller.openApi[action]) {
            this.openApi.paths[openApiPath][verb] = Object.assign({}, controller.openApi[action]);
            this.openApi.paths[openApiPath][verb].operationId =
            `${toSlubCase(baseRoute)}_${action}${finalRoute.includes('/:id') ? '_id' : ''}`;
          }

          if (controller.openApi.components) {
            if (typeof controller.openApi.components !== 'object') {
              throw new Error(`OpenAPI components for action ${action} in controller ${baseRoute} must be an object`);
            }

            if (controller.openApi.components.schemas) {
              if (typeof controller.openApi.components.schemas !== 'object') {
                throw new Error(`OpenAPI schemas for action ${action} in controller ${baseRoute} must be an object`);
              }

              Object.assign(
                this.openApi.components.schemas,
                controller.openApi.components.schemas || {}
              );
            }

            if (controller.openApi.components.responses) {
              if (typeof controller.openApi.components.responses !== 'object') {
                throw new Error(`OpenAPI responses for action ${action} in controller ${baseRoute} must be an object`);
              }

              Object.assign(
                this.openApi.components.responses,
                controller.openApi.components.responses || {}
              );
            }

            if (controller.openApi.components.parameters) {
              if (typeof controller.openApi.components.parameters !== 'object') {
                throw new Error(`OpenAPI parameters for action ${action} in controller ${baseRoute} must be an object`);
              }

              Object.assign(
                this.openApi.components.parameters,
                controller.openApi.components.parameters || {}
              );
            }
          }
        }

        router[verb](finalRoute, routeHandler);
      });
    });
  }

  createRouter (controllersBasePath, metaList = []) {
    const controllerPaths = this.findControllers(controllersBasePath);
    const router = new this.Router();
    // Need to sort to have longest/most-specific route first
    controllerPaths
      .map((controllerPath) => {
        return {
          path: controllerPath,
          route: this.routeFromPath(controllersBasePath, controllerPath)
        };
      })
      .sort((controllerInfoA, controllerInfoB) => {
        const partsA = controllerInfoA.route.split('/');
        const partsB = controllerInfoB.route.split('/');
        // Most specific route first (descending sort)
        return partsB.length - partsA.length;
      })
      .forEach((controllerInfo) => {
        const controller = require(controllerInfo.path);
        this.registerController(
          router,
          controllerInfo.route,
          controller,
          metaList
        );
      });

    if (this.openApi) {
      // Add the OpenAPI documentation
      router.get('/openapi', (_req, res) => {
        res.json(this.openApi);
      });
    }

    return router;
  }
}

module.exports = {
  Barabara
};
