load('vertx.js');

/**
 * Event bus
 */
var eb = vertx.eventBus;

/**
 * Initialize MongoDB
 */
var mongoConfig = {
    address: 'vertx.mongopersistor',
    host: 'localhost',
    port: 27017,
    db_name: 'default_db'
};

vertx.deployModule('vertx.mongo-persistor-v1.1', mongoConfig, 1, function(){

    var map = "function(){" +
        "var key = {a:this.a, b:this.b};" +
        "emit(key, 1)" +
    "}";

    var reduce = 'function(k, vals){' +
        'var sum = 0;' +
        'for(var i in vals) sum += vals[i];' +
        'return sum;' +
    '}';

    eb.send('vertx.mongopersistor', {action: 'mapReduce', collection: 'albums', map: map, reduce: reduce, matcher: {}}, function(replay) {
        stdout.println(JSON.stringify(replay.completion.results));
    });


});

vertx.deployVerticle('server/tcpServer.js', vertx.config.tcp_server, 1, function() {
    stdout.println("TCP verticles deployed. Starting http verticle.");
    vertx.deployVerticle('server/httpServer.js', vertx.config.http_server, 1, function(){
        stdout.println("HTTP verticle deployed. Server running on http://" + vertx.config.http_server.host + ":" + vertx.config.http_server.port);
    });
});

