# Pipes

## Objective

This is mostly a learning exercise in how to work with node.js and asynchronous javascript.
Much like the Internet and UNIX command line, the framework is made up of pipes.  Each pipe
acts as processing unit that performs a particular function.  The entire request transa 

## Usage

## Routing

All routes are descendants of RegExpRoute, which uses regular expressions to match routes.
GlobRoute and NamedRoute are rewritten as regular expressions using simple rules.  All routes have the
same constructor arguments and methods.

### RegExpRoute

### GlobRoute

### NamedRoute

## Pipeflow

* request
* response
* state
* event
* main

## Pipes

## Events

The Pipes framework will emit certain events

### Framework Events

#### init (Pipes)

This event is emitted during the start() method after the HttpServer is created.

#### listen (Pipes, HttpServer)

This event is emitted during the start() method after the HttpServer is started with listen().

#### connect (Pipes, Request)

This event is emitted at the start of the requestHandler() method.

#### route (Pipes, Request, Route)

This event is emitted during the requestHandler() method after the route matching has occurred.  If no
route matched, then Route will be null.

### Pipeflow Events

These events will be emitted as a request goes through its pipeflow.

#### next (Pipeflow)

#### error (Pipeflow, Error)

#### done (Pipeflow)

## Dependencies

* mime
* strftime
* winston

Created with [Nodeclipse v0.4](https://github.com/Nodeclipse/nodeclipse-1)
 ([Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse), [site](http://www.nodeclipse.org))   

TODO
