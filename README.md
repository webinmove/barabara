# Barabara

[![CircleCI](https://circleci.com/gh/webinmove/barabara.svg?style=svg)](https://circleci.com/gh/webinmove/barabara)
[![Coverage Status](https://coveralls.io/repos/github/webinmove/barabara/badge.svg?branch=master)](https://coveralls.io/github/webinmove/barabara?branch=master)
[![npm version](https://img.shields.io/npm/v/barabara.svg)](https://www.npmjs.com/package/barabara)
[![Dependency Status](https://img.shields.io/david/webinmove/barabara.svg?style=flat-square)](https://david-dm.org/webinmove/barabara)

Automatic express-router from generic controllers

Barabara will automatically create one or more Express router for you reading the content of your controller folder(s).

## Installation

```sh
$ npm install barabara
```

## Usage

### Import in your project
```js
// require Barabara
const { Barabara } = require('barabara');
// import Barabara
import { Barabara } from 'barabara';
```

### Create an instance

```js
const express = require('express');

const barabara = new Barabara(
  // Router class
  express.Router,
  // Mapping between controller actions & http verbs
  {
    exists: 'head',
    read: 'get',
    create: 'post',
    update: 'put',
    partial: 'patch',
    destroy: 'delete'
  }
);
```

With this mapping Barabara will look up for corresponding controller actions and create the following routes:

- **HEAD** `/my-controller` will call myController.exists(params, meta)
- **HEAD** `/my-controller/:id` will call myController.exists(params, meta)
- **GET** `/my-controller` will call myController.read(params, meta)
- **GET** `/my-controller/:id` will call myController.read(params, meta)
- **POST** `/my-controller` will call myController.create(params, meta)
- **PUT** `/my-controller/:id` will call myController.update(params, meta)
- **PATCH** `/my-controller/:id` will call myController.partial(params, meta)
- **DELETE** `/my-controller/:id` will call myController.destroy(params, meta)

### Create routers

```js
  // Here we add req.user in meta parameter of controller actions methods
  const authRouter = barabara.createRouter(path.join(__dirname, 'controllers/auth'), [ 'user' ]);
  const v1ApiRouter = barabara.createRouter(path.join(__dirname, 'controllers/v1'));
  const v2ApiRouter = barabara.createRouter(path.join(__dirname, 'controllers/v2'));

  const app = express();

  app.use('/auth', authRouter);
  app.use('/v1', authMiddleware, v1ApiRouter);
  app.use('/v2', authMiddleware, v2ApiRouter);
```

### Expectation

Barabara expect controller action's methods to have the following signature:

`actionName(params: Object, meta: Object)`

Exemple of controller implementation :

```js
module.exports = {
  exists: async (params, meta) => { /* ... */ },
  read: async (params, meta) => { /* ... */ },
  create: async (params, meta) => { /* ... */ },
  update: async (params, meta) => { /* ... */ },
  partial: async (params, meta) => { /* ... */ },
  destroy: async (params, meta) => { /* ... */ },
  // This won't be mapped to a route
  internal: () => { /* ... */ }
};
```

#### Return behaviors

- If you return an object without `redirect` key in it, it will respond JSON
- If you return an object with `redirect` key in it, it will redirect to the value
- If you return a non-object, it will respond this non-object (html for example)

*Note: not all the methods need to be implemented*

`req.query`, `req.body`, `req.params` will be merged in `params` (in this order).
While `meta` will contains other `req` properties if specified in `createRouter`.
`meta` will contain `req.user` here:

```js
const authRouter = barabara.createRouter(
  path.join(__dirname, 'controllers/auth'), [ 'user' ]
);
```

## Npm scripts

### Running code formating

```sh
$ npm run format
```

### Running tests

```sh
$ npm test
```

### Running lint tests

```sh
$ npm test:lint
```

### Running coverage tests

```sh
$ npm test:cover
```

This will create a coverage folder with all the report in `coverage/index.html`

### Running all tests

```sh
$ npm test:all
```

*Note: that's the one you want to use most of the time*

## Reporting bugs and contributing

If you want to report a bug or request a feature, please open an issue.
If want to help us improve barabara, fork and make a pull request.
Please use commit format as described [here](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).
And don't forget to run `npm run format` before pushing commit.

## Repository

- [https://github.com/webinmove/barabara](https://github.com/webinmove/barabara)

## License

The MIT License (MIT)

Copyright (c) 2019 WebInMove

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
