(ns client.core
  (:require [vertx]))

(defn mainEveneHandller[event]
  ())

(defn ^:export main[]
  (let [eb (vertx.EventBus.)]
    (set! (.onopen eb) #())
    eb))