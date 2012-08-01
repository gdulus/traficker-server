#!/bin/bash
SCRIPT=`readlink -f $0`
SCRIPTPATH=`dirname $SCRIPT`
vertx run $SCRIPTPATH/server/run.js -conf $SCRIPTPATH/config/config.js
