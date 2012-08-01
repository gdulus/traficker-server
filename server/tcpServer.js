load('vertx.js');

/**
 * TCP server
 */
var tcpServer = vertx.createNetServer();

tcpServer.connectHandler(function(sock) {

    sock.dataHandler(function(buffer) {
        stdout.println("Hello from the verticle");
    });
});

stdout.println("Starting tcp listening on port " + vertx.config.port);
tcpServer.listen(1234, 'localhost');