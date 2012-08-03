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
        if (buffer.length() > 0){
            var bufferAsString = buffer.toString()
            if (!!bufferAsString){
                stdout.println("handled '" + bufferAsString + "'");
                var data = JSON.parse(bufferAsString);
                eb.send('vertx.mongopersistor', {action: 'save', collection: 'traffic', document: data});
            } else {
                stdout.println("invalid data " + bufferAsString);
            }
        }
    });
});

stdout.println("Starting TCP listening on port " + vertx.config.host + ":" + vertx.config.port);
tcpServer.listen(vertx.config.port, vertx.config.host);