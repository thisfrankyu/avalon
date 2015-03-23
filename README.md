# avalon

## Prerequisites
* Node.js / NPM

* Grunt (`npm install -g grunt grunt-cli`)

* Bower (`npm install -g bower`)

* Yeoman (`npm install -g yo generator-angular-fullstack`) (for development only)

## Installation
* Run `git clone https://github.com/frankisblissful/avalon.git`

* Run `npm install`

* Run `bower install`

* Run `npm run-script update-webdriver` (if running End to End tests)

## Running (development)
Run `grunt serve`

## Building (production)
To build: `grunt`

To build and serve: `grunt serve:dist` (not recommended for actual production)

## Testing
* Server: `npm test`

* Client: `grunt test:client`

* End to End: `grunt test:e2e`
