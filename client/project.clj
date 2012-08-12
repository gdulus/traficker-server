(defproject pl.burningice/traficker "1.2.3"
  :dependencies [[org.clojure/clojure "1.4.0"]]
  :plugins [[lein-cljsbuild "0.2.5"]]
  :cljsbuild {
    :builds [{
      :source-path "src-cljs"
      :incremental true
      :compiler {
        :output-to "js/main-clj.js"
        :optimizations :whitespace
        :pretty-print true
        :warnings true
        :foreign-libs [{:file "js/vertxbus.js" :provides ["vertx"]}
                       {:file "js/jcscript.js" :provides ["jc"]}
                       {:file "http://maps.googleapis.com/maps/api/js?key=AIzaSyAwWbI4MbAIUbykt_X3YhoRvHyUTkv-E9I&sensor=false" :provides ["google.maps"]}]
      }
    }]
  }
)