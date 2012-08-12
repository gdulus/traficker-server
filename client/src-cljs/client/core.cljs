(ns client.core
  (:require [vertx]
            [jc :as jcanvas]
            [client.utils :as utils]
            [client.const :as const]
            [goog.dom :as dom]
            [goog.style :as style]
            [google.maps]))

(def context {:map nil :canvas nil})

(defn- testAnimation []
  (let [viewPortSize (dom/getViewportSize)
        maxW (.-width viewPortSize)
        maxH (.-height viewPortSize)
        r (.floor js/Math (* (.random js/Math) 254))
        g (.floor js/Math (* (.random js/Math) 254))
        b (.floor js/Math (* (.random js/Math) 254))
        x (.floor js/Math (* (.random js/Math) maxW))
        y (.floor js/Math (* (.random js/Math) maxH))
        color (+ "rgba("  r ","  g ","  b ",1)")]
    (..
      (jcanvas/circle x y 1 color true)
      (animate (js-obj "radius" 100 "opacity" 0) 500 #(this-as self (.del self))))
    nil))

(defn- initCanvas [parent]
  (let [canvas_name (const/maps :overlay_id)
        attr (js-obj "class" canvas_name "id" canvas_name)
        viewPortSize (dom/getViewportSize)
        canvas (dom/createDom "canvas" attr nil)]
    (do
      (dom/insertSiblingBefore canvas parent)
      (set! (.-width canvas) (.-width viewPortSize))
      (set! (.-height canvas) (.-height viewPortSize))
      (jcanvas/start canvas_name true)
      (js/setInterval testAnimation))
    nil))

(defn- getBoundsFromResults[results]
  (.-bounds (.-geometry (nth results 0))))

(defn- initMap[]
  (let [mapContainer (dom/getElement (const/maps :map_id))
        mapConfig (js-obj "mapTypeId" (.-ROADMAP google.maps.MapTypeId) "disableDefaultUI" true)
        geocoderConfig (js-obj "address" (const/maps :country))
        geocoder (google.maps.Geocoder.)
        map (google.maps.Map. mapContainer mapConfig)]
    (.geocode geocoder geocoderConfig (fn [results status] (if (= status (.-OK google.maps.GeocoderStatus))
                                                             (do
                                                               (.fitBounds map (getBoundsFromResults results))
                                                               (initCanvas mapContainer)))))
    nil))

(defn- serverPushHandler[event]
  (utils/log-obj event))

(defn ^:export main[]
  (let [eb (vertx.EventBus. (const/push :server_address))]
    (set! (.-onopen eb) #(do
                           (comment(.registerHandler eb (const/push :bus_name) serverPushHandler))
                           (initMap)))
    nil))