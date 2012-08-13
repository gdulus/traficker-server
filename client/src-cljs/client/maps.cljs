(ns client.maps
  (:require [vertx]
            [client.const :as const]
            [client.scene :as scene]
            [goog.dom :as dom]
            [google.maps]))

(defn getBoundsFromResults[results]
  (.-bounds (.-geometry (nth results 0))))

(defn init[]
  (let [mapContainer (dom/getElement (const/maps :map_id))
        mapConfig (js-obj "mapTypeId" (.-ROADMAP google.maps.MapTypeId) "disableDefaultUI" true)
        geocoderConfig (js-obj "address" (const/maps :country))
        geocoder (google.maps.Geocoder.)
        map (google.maps.Map. mapContainer mapConfig)]
    (.geocode geocoder geocoderConfig (fn [results status] (if (= status (.-OK google.maps.GeocoderStatus))
                                                             (do
                                                               (.fitBounds map (getBoundsFromResults results))
                                                               (scene/init mapContainer)))))
    nil))
