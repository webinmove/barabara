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

  // ...existing code...

  it('should register OpenAPI path information when registering controller', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      read: () => ({}),
      create: () => ({}),
      update: () => ({}),
      openApi: {
        read: {
          summary: 'Get resource',
          description: 'Get a resource or list of resources',
          tags: ['test'],
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/TestResponse'
                  }
                }
              }
            }
          }
        },
        create: {
          summary: 'Create resource',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TestInput'
                }
              }
            }
          }
        },
        components: {
          schemas: {
            TestResponse: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' }
              }
            },
            TestInput: {
              type: 'object',
              properties: {
                name: { type: 'string' }
              }
            }
          }
        }
      }
    };

    barabara.registerController(router, '/test', controller, []);

    // Check that paths were properly registered
    expect(barabara.openApi.paths).to.have.property('/test');
    expect(barabara.openApi.paths).to.have.property('/test/{id}');

    // Check GET method documentation
    expect(barabara.openApi.paths['/test'].get).to.include({
      summary: 'Get resource',
      description: 'Get a resource or list of resources'
    });
    expect(barabara.openApi.paths['/test'].get.tags).to.deep.equal(['test']);

    // Check POST method
    expect(barabara.openApi.paths['/test'].post).to.have.property('summary', 'Create resource');
    expect(barabara.openApi.paths['/test'].post).to.have.property('requestBody');

    // Check that components were registered
    expect(barabara.openApi.components.schemas).to.have.property('TestResponse');
    expect(barabara.openApi.components.schemas).to.have.property('TestInput');
  });

  it('should handle OpenAPI path parameters correctly', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      update: () => ({}),
      openApi: {
        update: {
          summary: 'Update resource',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Success' }
          }
        }
      }
    };

    barabara.registerController(router, '/resources', controller, []);

    // Check that the path parameter was included
    expect(barabara.openApi.paths['/resources/{id}']).to.have.property('put');
    expect(barabara.openApi.paths['/resources/{id}'].put.parameters).to.be.an('array');
    expect(barabara.openApi.paths['/resources/{id}'].put.parameters[0]).to.deep.include({
      name: 'id',
      in: 'path',
      required: true
    });
  });

  it('should handle security requirements in method-specific OpenAPI config', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }],
      security: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          requirements: ['read:api']
        }
      }
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      read: () => ({}),
      update: () => ({}),
      openApi: {
        read: {
          summary: 'Get resource',
          security: [{ bearerAuth: ['read:api'] }]
        },
        update: {
          summary: 'Update resource',
          security: [] // Override global security (no auth required)
        }
      }
    };

    barabara.registerController(router, '/test', controller, []);

    // Check that security was applied to GET but not PUT
    expect(barabara.openApi.paths['/test'].get.security).to.deep.equal([{ bearerAuth: ['read:api'] }]);
    expect(barabara.openApi.paths['/test/{id}'].put.security).to.deep.equal([]);
  });

  it('should merge components from multiple controllers correctly', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller1 = {
      read: () => ({}),
      openApi: {
        components: {
          schemas: {
            Schema1: { type: 'object' }
          },
          responses: {
            Error1: { description: 'Error 1' }
          }
        }
      }
    };

    const controller2 = {
      read: () => ({}),
      openApi: {
        components: {
          schemas: {
            Schema2: { type: 'array' }
          },
          parameters: {
            Param1: { name: 'test', in: 'query' }
          }
        }
      }
    };

    barabara.registerController(router, '/resource1', controller1, []);
    barabara.registerController(router, '/resource2', controller2, []);

    // Check that all components were merged
    expect(barabara.openApi.components.schemas).to.have.property('Schema1');
    expect(barabara.openApi.components.schemas).to.have.property('Schema2');
    expect(barabara.openApi.components.responses).to.have.property('Error1');
    expect(barabara.openApi.components.parameters).to.have.property('Param1');
  });

  it('should handle content type specification in responses', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      read: () => ({}),
      openApi: {
        read: {
          summary: 'Get resource',
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { type: 'object' }
                },
                'application/xml': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      }
    };

    barabara.registerController(router, '/test', controller, []);

    // Check that multiple content types are handled
    const response = barabara.openApi.paths['/test'].get.responses['200'];
    expect(response.content).to.have.property('application/json');
    expect(response.content).to.have.property('application/xml');
  });

  it('should handle createRouter with openapi endpoint', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const mockRoutePath = path.join(__dirname, './mocks');

    // Mock the route generation to avoid file system dependencies
    const originalFindControllers = barabara.findControllers;
    barabara.findControllers = () => [];

    const router = barabara.createRouter(mockRoutePath);

    // Restore original method
    barabara.findControllers = originalFindControllers;

    // Find the OpenAPI endpoint handler
    const openApiRoute = router.stack.find(layer =>
      layer.route && layer.route.path === '/openapi' && layer.route.methods.get);

    // Create a mock response to test the handler
    let responseJson;
    const mockResponse = {
      json: (data) => { responseJson = data; }
    };

    // Execute the handler
    openApiRoute.route.stack[0].handle({}, mockResponse);

    // Verify the response contains the expected OpenAPI schema
    expect(responseJson).to.be.an('object');
    expect(responseJson.openapi).to.equal('3.0.1');
    expect(responseJson.info.title).to.equal('Test API');
    expect(responseJson.info.version).to.equal('1.0.0');
    expect(responseJson.paths).to.be.an('object');
  });
});
// ...existing code...

describe('Barabara Error Handling', () => {
  const actionsMap = {
    read: 'get',
    create: 'post',
    update: 'put',
    partial: 'patch',
    destroy: 'delete'
  };

  it('should handle controller errors properly in route handler', async () => {
    const barabara = new Barabara(Router, actionsMap);
    const expectedError = new Error('Test error');

    const controller = {
      read: () => {
        throw expectedError;
      }
    };

    const handler = barabara.createRouteHandler(controller, 'read', []);
    let nextCalled = false;
    let nextError = null;

    const req = {};
    const res = {};
    const next = (err) => {
      nextCalled = true;
      nextError = err;
    };

    await handler(req, res, next);

    expect(nextCalled).to.equal(true);
    expect(nextError).to.equal(expectedError);
  });

  it('should handle files in request', async () => {
    const barabara = new Barabara(Router, actionsMap);
    let filesReceived = null;

    const controller = {
      create: (options) => {
        filesReceived = options.files;
        return { success: true };
      }
    };

    const handler = barabara.createRouteHandler(controller, 'create', []);
    const mockFiles = {
      data: [
        { filename: 'test.jpg', mimetype: 'image/jpeg', size: 1024 }
      ]
    };

    const req = {
      query: {},
      body: {},
      params: {},
      files: mockFiles
    };

    const res = {
      json: () => {}
    };

    await handler(req, res, () => {});

    expect(filesReceived).to.deep.equal(mockFiles);
  });

  it('should pass meta information to controller methods', async () => {
    const barabara = new Barabara(Router, actionsMap);
    let metaReceived = null;

    const controller = {
      read: (options, meta) => {
        metaReceived = meta;
        return { success: true };
      }
    };

    const handler = barabara.createRouteHandler(controller, 'read', ['user', 'token']);

    const req = {
      query: {},
      body: {},
      params: {},
      user: { id: 1, name: 'Test User' },
      token: 'abc123',
      otherInfo: 'should not be included'
    };

    const res = {
      json: () => {}
    };

    await handler(req, res, () => {});

    expect(metaReceived).to.deep.equal({
      user: { id: 1, name: 'Test User' },
      token: 'abc123'
    });
    expect(metaReceived).to.not.have.property('otherInfo');
  });
});

describe('Barabara OpenAPI Advanced Features', () => {
  const actionsMap = {
    read: 'get',
    create: 'post',
    update: 'put',
    partial: 'patch',
    destroy: 'delete'
  };

  it('should handle OpenAPI tags configuration', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }],
      tags: [
        { name: 'users', description: 'User operations' },
        { name: 'products', description: 'Product operations' }
      ]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);

    expect(barabara.openApi.tags).to.deep.equal([
      { name: 'users', description: 'User operations' },
      { name: 'products', description: 'Product operations' }
    ]);
  });

  it('should handle complex security schemes in OpenAPI config', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }],
      security: {
        oauth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth2/authorize',
              scopes: {
                'read:api': 'Read access',
                'write:api': 'Write access'
              }
            }
          },
          requirements: ['read:api', 'write:api']
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          requirements: ['api_key']
        }
      }
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);

    // Check security schemes
    expect(barabara.openApi.components.securitySchemes).to.have.property('oauth2');
    expect(barabara.openApi.components.securitySchemes.oauth2).to.include({
      type: 'oauth2'
    });
    expect(barabara.openApi.components.securitySchemes.oauth2.flows).to.have.property('implicit');

    expect(barabara.openApi.components.securitySchemes).to.have.property('apiKey');
    expect(barabara.openApi.components.securitySchemes.apiKey).to.include({
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    });

    // Check global security requirements
    expect(barabara.openApi.security).to.deep.equal({
      oauth2: ['read:api', 'write:api'],
      apiKey: ['api_key']
    });
  });

  it('should handle requestBody in controller OpenAPI config', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      create: () => ({}),
      update: () => ({}),
      openApi: {
        create: {
          summary: 'Create resource',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' }
                  },
                  required: ['name', 'email']
                }
              }
            }
          }
        },
        update: {
          summary: 'Update resource',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          }
        }
      }
    };

    barabara.registerController(router, '/test', controller, []);

    // Check create (POST) requestBody
    expect(barabara.openApi.paths['/test'].post.requestBody).to.deep.include({
      required: true
    });
    expect(barabara.openApi.paths['/test'].post.requestBody.content)
      .to.have.property('application/json');
    expect(barabara.openApi.paths['/test'].post.requestBody.content['application/json'].schema)
      .to.have.property('required')
      .that.includes('name', 'email');

    // Check update (PUT) requestBody with different content type
    expect(barabara.openApi.paths['/test/{id}'].put.requestBody).to.deep.include({
      required: true
    });
    expect(barabara.openApi.paths['/test/{id}'].put.requestBody.content)
      .to.have.property('multipart/form-data');
    expect(barabara.openApi.paths['/test/{id}'].put.requestBody.content['multipart/form-data'].schema)
      .to.have.nested.property('properties.file.format', 'binary');
  });

  it('should handle response headers in OpenAPI config', () => {
    const openApiConfig = {
      title: 'Test API',
      version: '1.0.0',
      description: 'Test API description',
      servers: [{ url: 'http://localhost:3000' }]
    };

    const barabara = new Barabara(Router, actionsMap, openApiConfig);
    const router = new Router();

    const controller = {
      create: () => ({}),
      openApi: {
        create: {
          summary: 'Create resource',
          responses: {
            201: {
              description: 'Resource created',
              headers: {
                Location: {
                  schema: { type: 'string' },
                  description: 'URL of the created resource'
                },
                'X-Rate-Limit': {
                  schema: { type: 'integer' },
                  description: 'Rate limit remaining'
                }
              },
              content: {
                'application/json': {
                  schema: { type: 'object' }
                }
              }
            }
          }
        }
      }
    };

    barabara.registerController(router, '/test', controller, []);

    // Check response headers
    const response = barabara.openApi.paths['/test'].post.responses['201'];
    expect(response.headers).to.have.property('Location');
    expect(response.headers).to.have.property('X-Rate-Limit');
    expect(response.headers.Location.description).to.equal('URL of the created resource');
    expect(response.headers['X-Rate-Limit'].schema).to.deep.equal({ type: 'integer' });
  });
});
