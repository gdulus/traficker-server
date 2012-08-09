(ns client.core
  (:require [vertx]
            [client.utils :as utils]
            [client.const :as const]
            [goog.dom :as dom]
            [goog.style :as style]
            [google.maps]))

(defn- mainEveneHandller[event]
  (utils/log-obj event))

(defn- getBoundsFromResults[results]
  (.-bounds (.-geometry (nth results 0))))

(defn- initializeCanvas [parent]
  (let [canvas_name (const/maps :overlay_id)
        attr (js-obj "class" canvas_name "id" canvas_name)
        viewPortSize (dom/getViewportSize)
        canvas (dom/createDom "canvas" attr nil)]
    (do
      (dom/insertSiblingBefore canvas parent)
      (style/setSize canvas viewPortSize))
    canvas))

(defn- initMap[]
  (let [mapContainer (dom/getElement "map_canvas")
        mapConfig (js-obj "mapTypeId" (.-ROADMAP google.maps.MapTypeId))
        geocoderConfig (js-obj "address" (const/maps :country))
        geocoder (google.maps.Geocoder.)
        map (google.maps.Map. mapContainer mapConfig)]
    (.geocode geocoder geocoderConfig (fn [results status] (if (= status (.-OK google.maps.GeocoderStatus))
                                                             (do
                                                               (.fitBounds map (getBoundsFromResults results))
                                                               (initializeCanvas mapContainer)))))
    nil))

(defn ^:export main[]
  (let [eb (vertx.EventBus. "http://localhost:8081/eventbus")]
    (set! (.-onopen eb) #(do
                           (comment(.registerHandler eb "browser.tcp" mainEveneHandller))
                           (initMap)))
    nil))