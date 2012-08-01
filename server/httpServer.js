load('vertx.js');

/**
 * HTTP server setting
 */
var httpServer = vertx.createHttpServer();

httpServer.requestHandler(function(req) {
    var file = '';

    if (req.path == '/') {
        file = 'index.html';
    } else if (req.path.indexOf('..') == -1) {
        file = req.path;
    }

    req.response.sendFile('client/' + file);
});

/**
 * SockJSServer server setting
 */
var sockJSServer = vertx.createSockJSServer(httpServer);
sockJSServer.bridge({prefix : '/eventbus'}, [], [] );


/**
 * Start listening
 */
stdout.println("Starting http listening on port " + vertx.config.port);
httpServer.listen(vertx.config.port);