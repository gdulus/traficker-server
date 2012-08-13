(ns client.scene
  (:require [jc :as jcanvas]
            [client.const :as const]
            [goog.dom :as dom]))

(defn buildKey [lat lng]
  (symbol (+ lat "#" lng)))

(deftype Scene[registry]
  Object
    (update [_ lat lng size]
      (let [key (buildKey lat lng)]
        (do
          (if (not (contains? registry key))
            (conj registry [key (jcanvas/circle lat lng 1 "#ff0000" true)]))
          (.draw (registry key) size))))

    (remove [_ lat lng]
      (let [key (buildKey lat lng)]
        (if (contains? registry key)
          (do
            (.del (registry key))
            (dissoc registry key))))))

(def $ (Scene. {}))

(defn testAnimation []
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

(defn init [parent]
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
