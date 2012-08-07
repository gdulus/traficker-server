(ns client.core
  (:require [vertx]
            [client.utils :as utils]
            [client.const :as const]
            [clojure.browser.dom :as dom]
            [google.maps]))

(defn mainEveneHandller[event]
  (utils/log-obj event))


(defn initMap[]
  (let [mapContainer (dom/get-element "map_canvas")
        mapConfig (js-obj "center" (google.maps.LatLng. (const/initial_position :lat) (const/initial_position :lng))
                          "zoom" 8
                          "mapTypeId" (.-ROADMAP google.maps.MapTypeId))]
    (google.maps.Map. mapContainer mapConfig)))

(defn ^:export main[]
  (let [eb (vertx.EventBus. "http://localhost:8081/eventbus")]
    (set! (.-onopen eb) #(do
                           (.registerHandler eb "browser.tcp" mainEveneHandller)
                           (initMap)))
    eb))