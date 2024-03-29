const _ = require('lodash');
// Not using lodash kebabCase since it transaform 'v1' to 'v-1'
const toSlubCase = require('to-slug-case');
const fs = require('fs');
const path = require('path');

class Barabara {
  constructor (Router, actionsMap) {
    this.Router = Router;
    this.actionsMap = actionsMap;
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

    return router;
  }
}

module.exports = {
  Barabara
};
