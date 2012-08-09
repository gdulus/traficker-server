(ns client.core
  (:require [vertx]
            [client.utils :as utils]
            [client.const :as const]
            [clojure.browser.dom :as dom]
            [google.maps]))

(defn- mainEveneHandller[event]
  (utils/log-obj event))

(defn- getBoundsFromResults[results]
  (.-bounds (.-geometry (nth results 0))))

(defn- initMap[]
  (let [mapContainer (dom/get-element "map_canvas")
        mapConfig (js-obj "mapTypeId" (.-ROADMAP google.maps.MapTypeId))
        geocoderConfig (js-obj "address" (const/maps :default_country))
        geocoder (google.maps.Geocoder.)
        map (google.maps.Map. mapContainer mapConfig)]
    (.geocode geocoder geocoderConfig (fn [results status] (if (= status (.-OK google.maps.GeocoderStatus))
                                                             (.fitBounds map (getBoundsFromResults results)))))
    nil))

(defn ^:export main[]
  (let [eb (vertx.EventBus. "http://localhost:8081/eventbus")]
    (set! (.-onopen eb) #(do
                           (comment(.registerHandler eb "browser.tcp" mainEveneHandller))
                           (initMap)))
    nil))