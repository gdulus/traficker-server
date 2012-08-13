(ns client.core
  (:require [vertx]
            [client.utils :as utils]
            [client.const :as const]
            [client.scene :as scene]
            [client.maps :as maps]))

(defn serverPushHandler[event]
  (do
    (utils/log-obj event)
    (.update scene/$ event[0] event[1] event[2])
    nil))

(defn ^:export main[]
  (let [eb (vertx.EventBus. (const/push :server_address))]
    (set! (.-onopen eb) #(do
                           (comment(.registerHandler eb (const/push :bus_name) serverPushHandler))
                           (maps/init)))
    nil))