load('vertx.js');

/**
 * Event bus
 */
var eb = vertx.eventBus;

/**
 * TCP server
 */
var tcpServer = vertx.createNetServer();

tcpServer.connectHandler(function(sock) {
    sock.dataHandler(function(buffer) {

    });
});

stdout.println("Starting TCP listening on port " + vertx.config.host + ":" + vertx.config.port);
tcpServer.listen(vertx.config.port, vertx.config.host);