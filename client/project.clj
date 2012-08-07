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
        :foreign-libs [{:file "js/vertxbus.js" :provides  ["vertx"]}]
      }
    }]
  }
)