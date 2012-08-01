load('vertx.js');

/**
 * Event bus
 */
//var eb = vertx.eventBus;

/**
 * Initialize MongoDB
 */
//var mongoConfig = {
//    address: 'vertx.mongopersistor',
//    host: 'localhost',
//    port: 27017,
//    db_name: 'vertx'
//}
//
//vertx.deployModule('vertx.mongo-persistor-v1.0', mongoConfig, 1, function(){
//    stdout.println('vertx.mongo-persistor-v1.0 ready');
//});

vertx.deployVerticle('server/tcpServer.js', vertx.config.tcp_server, 10, function() {
    stdout.println("TCP verticles deployed. Starting http verticle.");
    vertx.deployVerticle('server/httpServer.js', vertx.config.http_server, 1, function(){
        stdout.println("HTTP verticle deployed. Server running on http://" + vertx.config.http_server.host + ":" + vertx.config.http_server.port);
    });
});

