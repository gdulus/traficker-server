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

/**
 * Prepare Map/Reduce functions
 */

var map = "function(){" +
    "var key = {lng: this.lng, lat:this.lat};" +
    "emit(key, 1)" +
"}";

var reduce = 'function(k, vals){' +
    'var sum = 0;' +
    'for(var i in vals) sum += vals[i];' +
    'return sum;' +
'}';

var queryOffset = vertx.config.general.offset

// initialize mongodb module
vertx.deployModule('vertx.mongo-persistor-v1.1', mongoConfig, 1, function(){
    // initialize tcp servers
    vertx.deployVerticle('server/tcpServer.js', vertx.config.tcp_server, 1, function() {
        stdout.println("TCP verticles deployed. Starting http verticle.");
    });
    // initialize http server
    vertx.deployVerticle('server/httpServer.js', vertx.config.http_server, 1, function(){
        stdout.println("HTTP verticle deployed. Server running on http://" + vertx.config.http_server.host + ":" + vertx.config.http_server.port);
        // prepare start date used in map reduce query
        var start = new Date().getTime() - queryOffset
        // prepare handler that will execute quearing for data
        var handler = function(replay){
            if (replay) {
                eb.send('browser.tcp', {result:replay.completion.results});
            }

            vertx.setTimer(500, function() {
                var now = new Date().getTime() - queryOffset
                var matcher = {$and:[{timestamp:{$gte:start}}, {timestamp:{$lt:now}}]}
                eb.send('vertx.mongopersistor', {action: 'mapReduce', collection: 'traffic', map: map, reduce: reduce, matcher: matcher}, function(replay){
                    start = now;
                    handler(replay)
                });
            });
        };
        // start handler
        handler(null)
    });
});

