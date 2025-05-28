const expect = require('chai').expect;
const { Barabara } = require('../src/Barabara');
const { Router } = require('express');
const path = require('path');

describe('Barabara', () => {
  const basePath = path.join(__dirname, './mocks');
  const actionsMap = {
    exists: 'head',
    read: 'get',
    create: 'post',
    update: 'put',
    partial: 'patch',
    destroy: 'delete'
  };
  const barabara = new Barabara(Router, actionsMap);

  it('should create a route from a path', () => {
    const filePath = path.join(basePath, '/test.js');

    expect(barabara.routeFromPath(basePath, filePath)).to.equal('/test');
  });

  it('should not care about uppercase when creating a route', () => {
    const filePath = path.join(basePath, '/SubPath/Test.js');

    expect(barabara.routeFromPath(basePath, filePath)).to.equal('/sub-path/test');
  });

  it('should find controllers in the base path', () => {
    expect(barabara.findControllers(basePath)).to.have.members([
      path.join(basePath, '/index.js'),
      path.join(basePath, '/test.js'),
      path.join(basePath, '/subPath/subTest.js'),
      path.join(basePath, '/typescript.ts'),
      path.join(basePath, '/subPath/subTypescript.ts')
    ]);
  });

  it('should create route handler', () => {
    const controller = {
      create: (_options, _meta) => {}
    };

    const handler = barabara.createRouteHandler(controller, 'create');
    expect(handler).to.be.a('function');
  });

  it('should create route handler with ability to redirect', async () => {
    const controller = {
      create: (_options, _meta) => {
        return {
          barabara: {
            redirect: 'test'
          }
        };
      }
    };

    const handler = barabara.createRouteHandler(controller, 'create');
    let testResult = false;
    const res = {
      redirect: (path) => {
        if (path === 'test') {
          testResult = true;
        }
      }
    };
    await handler({}, res, () => {});

    expect(handler).to.be.a('function');
    expect(testResult).to.equal(true);
  });

  it('should create route handler with ability to return HTML', async () => {
    const controller = {
      create: (_options, _meta) => {
        return '<html></html>';
      }
    };

    const handler = barabara.createRouteHandler(controller, 'create');
    let testResult = false;
    const res = {
      send: (html) => {
        if (html === '<html></html>') {
          testResult = true;
        }
      }
    };
    await handler({}, res, () => {});

    expect(handler).to.be.a('function');
    expect(testResult).to.equal(true);
  });

  it('should create route handler with ability to return JSON', async () => {
    const controller = {
      create: (_options, _meta) => {
        return {
          testString: 'isWorking'
        };
      }
    };

    const handler = barabara.createRouteHandler(controller, 'create');
    let testResult = false;
    const res = {
      json: (json) => {
        if (json.testString === 'isWorking') {
          testResult = true;
        }
      }
    };
    await handler({}, res, () => {});

    expect(handler).to.be.a('function');
    expect(testResult).to.equal(true);
  });

  it('should create route handler with ability to return a specific content type', async () => {
    const controller = {
      create: (_options, _meta) => {
        return {
          barabara: {
            contentType: 'text/html; charset=UTF-8'
          },
          buffer: Buffer.from('This is a test')
        };
      }
    };

    const handler = barabara.createRouteHandler(controller, 'create');
    let testResultA = false;
    let testResultB = false;
    const res = {
      send: (content) => {
        if (Buffer.from(content).toString() === Buffer.from('This is a test').toString()) {
          testResultA = true;
        }
      },
      set: (header, type) => {
        if (header === 'Content-Type' && type === 'text/html; charset=UTF-8') {
          testResultB = true;
        }
      }
    };
    await handler({}, res, () => {});

    expect(handler).to.be.a('function');
    expect(testResultA).to.equal(true);
    expect(testResultB).to.equal(true);
  });

  it('should register the controller in the router', () => {
    const router = new Router();
    const controller = require('./mocks/test.js');

    barabara.registerController(router, '/test', controller);

    const routes = router.stack.map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods
    }));

    expect(routes).to.deep.equal([
      { path: '/test', methods: { head: true } },
      { path: '/test/:id', methods: { head: true } },
      { path: '/test', methods: { get: true } },
      { path: '/test/:id', methods: { get: true } },
      { path: '/test', methods: { post: true } },
      { path: '/test/:id', methods: { put: true } },
      { path: '/test/:id', methods: { patch: true } },
      { path: '/test/:id', methods: { delete: true } }
    ]);
  });

  it('should create a new router with routes ordered by length', () => {
    const router = barabara.createRouter(path.join(__dirname, './mocks'));
    const routes = router.stack.map((layer) => ({
      path: layer.route.path,
      methods: layer.route.methods
    }));
    // Should be sorted by the more

    expect(routes).to.deep.equal([
      { path: '/sub-path/sub-test', methods: { head: true } },
      { path: '/sub-path/sub-test/:id', methods: { head: true } },
      { path: '/sub-path/sub-test', methods: { get: true } },
      { path: '/sub-path/sub-test/:id', methods: { get: true } },
      { path: '/sub-path/sub-test', methods: { post: true } },
      { path: '/sub-path/sub-test/:id', methods: { put: true } },
      { path: '/sub-path/sub-test/:id', methods: { patch: true } },
      { path: '/sub-path/sub-test/:id', methods: { delete: true } },
      { path: '/sub-path/sub-typescript', methods: { head: true } },
      { path: '/sub-path/sub-typescript/:id', methods: { head: true } },
      { path: '/sub-path/sub-typescript', methods: { get: true } },
      { path: '/sub-path/sub-typescript/:id', methods: { get: true } },
      { path: '/sub-path/sub-typescript', methods: { post: true } },
      { path: '/sub-path/sub-typescript/:id', methods: { put: true } },
      { path: '/sub-path/sub-typescript/:id', methods: { patch: true } },
      { path: '/sub-path/sub-typescript/:id', methods: { delete: true } },
      { path: '/', methods: { head: true } },
      { path: '/', methods: { get: true } },
      { path: '/', methods: { post: true } },
      { path: '/', methods: { put: true } },
      { path: '/', methods: { patch: true } },
      { path: '/', methods: { delete: true } },
      { path: '/test', methods: { head: true } },
      { path: '/test/:id', methods: { head: true } },
      { path: '/test', methods: { get: true } },
      { path: '/test/:id', methods: { get: true } },
      { path: '/test', methods: { post: true } },
      { path: '/test/:id', methods: { put: true } },
      { path: '/test/:id', methods: { patch: true } },
      { path: '/test/:id', methods: { delete: true } },
      { path: '/typescript', methods: { head: true } },
      { path: '/typescript/:id', methods: { head: true } },
      { path: '/typescript', methods: { get: true } },
      { path: '/typescript/:id', methods: { get: true } },
      { path: '/typescript', methods: { post: true } },
      { path: '/typescript/:id', methods: { put: true } },
      { path: '/typescript/:id', methods: { patch: true } },
      { path: '/typescript/:id', methods: { delete: true } }
    ]);
  });
});
describe('Barabara OpenAPI', () => {
  const actionsMap = {
    read: 'get',
    create: 'post',
    update: 'put'
  };

  it('should initialize with OpenAPI configuration', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);

    expect(barabara.openApi).to.be.an('object');
    expect(barabara.openApi.info.title).to.equal('Test API');
    expect(barabara.openApi.info.version).to.equal('1.0.0');
    expect(barabara.openApi.info.description).to.equal('Test API description');
    expect(barabara.openApi.servers).to.deep.equal([{ url: 'http://localhost:3000' }]);
  });

  it('should set openApi to null when openApi parameter is false', () => {
    const barabara = new Barabara(Router, actionsMap, false);
    expect(barabara.openApi).to.equal(null);
  });

  it('should throw error for invalid OpenAPI configuration', () => {
    // Missing title
    expect(() => new Barabara(Router, actionsMap, {
      version: '1.0.0',
      description: 'Test API',
      servers: []
    })).to.throw('OpenAPI title must be present and be a string');

    // Missing version
    expect(() => new Barabara(Router, actionsMap, {
      title: 'Test API',
      description: 'Test API',
      servers: []
    })).to.throw('OpenAPI version must be present and be a string');

    // Missing description
    expect(() => new Barabara(Router, actionsMap, {
      title: 'Test API',
      version: '1.0.0',
      servers: []
    })).to.throw('OpenAPI description must be present and be a string');

    // Missing servers
    expect(() => new Barabara(Router, actionsMap, {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API'
    })).to.throw('OpenAPI servers must be present and be an array');
  });

  it('should extract security requirements from OpenAPI config', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [],
      security: {
        bearerAuth: {
          requirements: ['read:api', 'write:api']
        },
        apiKeyAuth: {
          requirements: ['api_key']
        }
      }
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);

    expect(barabara.openApi.security).to.deep.equal({
      bearerAuth: ['read:api', 'write:api'],
      apiKeyAuth: ['api_key']
    });
  });

  it('should create router with OpenAPI endpoint', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = barabara.createRouter(path.join(__dirname, './mocks'));

    // Find the OpenAPI endpoint in the router stack
    const openApiRoute = router.stack.find(layer =>
      layer.route && layer.route.path === '/openapi' && layer.route.methods.get);

    expect(openApiRoute).to.be.an('object');
    expect(openApiRoute.route.path).to.equal('/openapi');
    expect(openApiRoute.route.methods.get).to.equal(true);
    expect(openApiRoute.route.stack[0].handle).to.be.a('function');
  });

  it('should throw error for invalid OpenAPI components in controller', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controllerWithInvalidComponents = {
      read: () => ({}),
      openApi: {
        read: { summary: 'Get test data' },
        components: 'invalid' // Should be an object
      }
    };

    expect(() => barabara.registerController(router, '/test', controllerWithInvalidComponents, [])).to
      .throw('OpenAPI components for action read in controller /test must be an object');

    const controllerWithInvalidSchemas = {
      read: () => ({}),
      openApi: {
        read: { summary: 'Get test data' },
        components: {
          schemas: 'invalid' // Should be an object
        }
      }
    };

    expect(() => barabara.registerController(router, '/test', controllerWithInvalidSchemas, [])).to
      .throw('OpenAPI schemas for action read in controller /test must be an object');

    const controllerWithInvalidResponses = {
      read: () => ({}),
      openApi: {
        read: { summary: 'Get test data' },
        components: {
          responses: 'invalid' // Should be an object
        }
      }
    };

    expect(() => barabara.registerController(router, '/test', controllerWithInvalidResponses, [])).to
      .throw('OpenAPI responses for action read in controller /test must be an object');

    const controllerWithInvalidParameters = {
      read: () => ({}),
      openApi: {
        read: { summary: 'Get test data' },
        components: {
          parameters: 'invalid' // Should be an object
        }
      }
    };

    expect(() => barabara.registerController(router, '/test', controllerWithInvalidParameters, [])).to
      .throw('OpenAPI parameters for action read in controller /test must be an object');
  });
});
