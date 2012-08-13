var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6165 = x == null ? null : x;
  if(p[goog.typeOf(x__6165)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6166__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6166 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6166__delegate.call(this, array, i, idxs)
    };
    G__6166.cljs$lang$maxFixedArity = 2;
    G__6166.cljs$lang$applyTo = function(arglist__6167) {
      var array = cljs.core.first(arglist__6167);
      var i = cljs.core.first(cljs.core.next(arglist__6167));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6167));
      return G__6166__delegate(array, i, idxs)
    };
    G__6166.cljs$lang$arity$variadic = G__6166__delegate;
    return G__6166
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6252 = this$;
      if(and__3822__auto____6252) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6252
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2391__auto____6253 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6254 = cljs.core._invoke[goog.typeOf(x__2391__auto____6253)];
        if(or__3824__auto____6254) {
          return or__3824__auto____6254
        }else {
          var or__3824__auto____6255 = cljs.core._invoke["_"];
          if(or__3824__auto____6255) {
            return or__3824__auto____6255
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6256 = this$;
      if(and__3822__auto____6256) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6256
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2391__auto____6257 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6258 = cljs.core._invoke[goog.typeOf(x__2391__auto____6257)];
        if(or__3824__auto____6258) {
          return or__3824__auto____6258
        }else {
          var or__3824__auto____6259 = cljs.core._invoke["_"];
          if(or__3824__auto____6259) {
            return or__3824__auto____6259
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6260 = this$;
      if(and__3822__auto____6260) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6260
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2391__auto____6261 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6262 = cljs.core._invoke[goog.typeOf(x__2391__auto____6261)];
        if(or__3824__auto____6262) {
          return or__3824__auto____6262
        }else {
          var or__3824__auto____6263 = cljs.core._invoke["_"];
          if(or__3824__auto____6263) {
            return or__3824__auto____6263
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6264 = this$;
      if(and__3822__auto____6264) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6264
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2391__auto____6265 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6266 = cljs.core._invoke[goog.typeOf(x__2391__auto____6265)];
        if(or__3824__auto____6266) {
          return or__3824__auto____6266
        }else {
          var or__3824__auto____6267 = cljs.core._invoke["_"];
          if(or__3824__auto____6267) {
            return or__3824__auto____6267
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6268 = this$;
      if(and__3822__auto____6268) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6268
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2391__auto____6269 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6270 = cljs.core._invoke[goog.typeOf(x__2391__auto____6269)];
        if(or__3824__auto____6270) {
          return or__3824__auto____6270
        }else {
          var or__3824__auto____6271 = cljs.core._invoke["_"];
          if(or__3824__auto____6271) {
            return or__3824__auto____6271
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6272 = this$;
      if(and__3822__auto____6272) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6272
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2391__auto____6273 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6274 = cljs.core._invoke[goog.typeOf(x__2391__auto____6273)];
        if(or__3824__auto____6274) {
          return or__3824__auto____6274
        }else {
          var or__3824__auto____6275 = cljs.core._invoke["_"];
          if(or__3824__auto____6275) {
            return or__3824__auto____6275
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6276 = this$;
      if(and__3822__auto____6276) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6276
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2391__auto____6277 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6278 = cljs.core._invoke[goog.typeOf(x__2391__auto____6277)];
        if(or__3824__auto____6278) {
          return or__3824__auto____6278
        }else {
          var or__3824__auto____6279 = cljs.core._invoke["_"];
          if(or__3824__auto____6279) {
            return or__3824__auto____6279
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6280 = this$;
      if(and__3822__auto____6280) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6280
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2391__auto____6281 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6282 = cljs.core._invoke[goog.typeOf(x__2391__auto____6281)];
        if(or__3824__auto____6282) {
          return or__3824__auto____6282
        }else {
          var or__3824__auto____6283 = cljs.core._invoke["_"];
          if(or__3824__auto____6283) {
            return or__3824__auto____6283
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6284 = this$;
      if(and__3822__auto____6284) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6284
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2391__auto____6285 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6286 = cljs.core._invoke[goog.typeOf(x__2391__auto____6285)];
        if(or__3824__auto____6286) {
          return or__3824__auto____6286
        }else {
          var or__3824__auto____6287 = cljs.core._invoke["_"];
          if(or__3824__auto____6287) {
            return or__3824__auto____6287
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6288 = this$;
      if(and__3822__auto____6288) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6288
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2391__auto____6289 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6290 = cljs.core._invoke[goog.typeOf(x__2391__auto____6289)];
        if(or__3824__auto____6290) {
          return or__3824__auto____6290
        }else {
          var or__3824__auto____6291 = cljs.core._invoke["_"];
          if(or__3824__auto____6291) {
            return or__3824__auto____6291
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6292 = this$;
      if(and__3822__auto____6292) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6292
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2391__auto____6293 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6294 = cljs.core._invoke[goog.typeOf(x__2391__auto____6293)];
        if(or__3824__auto____6294) {
          return or__3824__auto____6294
        }else {
          var or__3824__auto____6295 = cljs.core._invoke["_"];
          if(or__3824__auto____6295) {
            return or__3824__auto____6295
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6296 = this$;
      if(and__3822__auto____6296) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6296
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2391__auto____6297 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6298 = cljs.core._invoke[goog.typeOf(x__2391__auto____6297)];
        if(or__3824__auto____6298) {
          return or__3824__auto____6298
        }else {
          var or__3824__auto____6299 = cljs.core._invoke["_"];
          if(or__3824__auto____6299) {
            return or__3824__auto____6299
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6300 = this$;
      if(and__3822__auto____6300) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6300
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2391__auto____6301 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6302 = cljs.core._invoke[goog.typeOf(x__2391__auto____6301)];
        if(or__3824__auto____6302) {
          return or__3824__auto____6302
        }else {
          var or__3824__auto____6303 = cljs.core._invoke["_"];
          if(or__3824__auto____6303) {
            return or__3824__auto____6303
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6304 = this$;
      if(and__3822__auto____6304) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6304
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2391__auto____6305 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6306 = cljs.core._invoke[goog.typeOf(x__2391__auto____6305)];
        if(or__3824__auto____6306) {
          return or__3824__auto____6306
        }else {
          var or__3824__auto____6307 = cljs.core._invoke["_"];
          if(or__3824__auto____6307) {
            return or__3824__auto____6307
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6308 = this$;
      if(and__3822__auto____6308) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6308
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2391__auto____6309 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6310 = cljs.core._invoke[goog.typeOf(x__2391__auto____6309)];
        if(or__3824__auto____6310) {
          return or__3824__auto____6310
        }else {
          var or__3824__auto____6311 = cljs.core._invoke["_"];
          if(or__3824__auto____6311) {
            return or__3824__auto____6311
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6312 = this$;
      if(and__3822__auto____6312) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6312
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2391__auto____6313 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6314 = cljs.core._invoke[goog.typeOf(x__2391__auto____6313)];
        if(or__3824__auto____6314) {
          return or__3824__auto____6314
        }else {
          var or__3824__auto____6315 = cljs.core._invoke["_"];
          if(or__3824__auto____6315) {
            return or__3824__auto____6315
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6316 = this$;
      if(and__3822__auto____6316) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6316
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2391__auto____6317 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6318 = cljs.core._invoke[goog.typeOf(x__2391__auto____6317)];
        if(or__3824__auto____6318) {
          return or__3824__auto____6318
        }else {
          var or__3824__auto____6319 = cljs.core._invoke["_"];
          if(or__3824__auto____6319) {
            return or__3824__auto____6319
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6320 = this$;
      if(and__3822__auto____6320) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6320
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2391__auto____6321 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6322 = cljs.core._invoke[goog.typeOf(x__2391__auto____6321)];
        if(or__3824__auto____6322) {
          return or__3824__auto____6322
        }else {
          var or__3824__auto____6323 = cljs.core._invoke["_"];
          if(or__3824__auto____6323) {
            return or__3824__auto____6323
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6324 = this$;
      if(and__3822__auto____6324) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6324
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2391__auto____6325 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6326 = cljs.core._invoke[goog.typeOf(x__2391__auto____6325)];
        if(or__3824__auto____6326) {
          return or__3824__auto____6326
        }else {
          var or__3824__auto____6327 = cljs.core._invoke["_"];
          if(or__3824__auto____6327) {
            return or__3824__auto____6327
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6328 = this$;
      if(and__3822__auto____6328) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6328
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2391__auto____6329 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6330 = cljs.core._invoke[goog.typeOf(x__2391__auto____6329)];
        if(or__3824__auto____6330) {
          return or__3824__auto____6330
        }else {
          var or__3824__auto____6331 = cljs.core._invoke["_"];
          if(or__3824__auto____6331) {
            return or__3824__auto____6331
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6332 = this$;
      if(and__3822__auto____6332) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6332
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2391__auto____6333 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6334 = cljs.core._invoke[goog.typeOf(x__2391__auto____6333)];
        if(or__3824__auto____6334) {
          return or__3824__auto____6334
        }else {
          var or__3824__auto____6335 = cljs.core._invoke["_"];
          if(or__3824__auto____6335) {
            return or__3824__auto____6335
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6340 = coll;
    if(and__3822__auto____6340) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6340
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2391__auto____6341 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6342 = cljs.core._count[goog.typeOf(x__2391__auto____6341)];
      if(or__3824__auto____6342) {
        return or__3824__auto____6342
      }else {
        var or__3824__auto____6343 = cljs.core._count["_"];
        if(or__3824__auto____6343) {
          return or__3824__auto____6343
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6348 = coll;
    if(and__3822__auto____6348) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6348
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2391__auto____6349 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6350 = cljs.core._empty[goog.typeOf(x__2391__auto____6349)];
      if(or__3824__auto____6350) {
        return or__3824__auto____6350
      }else {
        var or__3824__auto____6351 = cljs.core._empty["_"];
        if(or__3824__auto____6351) {
          return or__3824__auto____6351
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6356 = coll;
    if(and__3822__auto____6356) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6356
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2391__auto____6357 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6358 = cljs.core._conj[goog.typeOf(x__2391__auto____6357)];
      if(or__3824__auto____6358) {
        return or__3824__auto____6358
      }else {
        var or__3824__auto____6359 = cljs.core._conj["_"];
        if(or__3824__auto____6359) {
          return or__3824__auto____6359
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6368 = coll;
      if(and__3822__auto____6368) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6368
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2391__auto____6369 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6370 = cljs.core._nth[goog.typeOf(x__2391__auto____6369)];
        if(or__3824__auto____6370) {
          return or__3824__auto____6370
        }else {
          var or__3824__auto____6371 = cljs.core._nth["_"];
          if(or__3824__auto____6371) {
            return or__3824__auto____6371
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6372 = coll;
      if(and__3822__auto____6372) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6372
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2391__auto____6373 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6374 = cljs.core._nth[goog.typeOf(x__2391__auto____6373)];
        if(or__3824__auto____6374) {
          return or__3824__auto____6374
        }else {
          var or__3824__auto____6375 = cljs.core._nth["_"];
          if(or__3824__auto____6375) {
            return or__3824__auto____6375
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6380 = coll;
    if(and__3822__auto____6380) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6380
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2391__auto____6381 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6382 = cljs.core._first[goog.typeOf(x__2391__auto____6381)];
      if(or__3824__auto____6382) {
        return or__3824__auto____6382
      }else {
        var or__3824__auto____6383 = cljs.core._first["_"];
        if(or__3824__auto____6383) {
          return or__3824__auto____6383
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6388 = coll;
    if(and__3822__auto____6388) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6388
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2391__auto____6389 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6390 = cljs.core._rest[goog.typeOf(x__2391__auto____6389)];
      if(or__3824__auto____6390) {
        return or__3824__auto____6390
      }else {
        var or__3824__auto____6391 = cljs.core._rest["_"];
        if(or__3824__auto____6391) {
          return or__3824__auto____6391
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6396 = coll;
    if(and__3822__auto____6396) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6396
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2391__auto____6397 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6398 = cljs.core._next[goog.typeOf(x__2391__auto____6397)];
      if(or__3824__auto____6398) {
        return or__3824__auto____6398
      }else {
        var or__3824__auto____6399 = cljs.core._next["_"];
        if(or__3824__auto____6399) {
          return or__3824__auto____6399
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6408 = o;
      if(and__3822__auto____6408) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6408
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2391__auto____6409 = o == null ? null : o;
      return function() {
        var or__3824__auto____6410 = cljs.core._lookup[goog.typeOf(x__2391__auto____6409)];
        if(or__3824__auto____6410) {
          return or__3824__auto____6410
        }else {
          var or__3824__auto____6411 = cljs.core._lookup["_"];
          if(or__3824__auto____6411) {
            return or__3824__auto____6411
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6412 = o;
      if(and__3822__auto____6412) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6412
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2391__auto____6413 = o == null ? null : o;
      return function() {
        var or__3824__auto____6414 = cljs.core._lookup[goog.typeOf(x__2391__auto____6413)];
        if(or__3824__auto____6414) {
          return or__3824__auto____6414
        }else {
          var or__3824__auto____6415 = cljs.core._lookup["_"];
          if(or__3824__auto____6415) {
            return or__3824__auto____6415
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6420 = coll;
    if(and__3822__auto____6420) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6420
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2391__auto____6421 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6422 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2391__auto____6421)];
      if(or__3824__auto____6422) {
        return or__3824__auto____6422
      }else {
        var or__3824__auto____6423 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6423) {
          return or__3824__auto____6423
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6428 = coll;
    if(and__3822__auto____6428) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6428
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2391__auto____6429 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6430 = cljs.core._assoc[goog.typeOf(x__2391__auto____6429)];
      if(or__3824__auto____6430) {
        return or__3824__auto____6430
      }else {
        var or__3824__auto____6431 = cljs.core._assoc["_"];
        if(or__3824__auto____6431) {
          return or__3824__auto____6431
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6436 = coll;
    if(and__3822__auto____6436) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6436
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2391__auto____6437 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6438 = cljs.core._dissoc[goog.typeOf(x__2391__auto____6437)];
      if(or__3824__auto____6438) {
        return or__3824__auto____6438
      }else {
        var or__3824__auto____6439 = cljs.core._dissoc["_"];
        if(or__3824__auto____6439) {
          return or__3824__auto____6439
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6444 = coll;
    if(and__3822__auto____6444) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6444
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2391__auto____6445 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6446 = cljs.core._key[goog.typeOf(x__2391__auto____6445)];
      if(or__3824__auto____6446) {
        return or__3824__auto____6446
      }else {
        var or__3824__auto____6447 = cljs.core._key["_"];
        if(or__3824__auto____6447) {
          return or__3824__auto____6447
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6452 = coll;
    if(and__3822__auto____6452) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6452
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2391__auto____6453 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6454 = cljs.core._val[goog.typeOf(x__2391__auto____6453)];
      if(or__3824__auto____6454) {
        return or__3824__auto____6454
      }else {
        var or__3824__auto____6455 = cljs.core._val["_"];
        if(or__3824__auto____6455) {
          return or__3824__auto____6455
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6460 = coll;
    if(and__3822__auto____6460) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6460
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2391__auto____6461 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6462 = cljs.core._disjoin[goog.typeOf(x__2391__auto____6461)];
      if(or__3824__auto____6462) {
        return or__3824__auto____6462
      }else {
        var or__3824__auto____6463 = cljs.core._disjoin["_"];
        if(or__3824__auto____6463) {
          return or__3824__auto____6463
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6468 = coll;
    if(and__3822__auto____6468) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6468
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2391__auto____6469 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6470 = cljs.core._peek[goog.typeOf(x__2391__auto____6469)];
      if(or__3824__auto____6470) {
        return or__3824__auto____6470
      }else {
        var or__3824__auto____6471 = cljs.core._peek["_"];
        if(or__3824__auto____6471) {
          return or__3824__auto____6471
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6476 = coll;
    if(and__3822__auto____6476) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6476
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2391__auto____6477 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6478 = cljs.core._pop[goog.typeOf(x__2391__auto____6477)];
      if(or__3824__auto____6478) {
        return or__3824__auto____6478
      }else {
        var or__3824__auto____6479 = cljs.core._pop["_"];
        if(or__3824__auto____6479) {
          return or__3824__auto____6479
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6484 = coll;
    if(and__3822__auto____6484) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6484
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2391__auto____6485 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6486 = cljs.core._assoc_n[goog.typeOf(x__2391__auto____6485)];
      if(or__3824__auto____6486) {
        return or__3824__auto____6486
      }else {
        var or__3824__auto____6487 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6487) {
          return or__3824__auto____6487
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6492 = o;
    if(and__3822__auto____6492) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6492
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2391__auto____6493 = o == null ? null : o;
    return function() {
      var or__3824__auto____6494 = cljs.core._deref[goog.typeOf(x__2391__auto____6493)];
      if(or__3824__auto____6494) {
        return or__3824__auto____6494
      }else {
        var or__3824__auto____6495 = cljs.core._deref["_"];
        if(or__3824__auto____6495) {
          return or__3824__auto____6495
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6500 = o;
    if(and__3822__auto____6500) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6500
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2391__auto____6501 = o == null ? null : o;
    return function() {
      var or__3824__auto____6502 = cljs.core._deref_with_timeout[goog.typeOf(x__2391__auto____6501)];
      if(or__3824__auto____6502) {
        return or__3824__auto____6502
      }else {
        var or__3824__auto____6503 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6503) {
          return or__3824__auto____6503
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6508 = o;
    if(and__3822__auto____6508) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6508
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2391__auto____6509 = o == null ? null : o;
    return function() {
      var or__3824__auto____6510 = cljs.core._meta[goog.typeOf(x__2391__auto____6509)];
      if(or__3824__auto____6510) {
        return or__3824__auto____6510
      }else {
        var or__3824__auto____6511 = cljs.core._meta["_"];
        if(or__3824__auto____6511) {
          return or__3824__auto____6511
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6516 = o;
    if(and__3822__auto____6516) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6516
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2391__auto____6517 = o == null ? null : o;
    return function() {
      var or__3824__auto____6518 = cljs.core._with_meta[goog.typeOf(x__2391__auto____6517)];
      if(or__3824__auto____6518) {
        return or__3824__auto____6518
      }else {
        var or__3824__auto____6519 = cljs.core._with_meta["_"];
        if(or__3824__auto____6519) {
          return or__3824__auto____6519
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6528 = coll;
      if(and__3822__auto____6528) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6528
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2391__auto____6529 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6530 = cljs.core._reduce[goog.typeOf(x__2391__auto____6529)];
        if(or__3824__auto____6530) {
          return or__3824__auto____6530
        }else {
          var or__3824__auto____6531 = cljs.core._reduce["_"];
          if(or__3824__auto____6531) {
            return or__3824__auto____6531
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6532 = coll;
      if(and__3822__auto____6532) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6532
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2391__auto____6533 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6534 = cljs.core._reduce[goog.typeOf(x__2391__auto____6533)];
        if(or__3824__auto____6534) {
          return or__3824__auto____6534
        }else {
          var or__3824__auto____6535 = cljs.core._reduce["_"];
          if(or__3824__auto____6535) {
            return or__3824__auto____6535
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6540 = coll;
    if(and__3822__auto____6540) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6540
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2391__auto____6541 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6542 = cljs.core._kv_reduce[goog.typeOf(x__2391__auto____6541)];
      if(or__3824__auto____6542) {
        return or__3824__auto____6542
      }else {
        var or__3824__auto____6543 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6543) {
          return or__3824__auto____6543
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6548 = o;
    if(and__3822__auto____6548) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6548
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2391__auto____6549 = o == null ? null : o;
    return function() {
      var or__3824__auto____6550 = cljs.core._equiv[goog.typeOf(x__2391__auto____6549)];
      if(or__3824__auto____6550) {
        return or__3824__auto____6550
      }else {
        var or__3824__auto____6551 = cljs.core._equiv["_"];
        if(or__3824__auto____6551) {
          return or__3824__auto____6551
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6556 = o;
    if(and__3822__auto____6556) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6556
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2391__auto____6557 = o == null ? null : o;
    return function() {
      var or__3824__auto____6558 = cljs.core._hash[goog.typeOf(x__2391__auto____6557)];
      if(or__3824__auto____6558) {
        return or__3824__auto____6558
      }else {
        var or__3824__auto____6559 = cljs.core._hash["_"];
        if(or__3824__auto____6559) {
          return or__3824__auto____6559
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6564 = o;
    if(and__3822__auto____6564) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6564
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2391__auto____6565 = o == null ? null : o;
    return function() {
      var or__3824__auto____6566 = cljs.core._seq[goog.typeOf(x__2391__auto____6565)];
      if(or__3824__auto____6566) {
        return or__3824__auto____6566
      }else {
        var or__3824__auto____6567 = cljs.core._seq["_"];
        if(or__3824__auto____6567) {
          return or__3824__auto____6567
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6572 = coll;
    if(and__3822__auto____6572) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6572
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2391__auto____6573 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6574 = cljs.core._rseq[goog.typeOf(x__2391__auto____6573)];
      if(or__3824__auto____6574) {
        return or__3824__auto____6574
      }else {
        var or__3824__auto____6575 = cljs.core._rseq["_"];
        if(or__3824__auto____6575) {
          return or__3824__auto____6575
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6580 = coll;
    if(and__3822__auto____6580) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6580
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2391__auto____6581 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6582 = cljs.core._sorted_seq[goog.typeOf(x__2391__auto____6581)];
      if(or__3824__auto____6582) {
        return or__3824__auto____6582
      }else {
        var or__3824__auto____6583 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6583) {
          return or__3824__auto____6583
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6588 = coll;
    if(and__3822__auto____6588) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6588
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2391__auto____6589 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6590 = cljs.core._sorted_seq_from[goog.typeOf(x__2391__auto____6589)];
      if(or__3824__auto____6590) {
        return or__3824__auto____6590
      }else {
        var or__3824__auto____6591 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6591) {
          return or__3824__auto____6591
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6596 = coll;
    if(and__3822__auto____6596) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6596
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2391__auto____6597 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6598 = cljs.core._entry_key[goog.typeOf(x__2391__auto____6597)];
      if(or__3824__auto____6598) {
        return or__3824__auto____6598
      }else {
        var or__3824__auto____6599 = cljs.core._entry_key["_"];
        if(or__3824__auto____6599) {
          return or__3824__auto____6599
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6604 = coll;
    if(and__3822__auto____6604) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6604
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2391__auto____6605 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6606 = cljs.core._comparator[goog.typeOf(x__2391__auto____6605)];
      if(or__3824__auto____6606) {
        return or__3824__auto____6606
      }else {
        var or__3824__auto____6607 = cljs.core._comparator["_"];
        if(or__3824__auto____6607) {
          return or__3824__auto____6607
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6612 = o;
    if(and__3822__auto____6612) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6612
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2391__auto____6613 = o == null ? null : o;
    return function() {
      var or__3824__auto____6614 = cljs.core._pr_seq[goog.typeOf(x__2391__auto____6613)];
      if(or__3824__auto____6614) {
        return or__3824__auto____6614
      }else {
        var or__3824__auto____6615 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6615) {
          return or__3824__auto____6615
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6620 = d;
    if(and__3822__auto____6620) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6620
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2391__auto____6621 = d == null ? null : d;
    return function() {
      var or__3824__auto____6622 = cljs.core._realized_QMARK_[goog.typeOf(x__2391__auto____6621)];
      if(or__3824__auto____6622) {
        return or__3824__auto____6622
      }else {
        var or__3824__auto____6623 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6623) {
          return or__3824__auto____6623
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6628 = this$;
    if(and__3822__auto____6628) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6628
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2391__auto____6629 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6630 = cljs.core._notify_watches[goog.typeOf(x__2391__auto____6629)];
      if(or__3824__auto____6630) {
        return or__3824__auto____6630
      }else {
        var or__3824__auto____6631 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6631) {
          return or__3824__auto____6631
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6636 = this$;
    if(and__3822__auto____6636) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6636
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2391__auto____6637 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6638 = cljs.core._add_watch[goog.typeOf(x__2391__auto____6637)];
      if(or__3824__auto____6638) {
        return or__3824__auto____6638
      }else {
        var or__3824__auto____6639 = cljs.core._add_watch["_"];
        if(or__3824__auto____6639) {
          return or__3824__auto____6639
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6644 = this$;
    if(and__3822__auto____6644) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6644
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2391__auto____6645 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6646 = cljs.core._remove_watch[goog.typeOf(x__2391__auto____6645)];
      if(or__3824__auto____6646) {
        return or__3824__auto____6646
      }else {
        var or__3824__auto____6647 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6647) {
          return or__3824__auto____6647
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6652 = coll;
    if(and__3822__auto____6652) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6652
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2391__auto____6653 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6654 = cljs.core._as_transient[goog.typeOf(x__2391__auto____6653)];
      if(or__3824__auto____6654) {
        return or__3824__auto____6654
      }else {
        var or__3824__auto____6655 = cljs.core._as_transient["_"];
        if(or__3824__auto____6655) {
          return or__3824__auto____6655
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6660 = tcoll;
    if(and__3822__auto____6660) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6660
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2391__auto____6661 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6662 = cljs.core._conj_BANG_[goog.typeOf(x__2391__auto____6661)];
      if(or__3824__auto____6662) {
        return or__3824__auto____6662
      }else {
        var or__3824__auto____6663 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6663) {
          return or__3824__auto____6663
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6668 = tcoll;
    if(and__3822__auto____6668) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6668
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6669 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6670 = cljs.core._persistent_BANG_[goog.typeOf(x__2391__auto____6669)];
      if(or__3824__auto____6670) {
        return or__3824__auto____6670
      }else {
        var or__3824__auto____6671 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6671) {
          return or__3824__auto____6671
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6676 = tcoll;
    if(and__3822__auto____6676) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6676
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2391__auto____6677 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6678 = cljs.core._assoc_BANG_[goog.typeOf(x__2391__auto____6677)];
      if(or__3824__auto____6678) {
        return or__3824__auto____6678
      }else {
        var or__3824__auto____6679 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6679) {
          return or__3824__auto____6679
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6684 = tcoll;
    if(and__3822__auto____6684) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6684
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2391__auto____6685 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6686 = cljs.core._dissoc_BANG_[goog.typeOf(x__2391__auto____6685)];
      if(or__3824__auto____6686) {
        return or__3824__auto____6686
      }else {
        var or__3824__auto____6687 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6687) {
          return or__3824__auto____6687
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6692 = tcoll;
    if(and__3822__auto____6692) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6692
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2391__auto____6693 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6694 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2391__auto____6693)];
      if(or__3824__auto____6694) {
        return or__3824__auto____6694
      }else {
        var or__3824__auto____6695 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6695) {
          return or__3824__auto____6695
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6700 = tcoll;
    if(and__3822__auto____6700) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6700
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6701 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6702 = cljs.core._pop_BANG_[goog.typeOf(x__2391__auto____6701)];
      if(or__3824__auto____6702) {
        return or__3824__auto____6702
      }else {
        var or__3824__auto____6703 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6703) {
          return or__3824__auto____6703
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6708 = tcoll;
    if(and__3822__auto____6708) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6708
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2391__auto____6709 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6710 = cljs.core._disjoin_BANG_[goog.typeOf(x__2391__auto____6709)];
      if(or__3824__auto____6710) {
        return or__3824__auto____6710
      }else {
        var or__3824__auto____6711 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6711) {
          return or__3824__auto____6711
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6716 = x;
    if(and__3822__auto____6716) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6716
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2391__auto____6717 = x == null ? null : x;
    return function() {
      var or__3824__auto____6718 = cljs.core._compare[goog.typeOf(x__2391__auto____6717)];
      if(or__3824__auto____6718) {
        return or__3824__auto____6718
      }else {
        var or__3824__auto____6719 = cljs.core._compare["_"];
        if(or__3824__auto____6719) {
          return or__3824__auto____6719
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6724 = coll;
    if(and__3822__auto____6724) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6724
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2391__auto____6725 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6726 = cljs.core._drop_first[goog.typeOf(x__2391__auto____6725)];
      if(or__3824__auto____6726) {
        return or__3824__auto____6726
      }else {
        var or__3824__auto____6727 = cljs.core._drop_first["_"];
        if(or__3824__auto____6727) {
          return or__3824__auto____6727
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6732 = coll;
    if(and__3822__auto____6732) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6732
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2391__auto____6733 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6734 = cljs.core._chunked_first[goog.typeOf(x__2391__auto____6733)];
      if(or__3824__auto____6734) {
        return or__3824__auto____6734
      }else {
        var or__3824__auto____6735 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6735) {
          return or__3824__auto____6735
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6740 = coll;
    if(and__3822__auto____6740) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6740
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2391__auto____6741 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6742 = cljs.core._chunked_rest[goog.typeOf(x__2391__auto____6741)];
      if(or__3824__auto____6742) {
        return or__3824__auto____6742
      }else {
        var or__3824__auto____6743 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6743) {
          return or__3824__auto____6743
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6748 = coll;
    if(and__3822__auto____6748) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6748
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2391__auto____6749 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6750 = cljs.core._chunked_next[goog.typeOf(x__2391__auto____6749)];
      if(or__3824__auto____6750) {
        return or__3824__auto____6750
      }else {
        var or__3824__auto____6751 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6751) {
          return or__3824__auto____6751
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____6753 = x === y;
    if(or__3824__auto____6753) {
      return or__3824__auto____6753
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6754__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6755 = y;
            var G__6756 = cljs.core.first.call(null, more);
            var G__6757 = cljs.core.next.call(null, more);
            x = G__6755;
            y = G__6756;
            more = G__6757;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6754 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6754__delegate.call(this, x, y, more)
    };
    G__6754.cljs$lang$maxFixedArity = 2;
    G__6754.cljs$lang$applyTo = function(arglist__6758) {
      var x = cljs.core.first(arglist__6758);
      var y = cljs.core.first(cljs.core.next(arglist__6758));
      var more = cljs.core.rest(cljs.core.next(arglist__6758));
      return G__6754__delegate(x, y, more)
    };
    G__6754.cljs$lang$arity$variadic = G__6754__delegate;
    return G__6754
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6759 = null;
  var G__6759__2 = function(o, k) {
    return null
  };
  var G__6759__3 = function(o, k, not_found) {
    return not_found
  };
  G__6759 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6759__2.call(this, o, k);
      case 3:
        return G__6759__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6759
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6760 = null;
  var G__6760__2 = function(_, f) {
    return f.call(null)
  };
  var G__6760__3 = function(_, f, start) {
    return start
  };
  G__6760 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6760__2.call(this, _, f);
      case 3:
        return G__6760__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6760
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6761 = null;
  var G__6761__2 = function(_, n) {
    return null
  };
  var G__6761__3 = function(_, n, not_found) {
    return not_found
  };
  G__6761 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6761__2.call(this, _, n);
      case 3:
        return G__6761__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6761
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____6762 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6762) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6762
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6775 = cljs.core._count.call(null, cicoll);
    if(cnt__6775 === 0) {
      return f.call(null)
    }else {
      var val__6776 = cljs.core._nth.call(null, cicoll, 0);
      var n__6777 = 1;
      while(true) {
        if(n__6777 < cnt__6775) {
          var nval__6778 = f.call(null, val__6776, cljs.core._nth.call(null, cicoll, n__6777));
          if(cljs.core.reduced_QMARK_.call(null, nval__6778)) {
            return cljs.core.deref.call(null, nval__6778)
          }else {
            var G__6787 = nval__6778;
            var G__6788 = n__6777 + 1;
            val__6776 = G__6787;
            n__6777 = G__6788;
            continue
          }
        }else {
          return val__6776
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6779 = cljs.core._count.call(null, cicoll);
    var val__6780 = val;
    var n__6781 = 0;
    while(true) {
      if(n__6781 < cnt__6779) {
        var nval__6782 = f.call(null, val__6780, cljs.core._nth.call(null, cicoll, n__6781));
        if(cljs.core.reduced_QMARK_.call(null, nval__6782)) {
          return cljs.core.deref.call(null, nval__6782)
        }else {
          var G__6789 = nval__6782;
          var G__6790 = n__6781 + 1;
          val__6780 = G__6789;
          n__6781 = G__6790;
          continue
        }
      }else {
        return val__6780
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6783 = cljs.core._count.call(null, cicoll);
    var val__6784 = val;
    var n__6785 = idx;
    while(true) {
      if(n__6785 < cnt__6783) {
        var nval__6786 = f.call(null, val__6784, cljs.core._nth.call(null, cicoll, n__6785));
        if(cljs.core.reduced_QMARK_.call(null, nval__6786)) {
          return cljs.core.deref.call(null, nval__6786)
        }else {
          var G__6791 = nval__6786;
          var G__6792 = n__6785 + 1;
          val__6784 = G__6791;
          n__6785 = G__6792;
          continue
        }
      }else {
        return val__6784
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6805 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6806 = arr[0];
      var n__6807 = 1;
      while(true) {
        if(n__6807 < cnt__6805) {
          var nval__6808 = f.call(null, val__6806, arr[n__6807]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6808)) {
            return cljs.core.deref.call(null, nval__6808)
          }else {
            var G__6817 = nval__6808;
            var G__6818 = n__6807 + 1;
            val__6806 = G__6817;
            n__6807 = G__6818;
            continue
          }
        }else {
          return val__6806
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6809 = arr.length;
    var val__6810 = val;
    var n__6811 = 0;
    while(true) {
      if(n__6811 < cnt__6809) {
        var nval__6812 = f.call(null, val__6810, arr[n__6811]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6812)) {
          return cljs.core.deref.call(null, nval__6812)
        }else {
          var G__6819 = nval__6812;
          var G__6820 = n__6811 + 1;
          val__6810 = G__6819;
          n__6811 = G__6820;
          continue
        }
      }else {
        return val__6810
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6813 = arr.length;
    var val__6814 = val;
    var n__6815 = idx;
    while(true) {
      if(n__6815 < cnt__6813) {
        var nval__6816 = f.call(null, val__6814, arr[n__6815]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6816)) {
          return cljs.core.deref.call(null, nval__6816)
        }else {
          var G__6821 = nval__6816;
          var G__6822 = n__6815 + 1;
          val__6814 = G__6821;
          n__6815 = G__6822;
          continue
        }
      }else {
        return val__6814
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6823 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6824 = this;
  if(this__6824.i + 1 < this__6824.a.length) {
    return new cljs.core.IndexedSeq(this__6824.a, this__6824.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6825 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6826 = this;
  var c__6827 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6827 > 0) {
    return new cljs.core.RSeq(coll, c__6827 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6828 = this;
  var this__6829 = this;
  return cljs.core.pr_str.call(null, this__6829)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6830 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6830.a)) {
    return cljs.core.ci_reduce.call(null, this__6830.a, f, this__6830.a[this__6830.i], this__6830.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6830.a[this__6830.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6831 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6831.a)) {
    return cljs.core.ci_reduce.call(null, this__6831.a, f, start, this__6831.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6832 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6833 = this;
  return this__6833.a.length - this__6833.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6834 = this;
  return this__6834.a[this__6834.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6835 = this;
  if(this__6835.i + 1 < this__6835.a.length) {
    return new cljs.core.IndexedSeq(this__6835.a, this__6835.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6836 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6837 = this;
  var i__6838 = n + this__6837.i;
  if(i__6838 < this__6837.a.length) {
    return this__6837.a[i__6838]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6839 = this;
  var i__6840 = n + this__6839.i;
  if(i__6840 < this__6839.a.length) {
    return this__6839.a[i__6840]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6841 = null;
  var G__6841__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6841__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6841 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6841__2.call(this, array, f);
      case 3:
        return G__6841__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6841
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6842 = null;
  var G__6842__2 = function(array, k) {
    return array[k]
  };
  var G__6842__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6842 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6842__2.call(this, array, k);
      case 3:
        return G__6842__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6842
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6843 = null;
  var G__6843__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6843__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6843 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6843__2.call(this, array, n);
      case 3:
        return G__6843__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6843
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6844 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6845 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6846 = this;
  var this__6847 = this;
  return cljs.core.pr_str.call(null, this__6847)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6848 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6849 = this;
  return this__6849.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6850 = this;
  return cljs.core._nth.call(null, this__6850.ci, this__6850.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6851 = this;
  if(this__6851.i > 0) {
    return new cljs.core.RSeq(this__6851.ci, this__6851.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6852 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6853 = this;
  return new cljs.core.RSeq(this__6853.ci, this__6853.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6854 = this;
  return this__6854.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6858__6859 = coll;
      if(G__6858__6859) {
        if(function() {
          var or__3824__auto____6860 = G__6858__6859.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6860) {
            return or__3824__auto____6860
          }else {
            return G__6858__6859.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6858__6859.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6858__6859)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6858__6859)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6865__6866 = coll;
      if(G__6865__6866) {
        if(function() {
          var or__3824__auto____6867 = G__6865__6866.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6867) {
            return or__3824__auto____6867
          }else {
            return G__6865__6866.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6865__6866.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6865__6866)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6865__6866)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6868 = cljs.core.seq.call(null, coll);
      if(s__6868 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6868)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6873__6874 = coll;
      if(G__6873__6874) {
        if(function() {
          var or__3824__auto____6875 = G__6873__6874.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6875) {
            return or__3824__auto____6875
          }else {
            return G__6873__6874.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6873__6874.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6873__6874)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6873__6874)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6876 = cljs.core.seq.call(null, coll);
      if(!(s__6876 == null)) {
        return cljs.core._rest.call(null, s__6876)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6880__6881 = coll;
      if(G__6880__6881) {
        if(function() {
          var or__3824__auto____6882 = G__6880__6881.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6882) {
            return or__3824__auto____6882
          }else {
            return G__6880__6881.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6880__6881.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6880__6881)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6880__6881)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6884 = cljs.core.next.call(null, s);
    if(!(sn__6884 == null)) {
      var G__6885 = sn__6884;
      s = G__6885;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6886__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6887 = conj.call(null, coll, x);
          var G__6888 = cljs.core.first.call(null, xs);
          var G__6889 = cljs.core.next.call(null, xs);
          coll = G__6887;
          x = G__6888;
          xs = G__6889;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6886 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6886__delegate.call(this, coll, x, xs)
    };
    G__6886.cljs$lang$maxFixedArity = 2;
    G__6886.cljs$lang$applyTo = function(arglist__6890) {
      var coll = cljs.core.first(arglist__6890);
      var x = cljs.core.first(cljs.core.next(arglist__6890));
      var xs = cljs.core.rest(cljs.core.next(arglist__6890));
      return G__6886__delegate(coll, x, xs)
    };
    G__6886.cljs$lang$arity$variadic = G__6886__delegate;
    return G__6886
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6893 = cljs.core.seq.call(null, coll);
  var acc__6894 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6893)) {
      return acc__6894 + cljs.core._count.call(null, s__6893)
    }else {
      var G__6895 = cljs.core.next.call(null, s__6893);
      var G__6896 = acc__6894 + 1;
      s__6893 = G__6895;
      acc__6894 = G__6896;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6903__6904 = coll;
        if(G__6903__6904) {
          if(function() {
            var or__3824__auto____6905 = G__6903__6904.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6905) {
              return or__3824__auto____6905
            }else {
              return G__6903__6904.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6903__6904.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6903__6904)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6903__6904)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6906__6907 = coll;
        if(G__6906__6907) {
          if(function() {
            var or__3824__auto____6908 = G__6906__6907.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6908) {
              return or__3824__auto____6908
            }else {
              return G__6906__6907.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6906__6907.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6906__6907)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6906__6907)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6911__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6910 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6912 = ret__6910;
          var G__6913 = cljs.core.first.call(null, kvs);
          var G__6914 = cljs.core.second.call(null, kvs);
          var G__6915 = cljs.core.nnext.call(null, kvs);
          coll = G__6912;
          k = G__6913;
          v = G__6914;
          kvs = G__6915;
          continue
        }else {
          return ret__6910
        }
        break
      }
    };
    var G__6911 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6911__delegate.call(this, coll, k, v, kvs)
    };
    G__6911.cljs$lang$maxFixedArity = 3;
    G__6911.cljs$lang$applyTo = function(arglist__6916) {
      var coll = cljs.core.first(arglist__6916);
      var k = cljs.core.first(cljs.core.next(arglist__6916));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6916)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6916)));
      return G__6911__delegate(coll, k, v, kvs)
    };
    G__6911.cljs$lang$arity$variadic = G__6911__delegate;
    return G__6911
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6919__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6918 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6920 = ret__6918;
          var G__6921 = cljs.core.first.call(null, ks);
          var G__6922 = cljs.core.next.call(null, ks);
          coll = G__6920;
          k = G__6921;
          ks = G__6922;
          continue
        }else {
          return ret__6918
        }
        break
      }
    };
    var G__6919 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6919__delegate.call(this, coll, k, ks)
    };
    G__6919.cljs$lang$maxFixedArity = 2;
    G__6919.cljs$lang$applyTo = function(arglist__6923) {
      var coll = cljs.core.first(arglist__6923);
      var k = cljs.core.first(cljs.core.next(arglist__6923));
      var ks = cljs.core.rest(cljs.core.next(arglist__6923));
      return G__6919__delegate(coll, k, ks)
    };
    G__6919.cljs$lang$arity$variadic = G__6919__delegate;
    return G__6919
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6927__6928 = o;
    if(G__6927__6928) {
      if(function() {
        var or__3824__auto____6929 = G__6927__6928.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6929) {
          return or__3824__auto____6929
        }else {
          return G__6927__6928.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6927__6928.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6927__6928)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6927__6928)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6932__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6931 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6933 = ret__6931;
          var G__6934 = cljs.core.first.call(null, ks);
          var G__6935 = cljs.core.next.call(null, ks);
          coll = G__6933;
          k = G__6934;
          ks = G__6935;
          continue
        }else {
          return ret__6931
        }
        break
      }
    };
    var G__6932 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6932__delegate.call(this, coll, k, ks)
    };
    G__6932.cljs$lang$maxFixedArity = 2;
    G__6932.cljs$lang$applyTo = function(arglist__6936) {
      var coll = cljs.core.first(arglist__6936);
      var k = cljs.core.first(cljs.core.next(arglist__6936));
      var ks = cljs.core.rest(cljs.core.next(arglist__6936));
      return G__6932__delegate(coll, k, ks)
    };
    G__6932.cljs$lang$arity$variadic = G__6932__delegate;
    return G__6932
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6938 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6938;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6938
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6940 = cljs.core.string_hash_cache[k];
  if(!(h__6940 == null)) {
    return h__6940
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6942 = goog.isString(o);
      if(and__3822__auto____6942) {
        return check_cache
      }else {
        return and__3822__auto____6942
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6946__6947 = x;
    if(G__6946__6947) {
      if(function() {
        var or__3824__auto____6948 = G__6946__6947.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6948) {
          return or__3824__auto____6948
        }else {
          return G__6946__6947.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6946__6947.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6946__6947)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6946__6947)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6952__6953 = x;
    if(G__6952__6953) {
      if(function() {
        var or__3824__auto____6954 = G__6952__6953.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6954) {
          return or__3824__auto____6954
        }else {
          return G__6952__6953.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6952__6953.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6952__6953)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6952__6953)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6958__6959 = x;
  if(G__6958__6959) {
    if(function() {
      var or__3824__auto____6960 = G__6958__6959.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6960) {
        return or__3824__auto____6960
      }else {
        return G__6958__6959.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6958__6959.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6958__6959)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6958__6959)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6964__6965 = x;
  if(G__6964__6965) {
    if(function() {
      var or__3824__auto____6966 = G__6964__6965.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6966) {
        return or__3824__auto____6966
      }else {
        return G__6964__6965.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6964__6965.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6964__6965)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6964__6965)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6970__6971 = x;
  if(G__6970__6971) {
    if(function() {
      var or__3824__auto____6972 = G__6970__6971.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6972) {
        return or__3824__auto____6972
      }else {
        return G__6970__6971.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6970__6971.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6970__6971)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6970__6971)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6976__6977 = x;
  if(G__6976__6977) {
    if(function() {
      var or__3824__auto____6978 = G__6976__6977.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6978) {
        return or__3824__auto____6978
      }else {
        return G__6976__6977.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6976__6977.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6976__6977)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6976__6977)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6982__6983 = x;
  if(G__6982__6983) {
    if(function() {
      var or__3824__auto____6984 = G__6982__6983.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6984) {
        return or__3824__auto____6984
      }else {
        return G__6982__6983.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6982__6983.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6982__6983)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6982__6983)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6988__6989 = x;
    if(G__6988__6989) {
      if(function() {
        var or__3824__auto____6990 = G__6988__6989.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6990) {
          return or__3824__auto____6990
        }else {
          return G__6988__6989.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6988__6989.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6988__6989)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6988__6989)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6994__6995 = x;
  if(G__6994__6995) {
    if(function() {
      var or__3824__auto____6996 = G__6994__6995.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6996) {
        return or__3824__auto____6996
      }else {
        return G__6994__6995.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6994__6995.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6994__6995)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6994__6995)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7000__7001 = x;
  if(G__7000__7001) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7002 = null;
      if(cljs.core.truth_(or__3824__auto____7002)) {
        return or__3824__auto____7002
      }else {
        return G__7000__7001.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7000__7001.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7000__7001)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7000__7001)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7003__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7003 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7003__delegate.call(this, keyvals)
    };
    G__7003.cljs$lang$maxFixedArity = 0;
    G__7003.cljs$lang$applyTo = function(arglist__7004) {
      var keyvals = cljs.core.seq(arglist__7004);
      return G__7003__delegate(keyvals)
    };
    G__7003.cljs$lang$arity$variadic = G__7003__delegate;
    return G__7003
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7006 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7006.push(key)
  });
  return keys__7006
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7010 = i;
  var j__7011 = j;
  var len__7012 = len;
  while(true) {
    if(len__7012 === 0) {
      return to
    }else {
      to[j__7011] = from[i__7010];
      var G__7013 = i__7010 + 1;
      var G__7014 = j__7011 + 1;
      var G__7015 = len__7012 - 1;
      i__7010 = G__7013;
      j__7011 = G__7014;
      len__7012 = G__7015;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7019 = i + (len - 1);
  var j__7020 = j + (len - 1);
  var len__7021 = len;
  while(true) {
    if(len__7021 === 0) {
      return to
    }else {
      to[j__7020] = from[i__7019];
      var G__7022 = i__7019 - 1;
      var G__7023 = j__7020 - 1;
      var G__7024 = len__7021 - 1;
      i__7019 = G__7022;
      j__7020 = G__7023;
      len__7021 = G__7024;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7028__7029 = s;
    if(G__7028__7029) {
      if(function() {
        var or__3824__auto____7030 = G__7028__7029.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7030) {
          return or__3824__auto____7030
        }else {
          return G__7028__7029.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7028__7029.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7028__7029)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7028__7029)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7034__7035 = s;
  if(G__7034__7035) {
    if(function() {
      var or__3824__auto____7036 = G__7034__7035.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7036) {
        return or__3824__auto____7036
      }else {
        return G__7034__7035.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7034__7035.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7034__7035)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7034__7035)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7039 = goog.isString(x);
  if(and__3822__auto____7039) {
    return!function() {
      var or__3824__auto____7040 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7040) {
        return or__3824__auto____7040
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7039
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7042 = goog.isString(x);
  if(and__3822__auto____7042) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7042
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7044 = goog.isString(x);
  if(and__3822__auto____7044) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7044
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7049 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7049) {
    return or__3824__auto____7049
  }else {
    var G__7050__7051 = f;
    if(G__7050__7051) {
      if(function() {
        var or__3824__auto____7052 = G__7050__7051.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7052) {
          return or__3824__auto____7052
        }else {
          return G__7050__7051.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7050__7051.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7050__7051)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7050__7051)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7054 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7054) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7054
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7057 = coll;
    if(cljs.core.truth_(and__3822__auto____7057)) {
      var and__3822__auto____7058 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7058) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7058
      }
    }else {
      return and__3822__auto____7057
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7067__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7063 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7064 = more;
        while(true) {
          var x__7065 = cljs.core.first.call(null, xs__7064);
          var etc__7066 = cljs.core.next.call(null, xs__7064);
          if(cljs.core.truth_(xs__7064)) {
            if(cljs.core.contains_QMARK_.call(null, s__7063, x__7065)) {
              return false
            }else {
              var G__7068 = cljs.core.conj.call(null, s__7063, x__7065);
              var G__7069 = etc__7066;
              s__7063 = G__7068;
              xs__7064 = G__7069;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7067 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7067__delegate.call(this, x, y, more)
    };
    G__7067.cljs$lang$maxFixedArity = 2;
    G__7067.cljs$lang$applyTo = function(arglist__7070) {
      var x = cljs.core.first(arglist__7070);
      var y = cljs.core.first(cljs.core.next(arglist__7070));
      var more = cljs.core.rest(cljs.core.next(arglist__7070));
      return G__7067__delegate(x, y, more)
    };
    G__7067.cljs$lang$arity$variadic = G__7067__delegate;
    return G__7067
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7074__7075 = x;
            if(G__7074__7075) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7076 = null;
                if(cljs.core.truth_(or__3824__auto____7076)) {
                  return or__3824__auto____7076
                }else {
                  return G__7074__7075.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7074__7075.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7074__7075)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7074__7075)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7081 = cljs.core.count.call(null, xs);
    var yl__7082 = cljs.core.count.call(null, ys);
    if(xl__7081 < yl__7082) {
      return-1
    }else {
      if(xl__7081 > yl__7082) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7081, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7083 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7084 = d__7083 === 0;
        if(and__3822__auto____7084) {
          return n + 1 < len
        }else {
          return and__3822__auto____7084
        }
      }()) {
        var G__7085 = xs;
        var G__7086 = ys;
        var G__7087 = len;
        var G__7088 = n + 1;
        xs = G__7085;
        ys = G__7086;
        len = G__7087;
        n = G__7088;
        continue
      }else {
        return d__7083
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7090 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7090)) {
        return r__7090
      }else {
        if(cljs.core.truth_(r__7090)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7092 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7092, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7092)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7098 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7098) {
      var s__7099 = temp__3971__auto____7098;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7099), cljs.core.next.call(null, s__7099))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7100 = val;
    var coll__7101 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7101) {
        var nval__7102 = f.call(null, val__7100, cljs.core.first.call(null, coll__7101));
        if(cljs.core.reduced_QMARK_.call(null, nval__7102)) {
          return cljs.core.deref.call(null, nval__7102)
        }else {
          var G__7103 = nval__7102;
          var G__7104 = cljs.core.next.call(null, coll__7101);
          val__7100 = G__7103;
          coll__7101 = G__7104;
          continue
        }
      }else {
        return val__7100
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7106 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7106);
  return cljs.core.vec.call(null, a__7106)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7113__7114 = coll;
      if(G__7113__7114) {
        if(function() {
          var or__3824__auto____7115 = G__7113__7114.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7115) {
            return or__3824__auto____7115
          }else {
            return G__7113__7114.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7113__7114.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7113__7114)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7113__7114)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7116__7117 = coll;
      if(G__7116__7117) {
        if(function() {
          var or__3824__auto____7118 = G__7116__7117.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7118) {
            return or__3824__auto____7118
          }else {
            return G__7116__7117.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7116__7117.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7116__7117)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7116__7117)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7119 = this;
  return this__7119.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7120__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7120 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7120__delegate.call(this, x, y, more)
    };
    G__7120.cljs$lang$maxFixedArity = 2;
    G__7120.cljs$lang$applyTo = function(arglist__7121) {
      var x = cljs.core.first(arglist__7121);
      var y = cljs.core.first(cljs.core.next(arglist__7121));
      var more = cljs.core.rest(cljs.core.next(arglist__7121));
      return G__7120__delegate(x, y, more)
    };
    G__7120.cljs$lang$arity$variadic = G__7120__delegate;
    return G__7120
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7122__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7122 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7122__delegate.call(this, x, y, more)
    };
    G__7122.cljs$lang$maxFixedArity = 2;
    G__7122.cljs$lang$applyTo = function(arglist__7123) {
      var x = cljs.core.first(arglist__7123);
      var y = cljs.core.first(cljs.core.next(arglist__7123));
      var more = cljs.core.rest(cljs.core.next(arglist__7123));
      return G__7122__delegate(x, y, more)
    };
    G__7122.cljs$lang$arity$variadic = G__7122__delegate;
    return G__7122
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7124__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7124 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7124__delegate.call(this, x, y, more)
    };
    G__7124.cljs$lang$maxFixedArity = 2;
    G__7124.cljs$lang$applyTo = function(arglist__7125) {
      var x = cljs.core.first(arglist__7125);
      var y = cljs.core.first(cljs.core.next(arglist__7125));
      var more = cljs.core.rest(cljs.core.next(arglist__7125));
      return G__7124__delegate(x, y, more)
    };
    G__7124.cljs$lang$arity$variadic = G__7124__delegate;
    return G__7124
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7126__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7126 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7126__delegate.call(this, x, y, more)
    };
    G__7126.cljs$lang$maxFixedArity = 2;
    G__7126.cljs$lang$applyTo = function(arglist__7127) {
      var x = cljs.core.first(arglist__7127);
      var y = cljs.core.first(cljs.core.next(arglist__7127));
      var more = cljs.core.rest(cljs.core.next(arglist__7127));
      return G__7126__delegate(x, y, more)
    };
    G__7126.cljs$lang$arity$variadic = G__7126__delegate;
    return G__7126
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7128__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7129 = y;
            var G__7130 = cljs.core.first.call(null, more);
            var G__7131 = cljs.core.next.call(null, more);
            x = G__7129;
            y = G__7130;
            more = G__7131;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7128 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7128__delegate.call(this, x, y, more)
    };
    G__7128.cljs$lang$maxFixedArity = 2;
    G__7128.cljs$lang$applyTo = function(arglist__7132) {
      var x = cljs.core.first(arglist__7132);
      var y = cljs.core.first(cljs.core.next(arglist__7132));
      var more = cljs.core.rest(cljs.core.next(arglist__7132));
      return G__7128__delegate(x, y, more)
    };
    G__7128.cljs$lang$arity$variadic = G__7128__delegate;
    return G__7128
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7133__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7134 = y;
            var G__7135 = cljs.core.first.call(null, more);
            var G__7136 = cljs.core.next.call(null, more);
            x = G__7134;
            y = G__7135;
            more = G__7136;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7133__delegate.call(this, x, y, more)
    };
    G__7133.cljs$lang$maxFixedArity = 2;
    G__7133.cljs$lang$applyTo = function(arglist__7137) {
      var x = cljs.core.first(arglist__7137);
      var y = cljs.core.first(cljs.core.next(arglist__7137));
      var more = cljs.core.rest(cljs.core.next(arglist__7137));
      return G__7133__delegate(x, y, more)
    };
    G__7133.cljs$lang$arity$variadic = G__7133__delegate;
    return G__7133
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7138__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7139 = y;
            var G__7140 = cljs.core.first.call(null, more);
            var G__7141 = cljs.core.next.call(null, more);
            x = G__7139;
            y = G__7140;
            more = G__7141;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7138 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7138__delegate.call(this, x, y, more)
    };
    G__7138.cljs$lang$maxFixedArity = 2;
    G__7138.cljs$lang$applyTo = function(arglist__7142) {
      var x = cljs.core.first(arglist__7142);
      var y = cljs.core.first(cljs.core.next(arglist__7142));
      var more = cljs.core.rest(cljs.core.next(arglist__7142));
      return G__7138__delegate(x, y, more)
    };
    G__7138.cljs$lang$arity$variadic = G__7138__delegate;
    return G__7138
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7143__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7144 = y;
            var G__7145 = cljs.core.first.call(null, more);
            var G__7146 = cljs.core.next.call(null, more);
            x = G__7144;
            y = G__7145;
            more = G__7146;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7143 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7143__delegate.call(this, x, y, more)
    };
    G__7143.cljs$lang$maxFixedArity = 2;
    G__7143.cljs$lang$applyTo = function(arglist__7147) {
      var x = cljs.core.first(arglist__7147);
      var y = cljs.core.first(cljs.core.next(arglist__7147));
      var more = cljs.core.rest(cljs.core.next(arglist__7147));
      return G__7143__delegate(x, y, more)
    };
    G__7143.cljs$lang$arity$variadic = G__7143__delegate;
    return G__7143
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7148__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7148 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7148__delegate.call(this, x, y, more)
    };
    G__7148.cljs$lang$maxFixedArity = 2;
    G__7148.cljs$lang$applyTo = function(arglist__7149) {
      var x = cljs.core.first(arglist__7149);
      var y = cljs.core.first(cljs.core.next(arglist__7149));
      var more = cljs.core.rest(cljs.core.next(arglist__7149));
      return G__7148__delegate(x, y, more)
    };
    G__7148.cljs$lang$arity$variadic = G__7148__delegate;
    return G__7148
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7150__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7150 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7150__delegate.call(this, x, y, more)
    };
    G__7150.cljs$lang$maxFixedArity = 2;
    G__7150.cljs$lang$applyTo = function(arglist__7151) {
      var x = cljs.core.first(arglist__7151);
      var y = cljs.core.first(cljs.core.next(arglist__7151));
      var more = cljs.core.rest(cljs.core.next(arglist__7151));
      return G__7150__delegate(x, y, more)
    };
    G__7150.cljs$lang$arity$variadic = G__7150__delegate;
    return G__7150
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7153 = n % d;
  return cljs.core.fix.call(null, (n - rem__7153) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7155 = cljs.core.quot.call(null, n, d);
  return n - d * q__7155
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7158 = v - (v >> 1 & 1431655765);
  var v__7159 = (v__7158 & 858993459) + (v__7158 >> 2 & 858993459);
  return(v__7159 + (v__7159 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7160__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7161 = y;
            var G__7162 = cljs.core.first.call(null, more);
            var G__7163 = cljs.core.next.call(null, more);
            x = G__7161;
            y = G__7162;
            more = G__7163;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7160 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7160__delegate.call(this, x, y, more)
    };
    G__7160.cljs$lang$maxFixedArity = 2;
    G__7160.cljs$lang$applyTo = function(arglist__7164) {
      var x = cljs.core.first(arglist__7164);
      var y = cljs.core.first(cljs.core.next(arglist__7164));
      var more = cljs.core.rest(cljs.core.next(arglist__7164));
      return G__7160__delegate(x, y, more)
    };
    G__7160.cljs$lang$arity$variadic = G__7160__delegate;
    return G__7160
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7168 = n;
  var xs__7169 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7170 = xs__7169;
      if(and__3822__auto____7170) {
        return n__7168 > 0
      }else {
        return and__3822__auto____7170
      }
    }())) {
      var G__7171 = n__7168 - 1;
      var G__7172 = cljs.core.next.call(null, xs__7169);
      n__7168 = G__7171;
      xs__7169 = G__7172;
      continue
    }else {
      return xs__7169
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7173__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7174 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7175 = cljs.core.next.call(null, more);
            sb = G__7174;
            more = G__7175;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7173 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7173__delegate.call(this, x, ys)
    };
    G__7173.cljs$lang$maxFixedArity = 1;
    G__7173.cljs$lang$applyTo = function(arglist__7176) {
      var x = cljs.core.first(arglist__7176);
      var ys = cljs.core.rest(arglist__7176);
      return G__7173__delegate(x, ys)
    };
    G__7173.cljs$lang$arity$variadic = G__7173__delegate;
    return G__7173
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7177__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7178 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7179 = cljs.core.next.call(null, more);
            sb = G__7178;
            more = G__7179;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7177 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7177__delegate.call(this, x, ys)
    };
    G__7177.cljs$lang$maxFixedArity = 1;
    G__7177.cljs$lang$applyTo = function(arglist__7180) {
      var x = cljs.core.first(arglist__7180);
      var ys = cljs.core.rest(arglist__7180);
      return G__7177__delegate(x, ys)
    };
    G__7177.cljs$lang$arity$variadic = G__7177__delegate;
    return G__7177
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7181) {
    var fmt = cljs.core.first(arglist__7181);
    var args = cljs.core.rest(arglist__7181);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7184 = cljs.core.seq.call(null, x);
    var ys__7185 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7184 == null) {
        return ys__7185 == null
      }else {
        if(ys__7185 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7184), cljs.core.first.call(null, ys__7185))) {
            var G__7186 = cljs.core.next.call(null, xs__7184);
            var G__7187 = cljs.core.next.call(null, ys__7185);
            xs__7184 = G__7186;
            ys__7185 = G__7187;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7188_SHARP_, p2__7189_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7188_SHARP_, cljs.core.hash.call(null, p2__7189_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7193 = 0;
  var s__7194 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7194) {
      var e__7195 = cljs.core.first.call(null, s__7194);
      var G__7196 = (h__7193 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7195)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7195)))) % 4503599627370496;
      var G__7197 = cljs.core.next.call(null, s__7194);
      h__7193 = G__7196;
      s__7194 = G__7197;
      continue
    }else {
      return h__7193
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7201 = 0;
  var s__7202 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7202) {
      var e__7203 = cljs.core.first.call(null, s__7202);
      var G__7204 = (h__7201 + cljs.core.hash.call(null, e__7203)) % 4503599627370496;
      var G__7205 = cljs.core.next.call(null, s__7202);
      h__7201 = G__7204;
      s__7202 = G__7205;
      continue
    }else {
      return h__7201
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7226__7227 = cljs.core.seq.call(null, fn_map);
  if(G__7226__7227) {
    var G__7229__7231 = cljs.core.first.call(null, G__7226__7227);
    var vec__7230__7232 = G__7229__7231;
    var key_name__7233 = cljs.core.nth.call(null, vec__7230__7232, 0, null);
    var f__7234 = cljs.core.nth.call(null, vec__7230__7232, 1, null);
    var G__7226__7235 = G__7226__7227;
    var G__7229__7236 = G__7229__7231;
    var G__7226__7237 = G__7226__7235;
    while(true) {
      var vec__7238__7239 = G__7229__7236;
      var key_name__7240 = cljs.core.nth.call(null, vec__7238__7239, 0, null);
      var f__7241 = cljs.core.nth.call(null, vec__7238__7239, 1, null);
      var G__7226__7242 = G__7226__7237;
      var str_name__7243 = cljs.core.name.call(null, key_name__7240);
      obj[str_name__7243] = f__7241;
      var temp__3974__auto____7244 = cljs.core.next.call(null, G__7226__7242);
      if(temp__3974__auto____7244) {
        var G__7226__7245 = temp__3974__auto____7244;
        var G__7246 = cljs.core.first.call(null, G__7226__7245);
        var G__7247 = G__7226__7245;
        G__7229__7236 = G__7246;
        G__7226__7237 = G__7247;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7248 = this;
  var h__2220__auto____7249 = this__7248.__hash;
  if(!(h__2220__auto____7249 == null)) {
    return h__2220__auto____7249
  }else {
    var h__2220__auto____7250 = cljs.core.hash_coll.call(null, coll);
    this__7248.__hash = h__2220__auto____7250;
    return h__2220__auto____7250
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7251 = this;
  if(this__7251.count === 1) {
    return null
  }else {
    return this__7251.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7252 = this;
  return new cljs.core.List(this__7252.meta, o, coll, this__7252.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7253 = this;
  var this__7254 = this;
  return cljs.core.pr_str.call(null, this__7254)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7255 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7256 = this;
  return this__7256.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7257 = this;
  return this__7257.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7258 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7259 = this;
  return this__7259.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7260 = this;
  if(this__7260.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7260.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7261 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7262 = this;
  return new cljs.core.List(meta, this__7262.first, this__7262.rest, this__7262.count, this__7262.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7263 = this;
  return this__7263.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7264 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7265 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7266 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7267 = this;
  return new cljs.core.List(this__7267.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7268 = this;
  var this__7269 = this;
  return cljs.core.pr_str.call(null, this__7269)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7270 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7271 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7272 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7273 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7274 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7275 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7276 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7277 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7278 = this;
  return this__7278.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7279 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7283__7284 = coll;
  if(G__7283__7284) {
    if(function() {
      var or__3824__auto____7285 = G__7283__7284.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7285) {
        return or__3824__auto____7285
      }else {
        return G__7283__7284.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7283__7284.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7283__7284)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7283__7284)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7286__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7286 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7286__delegate.call(this, x, y, z, items)
    };
    G__7286.cljs$lang$maxFixedArity = 3;
    G__7286.cljs$lang$applyTo = function(arglist__7287) {
      var x = cljs.core.first(arglist__7287);
      var y = cljs.core.first(cljs.core.next(arglist__7287));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7287)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7287)));
      return G__7286__delegate(x, y, z, items)
    };
    G__7286.cljs$lang$arity$variadic = G__7286__delegate;
    return G__7286
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7288 = this;
  var h__2220__auto____7289 = this__7288.__hash;
  if(!(h__2220__auto____7289 == null)) {
    return h__2220__auto____7289
  }else {
    var h__2220__auto____7290 = cljs.core.hash_coll.call(null, coll);
    this__7288.__hash = h__2220__auto____7290;
    return h__2220__auto____7290
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7291 = this;
  if(this__7291.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7291.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7292 = this;
  return new cljs.core.Cons(null, o, coll, this__7292.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7293 = this;
  var this__7294 = this;
  return cljs.core.pr_str.call(null, this__7294)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7295 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7296 = this;
  return this__7296.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7297 = this;
  if(this__7297.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7297.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7298 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7299 = this;
  return new cljs.core.Cons(meta, this__7299.first, this__7299.rest, this__7299.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7300 = this;
  return this__7300.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7301 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7301.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7306 = coll == null;
    if(or__3824__auto____7306) {
      return or__3824__auto____7306
    }else {
      var G__7307__7308 = coll;
      if(G__7307__7308) {
        if(function() {
          var or__3824__auto____7309 = G__7307__7308.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7309) {
            return or__3824__auto____7309
          }else {
            return G__7307__7308.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7307__7308.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7307__7308)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7307__7308)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7313__7314 = x;
  if(G__7313__7314) {
    if(function() {
      var or__3824__auto____7315 = G__7313__7314.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7315) {
        return or__3824__auto____7315
      }else {
        return G__7313__7314.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7313__7314.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7313__7314)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7313__7314)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7316 = null;
  var G__7316__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7316__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7316 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7316__2.call(this, string, f);
      case 3:
        return G__7316__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7316
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7317 = null;
  var G__7317__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7317__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7317 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7317__2.call(this, string, k);
      case 3:
        return G__7317__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7317
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7318 = null;
  var G__7318__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7318__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7318 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7318__2.call(this, string, n);
      case 3:
        return G__7318__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7318
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7330 = null;
  var G__7330__2 = function(this_sym7321, coll) {
    var this__7323 = this;
    var this_sym7321__7324 = this;
    var ___7325 = this_sym7321__7324;
    if(coll == null) {
      return null
    }else {
      var strobj__7326 = coll.strobj;
      if(strobj__7326 == null) {
        return cljs.core._lookup.call(null, coll, this__7323.k, null)
      }else {
        return strobj__7326[this__7323.k]
      }
    }
  };
  var G__7330__3 = function(this_sym7322, coll, not_found) {
    var this__7323 = this;
    var this_sym7322__7327 = this;
    var ___7328 = this_sym7322__7327;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7323.k, not_found)
    }
  };
  G__7330 = function(this_sym7322, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7330__2.call(this, this_sym7322, coll);
      case 3:
        return G__7330__3.call(this, this_sym7322, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7330
}();
cljs.core.Keyword.prototype.apply = function(this_sym7319, args7320) {
  var this__7329 = this;
  return this_sym7319.call.apply(this_sym7319, [this_sym7319].concat(args7320.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7339 = null;
  var G__7339__2 = function(this_sym7333, coll) {
    var this_sym7333__7335 = this;
    var this__7336 = this_sym7333__7335;
    return cljs.core._lookup.call(null, coll, this__7336.toString(), null)
  };
  var G__7339__3 = function(this_sym7334, coll, not_found) {
    var this_sym7334__7337 = this;
    var this__7338 = this_sym7334__7337;
    return cljs.core._lookup.call(null, coll, this__7338.toString(), not_found)
  };
  G__7339 = function(this_sym7334, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7339__2.call(this, this_sym7334, coll);
      case 3:
        return G__7339__3.call(this, this_sym7334, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7339
}();
String.prototype.apply = function(this_sym7331, args7332) {
  return this_sym7331.call.apply(this_sym7331, [this_sym7331].concat(args7332.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7341 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7341
  }else {
    lazy_seq.x = x__7341.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7342 = this;
  var h__2220__auto____7343 = this__7342.__hash;
  if(!(h__2220__auto____7343 == null)) {
    return h__2220__auto____7343
  }else {
    var h__2220__auto____7344 = cljs.core.hash_coll.call(null, coll);
    this__7342.__hash = h__2220__auto____7344;
    return h__2220__auto____7344
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7345 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7346 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7347 = this;
  var this__7348 = this;
  return cljs.core.pr_str.call(null, this__7348)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7349 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7350 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7351 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7352 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7353 = this;
  return new cljs.core.LazySeq(meta, this__7353.realized, this__7353.x, this__7353.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7354 = this;
  return this__7354.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7355 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7355.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7356 = this;
  return this__7356.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7357 = this;
  var ___7358 = this;
  this__7357.buf[this__7357.end] = o;
  return this__7357.end = this__7357.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7359 = this;
  var ___7360 = this;
  var ret__7361 = new cljs.core.ArrayChunk(this__7359.buf, 0, this__7359.end);
  this__7359.buf = null;
  return ret__7361
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7362 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7362.arr[this__7362.off], this__7362.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7363 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7363.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7364 = this;
  if(this__7364.off === this__7364.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7364.arr, this__7364.off + 1, this__7364.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7365 = this;
  return this__7365.arr[this__7365.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7366 = this;
  if(function() {
    var and__3822__auto____7367 = i >= 0;
    if(and__3822__auto____7367) {
      return i < this__7366.end - this__7366.off
    }else {
      return and__3822__auto____7367
    }
  }()) {
    return this__7366.arr[this__7366.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7368 = this;
  return this__7368.end - this__7368.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7369 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7370 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7371 = this;
  return cljs.core._nth.call(null, this__7371.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7372 = this;
  if(cljs.core._count.call(null, this__7372.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7372.chunk), this__7372.more, this__7372.meta)
  }else {
    if(this__7372.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7372.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7373 = this;
  if(this__7373.more == null) {
    return null
  }else {
    return this__7373.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7374 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7375 = this;
  return new cljs.core.ChunkedCons(this__7375.chunk, this__7375.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7376 = this;
  return this__7376.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7377 = this;
  return this__7377.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7378 = this;
  if(this__7378.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7378.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7382__7383 = s;
    if(G__7382__7383) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7384 = null;
        if(cljs.core.truth_(or__3824__auto____7384)) {
          return or__3824__auto____7384
        }else {
          return G__7382__7383.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7382__7383.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7382__7383)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7382__7383)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7387 = [];
  var s__7388 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7388)) {
      ary__7387.push(cljs.core.first.call(null, s__7388));
      var G__7389 = cljs.core.next.call(null, s__7388);
      s__7388 = G__7389;
      continue
    }else {
      return ary__7387
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7393 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7394 = 0;
  var xs__7395 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7395) {
      ret__7393[i__7394] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7395));
      var G__7396 = i__7394 + 1;
      var G__7397 = cljs.core.next.call(null, xs__7395);
      i__7394 = G__7396;
      xs__7395 = G__7397;
      continue
    }else {
    }
    break
  }
  return ret__7393
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7405 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7406 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7407 = 0;
      var s__7408 = s__7406;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7409 = s__7408;
          if(and__3822__auto____7409) {
            return i__7407 < size
          }else {
            return and__3822__auto____7409
          }
        }())) {
          a__7405[i__7407] = cljs.core.first.call(null, s__7408);
          var G__7412 = i__7407 + 1;
          var G__7413 = cljs.core.next.call(null, s__7408);
          i__7407 = G__7412;
          s__7408 = G__7413;
          continue
        }else {
          return a__7405
        }
        break
      }
    }else {
      var n__2555__auto____7410 = size;
      var i__7411 = 0;
      while(true) {
        if(i__7411 < n__2555__auto____7410) {
          a__7405[i__7411] = init_val_or_seq;
          var G__7414 = i__7411 + 1;
          i__7411 = G__7414;
          continue
        }else {
        }
        break
      }
      return a__7405
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7422 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7423 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7424 = 0;
      var s__7425 = s__7423;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7426 = s__7425;
          if(and__3822__auto____7426) {
            return i__7424 < size
          }else {
            return and__3822__auto____7426
          }
        }())) {
          a__7422[i__7424] = cljs.core.first.call(null, s__7425);
          var G__7429 = i__7424 + 1;
          var G__7430 = cljs.core.next.call(null, s__7425);
          i__7424 = G__7429;
          s__7425 = G__7430;
          continue
        }else {
          return a__7422
        }
        break
      }
    }else {
      var n__2555__auto____7427 = size;
      var i__7428 = 0;
      while(true) {
        if(i__7428 < n__2555__auto____7427) {
          a__7422[i__7428] = init_val_or_seq;
          var G__7431 = i__7428 + 1;
          i__7428 = G__7431;
          continue
        }else {
        }
        break
      }
      return a__7422
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7439 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7440 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7441 = 0;
      var s__7442 = s__7440;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7443 = s__7442;
          if(and__3822__auto____7443) {
            return i__7441 < size
          }else {
            return and__3822__auto____7443
          }
        }())) {
          a__7439[i__7441] = cljs.core.first.call(null, s__7442);
          var G__7446 = i__7441 + 1;
          var G__7447 = cljs.core.next.call(null, s__7442);
          i__7441 = G__7446;
          s__7442 = G__7447;
          continue
        }else {
          return a__7439
        }
        break
      }
    }else {
      var n__2555__auto____7444 = size;
      var i__7445 = 0;
      while(true) {
        if(i__7445 < n__2555__auto____7444) {
          a__7439[i__7445] = init_val_or_seq;
          var G__7448 = i__7445 + 1;
          i__7445 = G__7448;
          continue
        }else {
        }
        break
      }
      return a__7439
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7453 = s;
    var i__7454 = n;
    var sum__7455 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7456 = i__7454 > 0;
        if(and__3822__auto____7456) {
          return cljs.core.seq.call(null, s__7453)
        }else {
          return and__3822__auto____7456
        }
      }())) {
        var G__7457 = cljs.core.next.call(null, s__7453);
        var G__7458 = i__7454 - 1;
        var G__7459 = sum__7455 + 1;
        s__7453 = G__7457;
        i__7454 = G__7458;
        sum__7455 = G__7459;
        continue
      }else {
        return sum__7455
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7464 = cljs.core.seq.call(null, x);
      if(s__7464) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7464)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7464), concat.call(null, cljs.core.chunk_rest.call(null, s__7464), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7464), concat.call(null, cljs.core.rest.call(null, s__7464), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7468__delegate = function(x, y, zs) {
      var cat__7467 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7466 = cljs.core.seq.call(null, xys);
          if(xys__7466) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7466)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7466), cat.call(null, cljs.core.chunk_rest.call(null, xys__7466), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7466), cat.call(null, cljs.core.rest.call(null, xys__7466), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7467.call(null, concat.call(null, x, y), zs)
    };
    var G__7468 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7468__delegate.call(this, x, y, zs)
    };
    G__7468.cljs$lang$maxFixedArity = 2;
    G__7468.cljs$lang$applyTo = function(arglist__7469) {
      var x = cljs.core.first(arglist__7469);
      var y = cljs.core.first(cljs.core.next(arglist__7469));
      var zs = cljs.core.rest(cljs.core.next(arglist__7469));
      return G__7468__delegate(x, y, zs)
    };
    G__7468.cljs$lang$arity$variadic = G__7468__delegate;
    return G__7468
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7470__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7470 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7470__delegate.call(this, a, b, c, d, more)
    };
    G__7470.cljs$lang$maxFixedArity = 4;
    G__7470.cljs$lang$applyTo = function(arglist__7471) {
      var a = cljs.core.first(arglist__7471);
      var b = cljs.core.first(cljs.core.next(arglist__7471));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7471)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7471))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7471))));
      return G__7470__delegate(a, b, c, d, more)
    };
    G__7470.cljs$lang$arity$variadic = G__7470__delegate;
    return G__7470
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7513 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7514 = cljs.core._first.call(null, args__7513);
    var args__7515 = cljs.core._rest.call(null, args__7513);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7514)
      }else {
        return f.call(null, a__7514)
      }
    }else {
      var b__7516 = cljs.core._first.call(null, args__7515);
      var args__7517 = cljs.core._rest.call(null, args__7515);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7514, b__7516)
        }else {
          return f.call(null, a__7514, b__7516)
        }
      }else {
        var c__7518 = cljs.core._first.call(null, args__7517);
        var args__7519 = cljs.core._rest.call(null, args__7517);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7514, b__7516, c__7518)
          }else {
            return f.call(null, a__7514, b__7516, c__7518)
          }
        }else {
          var d__7520 = cljs.core._first.call(null, args__7519);
          var args__7521 = cljs.core._rest.call(null, args__7519);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7514, b__7516, c__7518, d__7520)
            }else {
              return f.call(null, a__7514, b__7516, c__7518, d__7520)
            }
          }else {
            var e__7522 = cljs.core._first.call(null, args__7521);
            var args__7523 = cljs.core._rest.call(null, args__7521);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7514, b__7516, c__7518, d__7520, e__7522)
              }else {
                return f.call(null, a__7514, b__7516, c__7518, d__7520, e__7522)
              }
            }else {
              var f__7524 = cljs.core._first.call(null, args__7523);
              var args__7525 = cljs.core._rest.call(null, args__7523);
              if(argc === 6) {
                if(f__7524.cljs$lang$arity$6) {
                  return f__7524.cljs$lang$arity$6(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524)
                }else {
                  return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524)
                }
              }else {
                var g__7526 = cljs.core._first.call(null, args__7525);
                var args__7527 = cljs.core._rest.call(null, args__7525);
                if(argc === 7) {
                  if(f__7524.cljs$lang$arity$7) {
                    return f__7524.cljs$lang$arity$7(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526)
                  }else {
                    return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526)
                  }
                }else {
                  var h__7528 = cljs.core._first.call(null, args__7527);
                  var args__7529 = cljs.core._rest.call(null, args__7527);
                  if(argc === 8) {
                    if(f__7524.cljs$lang$arity$8) {
                      return f__7524.cljs$lang$arity$8(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528)
                    }else {
                      return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528)
                    }
                  }else {
                    var i__7530 = cljs.core._first.call(null, args__7529);
                    var args__7531 = cljs.core._rest.call(null, args__7529);
                    if(argc === 9) {
                      if(f__7524.cljs$lang$arity$9) {
                        return f__7524.cljs$lang$arity$9(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530)
                      }else {
                        return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530)
                      }
                    }else {
                      var j__7532 = cljs.core._first.call(null, args__7531);
                      var args__7533 = cljs.core._rest.call(null, args__7531);
                      if(argc === 10) {
                        if(f__7524.cljs$lang$arity$10) {
                          return f__7524.cljs$lang$arity$10(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532)
                        }else {
                          return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532)
                        }
                      }else {
                        var k__7534 = cljs.core._first.call(null, args__7533);
                        var args__7535 = cljs.core._rest.call(null, args__7533);
                        if(argc === 11) {
                          if(f__7524.cljs$lang$arity$11) {
                            return f__7524.cljs$lang$arity$11(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534)
                          }else {
                            return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534)
                          }
                        }else {
                          var l__7536 = cljs.core._first.call(null, args__7535);
                          var args__7537 = cljs.core._rest.call(null, args__7535);
                          if(argc === 12) {
                            if(f__7524.cljs$lang$arity$12) {
                              return f__7524.cljs$lang$arity$12(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536)
                            }else {
                              return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536)
                            }
                          }else {
                            var m__7538 = cljs.core._first.call(null, args__7537);
                            var args__7539 = cljs.core._rest.call(null, args__7537);
                            if(argc === 13) {
                              if(f__7524.cljs$lang$arity$13) {
                                return f__7524.cljs$lang$arity$13(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538)
                              }else {
                                return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538)
                              }
                            }else {
                              var n__7540 = cljs.core._first.call(null, args__7539);
                              var args__7541 = cljs.core._rest.call(null, args__7539);
                              if(argc === 14) {
                                if(f__7524.cljs$lang$arity$14) {
                                  return f__7524.cljs$lang$arity$14(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540)
                                }else {
                                  return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540)
                                }
                              }else {
                                var o__7542 = cljs.core._first.call(null, args__7541);
                                var args__7543 = cljs.core._rest.call(null, args__7541);
                                if(argc === 15) {
                                  if(f__7524.cljs$lang$arity$15) {
                                    return f__7524.cljs$lang$arity$15(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542)
                                  }else {
                                    return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542)
                                  }
                                }else {
                                  var p__7544 = cljs.core._first.call(null, args__7543);
                                  var args__7545 = cljs.core._rest.call(null, args__7543);
                                  if(argc === 16) {
                                    if(f__7524.cljs$lang$arity$16) {
                                      return f__7524.cljs$lang$arity$16(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544)
                                    }else {
                                      return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544)
                                    }
                                  }else {
                                    var q__7546 = cljs.core._first.call(null, args__7545);
                                    var args__7547 = cljs.core._rest.call(null, args__7545);
                                    if(argc === 17) {
                                      if(f__7524.cljs$lang$arity$17) {
                                        return f__7524.cljs$lang$arity$17(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546)
                                      }else {
                                        return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546)
                                      }
                                    }else {
                                      var r__7548 = cljs.core._first.call(null, args__7547);
                                      var args__7549 = cljs.core._rest.call(null, args__7547);
                                      if(argc === 18) {
                                        if(f__7524.cljs$lang$arity$18) {
                                          return f__7524.cljs$lang$arity$18(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548)
                                        }else {
                                          return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548)
                                        }
                                      }else {
                                        var s__7550 = cljs.core._first.call(null, args__7549);
                                        var args__7551 = cljs.core._rest.call(null, args__7549);
                                        if(argc === 19) {
                                          if(f__7524.cljs$lang$arity$19) {
                                            return f__7524.cljs$lang$arity$19(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548, s__7550)
                                          }else {
                                            return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548, s__7550)
                                          }
                                        }else {
                                          var t__7552 = cljs.core._first.call(null, args__7551);
                                          var args__7553 = cljs.core._rest.call(null, args__7551);
                                          if(argc === 20) {
                                            if(f__7524.cljs$lang$arity$20) {
                                              return f__7524.cljs$lang$arity$20(a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548, s__7550, t__7552)
                                            }else {
                                              return f__7524.call(null, a__7514, b__7516, c__7518, d__7520, e__7522, f__7524, g__7526, h__7528, i__7530, j__7532, k__7534, l__7536, m__7538, n__7540, o__7542, p__7544, q__7546, r__7548, s__7550, t__7552)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7568 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7569 = cljs.core.bounded_count.call(null, args, fixed_arity__7568 + 1);
      if(bc__7569 <= fixed_arity__7568) {
        return cljs.core.apply_to.call(null, f, bc__7569, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7570 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7571 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7572 = cljs.core.bounded_count.call(null, arglist__7570, fixed_arity__7571 + 1);
      if(bc__7572 <= fixed_arity__7571) {
        return cljs.core.apply_to.call(null, f, bc__7572, arglist__7570)
      }else {
        return f.cljs$lang$applyTo(arglist__7570)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7570))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7573 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7574 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7575 = cljs.core.bounded_count.call(null, arglist__7573, fixed_arity__7574 + 1);
      if(bc__7575 <= fixed_arity__7574) {
        return cljs.core.apply_to.call(null, f, bc__7575, arglist__7573)
      }else {
        return f.cljs$lang$applyTo(arglist__7573)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7573))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7576 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7577 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7578 = cljs.core.bounded_count.call(null, arglist__7576, fixed_arity__7577 + 1);
      if(bc__7578 <= fixed_arity__7577) {
        return cljs.core.apply_to.call(null, f, bc__7578, arglist__7576)
      }else {
        return f.cljs$lang$applyTo(arglist__7576)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7576))
    }
  };
  var apply__6 = function() {
    var G__7582__delegate = function(f, a, b, c, d, args) {
      var arglist__7579 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7580 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7581 = cljs.core.bounded_count.call(null, arglist__7579, fixed_arity__7580 + 1);
        if(bc__7581 <= fixed_arity__7580) {
          return cljs.core.apply_to.call(null, f, bc__7581, arglist__7579)
        }else {
          return f.cljs$lang$applyTo(arglist__7579)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7579))
      }
    };
    var G__7582 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7582__delegate.call(this, f, a, b, c, d, args)
    };
    G__7582.cljs$lang$maxFixedArity = 5;
    G__7582.cljs$lang$applyTo = function(arglist__7583) {
      var f = cljs.core.first(arglist__7583);
      var a = cljs.core.first(cljs.core.next(arglist__7583));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7583)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7583))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7583)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7583)))));
      return G__7582__delegate(f, a, b, c, d, args)
    };
    G__7582.cljs$lang$arity$variadic = G__7582__delegate;
    return G__7582
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7584) {
    var obj = cljs.core.first(arglist__7584);
    var f = cljs.core.first(cljs.core.next(arglist__7584));
    var args = cljs.core.rest(cljs.core.next(arglist__7584));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7585__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7585 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7585__delegate.call(this, x, y, more)
    };
    G__7585.cljs$lang$maxFixedArity = 2;
    G__7585.cljs$lang$applyTo = function(arglist__7586) {
      var x = cljs.core.first(arglist__7586);
      var y = cljs.core.first(cljs.core.next(arglist__7586));
      var more = cljs.core.rest(cljs.core.next(arglist__7586));
      return G__7585__delegate(x, y, more)
    };
    G__7585.cljs$lang$arity$variadic = G__7585__delegate;
    return G__7585
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7587 = pred;
        var G__7588 = cljs.core.next.call(null, coll);
        pred = G__7587;
        coll = G__7588;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7590 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7590)) {
        return or__3824__auto____7590
      }else {
        var G__7591 = pred;
        var G__7592 = cljs.core.next.call(null, coll);
        pred = G__7591;
        coll = G__7592;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7593 = null;
    var G__7593__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7593__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7593__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7593__3 = function() {
      var G__7594__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7594 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7594__delegate.call(this, x, y, zs)
      };
      G__7594.cljs$lang$maxFixedArity = 2;
      G__7594.cljs$lang$applyTo = function(arglist__7595) {
        var x = cljs.core.first(arglist__7595);
        var y = cljs.core.first(cljs.core.next(arglist__7595));
        var zs = cljs.core.rest(cljs.core.next(arglist__7595));
        return G__7594__delegate(x, y, zs)
      };
      G__7594.cljs$lang$arity$variadic = G__7594__delegate;
      return G__7594
    }();
    G__7593 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7593__0.call(this);
        case 1:
          return G__7593__1.call(this, x);
        case 2:
          return G__7593__2.call(this, x, y);
        default:
          return G__7593__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7593.cljs$lang$maxFixedArity = 2;
    G__7593.cljs$lang$applyTo = G__7593__3.cljs$lang$applyTo;
    return G__7593
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7596__delegate = function(args) {
      return x
    };
    var G__7596 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7596__delegate.call(this, args)
    };
    G__7596.cljs$lang$maxFixedArity = 0;
    G__7596.cljs$lang$applyTo = function(arglist__7597) {
      var args = cljs.core.seq(arglist__7597);
      return G__7596__delegate(args)
    };
    G__7596.cljs$lang$arity$variadic = G__7596__delegate;
    return G__7596
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7604 = null;
      var G__7604__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7604__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7604__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7604__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7604__4 = function() {
        var G__7605__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7605 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7605__delegate.call(this, x, y, z, args)
        };
        G__7605.cljs$lang$maxFixedArity = 3;
        G__7605.cljs$lang$applyTo = function(arglist__7606) {
          var x = cljs.core.first(arglist__7606);
          var y = cljs.core.first(cljs.core.next(arglist__7606));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7606)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7606)));
          return G__7605__delegate(x, y, z, args)
        };
        G__7605.cljs$lang$arity$variadic = G__7605__delegate;
        return G__7605
      }();
      G__7604 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7604__0.call(this);
          case 1:
            return G__7604__1.call(this, x);
          case 2:
            return G__7604__2.call(this, x, y);
          case 3:
            return G__7604__3.call(this, x, y, z);
          default:
            return G__7604__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7604.cljs$lang$maxFixedArity = 3;
      G__7604.cljs$lang$applyTo = G__7604__4.cljs$lang$applyTo;
      return G__7604
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7607 = null;
      var G__7607__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7607__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7607__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7607__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7607__4 = function() {
        var G__7608__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7608 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7608__delegate.call(this, x, y, z, args)
        };
        G__7608.cljs$lang$maxFixedArity = 3;
        G__7608.cljs$lang$applyTo = function(arglist__7609) {
          var x = cljs.core.first(arglist__7609);
          var y = cljs.core.first(cljs.core.next(arglist__7609));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7609)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7609)));
          return G__7608__delegate(x, y, z, args)
        };
        G__7608.cljs$lang$arity$variadic = G__7608__delegate;
        return G__7608
      }();
      G__7607 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7607__0.call(this);
          case 1:
            return G__7607__1.call(this, x);
          case 2:
            return G__7607__2.call(this, x, y);
          case 3:
            return G__7607__3.call(this, x, y, z);
          default:
            return G__7607__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7607.cljs$lang$maxFixedArity = 3;
      G__7607.cljs$lang$applyTo = G__7607__4.cljs$lang$applyTo;
      return G__7607
    }()
  };
  var comp__4 = function() {
    var G__7610__delegate = function(f1, f2, f3, fs) {
      var fs__7601 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7611__delegate = function(args) {
          var ret__7602 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7601), args);
          var fs__7603 = cljs.core.next.call(null, fs__7601);
          while(true) {
            if(fs__7603) {
              var G__7612 = cljs.core.first.call(null, fs__7603).call(null, ret__7602);
              var G__7613 = cljs.core.next.call(null, fs__7603);
              ret__7602 = G__7612;
              fs__7603 = G__7613;
              continue
            }else {
              return ret__7602
            }
            break
          }
        };
        var G__7611 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7611__delegate.call(this, args)
        };
        G__7611.cljs$lang$maxFixedArity = 0;
        G__7611.cljs$lang$applyTo = function(arglist__7614) {
          var args = cljs.core.seq(arglist__7614);
          return G__7611__delegate(args)
        };
        G__7611.cljs$lang$arity$variadic = G__7611__delegate;
        return G__7611
      }()
    };
    var G__7610 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7610__delegate.call(this, f1, f2, f3, fs)
    };
    G__7610.cljs$lang$maxFixedArity = 3;
    G__7610.cljs$lang$applyTo = function(arglist__7615) {
      var f1 = cljs.core.first(arglist__7615);
      var f2 = cljs.core.first(cljs.core.next(arglist__7615));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7615)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7615)));
      return G__7610__delegate(f1, f2, f3, fs)
    };
    G__7610.cljs$lang$arity$variadic = G__7610__delegate;
    return G__7610
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7616__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7616 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7616__delegate.call(this, args)
      };
      G__7616.cljs$lang$maxFixedArity = 0;
      G__7616.cljs$lang$applyTo = function(arglist__7617) {
        var args = cljs.core.seq(arglist__7617);
        return G__7616__delegate(args)
      };
      G__7616.cljs$lang$arity$variadic = G__7616__delegate;
      return G__7616
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7618__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7618 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7618__delegate.call(this, args)
      };
      G__7618.cljs$lang$maxFixedArity = 0;
      G__7618.cljs$lang$applyTo = function(arglist__7619) {
        var args = cljs.core.seq(arglist__7619);
        return G__7618__delegate(args)
      };
      G__7618.cljs$lang$arity$variadic = G__7618__delegate;
      return G__7618
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7620__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7620 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7620__delegate.call(this, args)
      };
      G__7620.cljs$lang$maxFixedArity = 0;
      G__7620.cljs$lang$applyTo = function(arglist__7621) {
        var args = cljs.core.seq(arglist__7621);
        return G__7620__delegate(args)
      };
      G__7620.cljs$lang$arity$variadic = G__7620__delegate;
      return G__7620
    }()
  };
  var partial__5 = function() {
    var G__7622__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7623__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7623 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7623__delegate.call(this, args)
        };
        G__7623.cljs$lang$maxFixedArity = 0;
        G__7623.cljs$lang$applyTo = function(arglist__7624) {
          var args = cljs.core.seq(arglist__7624);
          return G__7623__delegate(args)
        };
        G__7623.cljs$lang$arity$variadic = G__7623__delegate;
        return G__7623
      }()
    };
    var G__7622 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7622__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7622.cljs$lang$maxFixedArity = 4;
    G__7622.cljs$lang$applyTo = function(arglist__7625) {
      var f = cljs.core.first(arglist__7625);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7625));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7625)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7625))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7625))));
      return G__7622__delegate(f, arg1, arg2, arg3, more)
    };
    G__7622.cljs$lang$arity$variadic = G__7622__delegate;
    return G__7622
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7626 = null;
      var G__7626__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7626__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7626__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7626__4 = function() {
        var G__7627__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7627 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7627__delegate.call(this, a, b, c, ds)
        };
        G__7627.cljs$lang$maxFixedArity = 3;
        G__7627.cljs$lang$applyTo = function(arglist__7628) {
          var a = cljs.core.first(arglist__7628);
          var b = cljs.core.first(cljs.core.next(arglist__7628));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7628)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7628)));
          return G__7627__delegate(a, b, c, ds)
        };
        G__7627.cljs$lang$arity$variadic = G__7627__delegate;
        return G__7627
      }();
      G__7626 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7626__1.call(this, a);
          case 2:
            return G__7626__2.call(this, a, b);
          case 3:
            return G__7626__3.call(this, a, b, c);
          default:
            return G__7626__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7626.cljs$lang$maxFixedArity = 3;
      G__7626.cljs$lang$applyTo = G__7626__4.cljs$lang$applyTo;
      return G__7626
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7629 = null;
      var G__7629__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7629__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7629__4 = function() {
        var G__7630__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7630 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7630__delegate.call(this, a, b, c, ds)
        };
        G__7630.cljs$lang$maxFixedArity = 3;
        G__7630.cljs$lang$applyTo = function(arglist__7631) {
          var a = cljs.core.first(arglist__7631);
          var b = cljs.core.first(cljs.core.next(arglist__7631));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7631)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7631)));
          return G__7630__delegate(a, b, c, ds)
        };
        G__7630.cljs$lang$arity$variadic = G__7630__delegate;
        return G__7630
      }();
      G__7629 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7629__2.call(this, a, b);
          case 3:
            return G__7629__3.call(this, a, b, c);
          default:
            return G__7629__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7629.cljs$lang$maxFixedArity = 3;
      G__7629.cljs$lang$applyTo = G__7629__4.cljs$lang$applyTo;
      return G__7629
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7632 = null;
      var G__7632__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7632__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7632__4 = function() {
        var G__7633__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7633 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7633__delegate.call(this, a, b, c, ds)
        };
        G__7633.cljs$lang$maxFixedArity = 3;
        G__7633.cljs$lang$applyTo = function(arglist__7634) {
          var a = cljs.core.first(arglist__7634);
          var b = cljs.core.first(cljs.core.next(arglist__7634));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7634)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7634)));
          return G__7633__delegate(a, b, c, ds)
        };
        G__7633.cljs$lang$arity$variadic = G__7633__delegate;
        return G__7633
      }();
      G__7632 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7632__2.call(this, a, b);
          case 3:
            return G__7632__3.call(this, a, b, c);
          default:
            return G__7632__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7632.cljs$lang$maxFixedArity = 3;
      G__7632.cljs$lang$applyTo = G__7632__4.cljs$lang$applyTo;
      return G__7632
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7650 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7658 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7658) {
        var s__7659 = temp__3974__auto____7658;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7659)) {
          var c__7660 = cljs.core.chunk_first.call(null, s__7659);
          var size__7661 = cljs.core.count.call(null, c__7660);
          var b__7662 = cljs.core.chunk_buffer.call(null, size__7661);
          var n__2555__auto____7663 = size__7661;
          var i__7664 = 0;
          while(true) {
            if(i__7664 < n__2555__auto____7663) {
              cljs.core.chunk_append.call(null, b__7662, f.call(null, idx + i__7664, cljs.core._nth.call(null, c__7660, i__7664)));
              var G__7665 = i__7664 + 1;
              i__7664 = G__7665;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7662), mapi.call(null, idx + size__7661, cljs.core.chunk_rest.call(null, s__7659)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7659)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7659)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7650.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7675 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7675) {
      var s__7676 = temp__3974__auto____7675;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7676)) {
        var c__7677 = cljs.core.chunk_first.call(null, s__7676);
        var size__7678 = cljs.core.count.call(null, c__7677);
        var b__7679 = cljs.core.chunk_buffer.call(null, size__7678);
        var n__2555__auto____7680 = size__7678;
        var i__7681 = 0;
        while(true) {
          if(i__7681 < n__2555__auto____7680) {
            var x__7682 = f.call(null, cljs.core._nth.call(null, c__7677, i__7681));
            if(x__7682 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7679, x__7682)
            }
            var G__7684 = i__7681 + 1;
            i__7681 = G__7684;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7679), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7676)))
      }else {
        var x__7683 = f.call(null, cljs.core.first.call(null, s__7676));
        if(x__7683 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7676))
        }else {
          return cljs.core.cons.call(null, x__7683, keep.call(null, f, cljs.core.rest.call(null, s__7676)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7710 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7720 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7720) {
        var s__7721 = temp__3974__auto____7720;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7721)) {
          var c__7722 = cljs.core.chunk_first.call(null, s__7721);
          var size__7723 = cljs.core.count.call(null, c__7722);
          var b__7724 = cljs.core.chunk_buffer.call(null, size__7723);
          var n__2555__auto____7725 = size__7723;
          var i__7726 = 0;
          while(true) {
            if(i__7726 < n__2555__auto____7725) {
              var x__7727 = f.call(null, idx + i__7726, cljs.core._nth.call(null, c__7722, i__7726));
              if(x__7727 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7724, x__7727)
              }
              var G__7729 = i__7726 + 1;
              i__7726 = G__7729;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7724), keepi.call(null, idx + size__7723, cljs.core.chunk_rest.call(null, s__7721)))
        }else {
          var x__7728 = f.call(null, idx, cljs.core.first.call(null, s__7721));
          if(x__7728 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7721))
          }else {
            return cljs.core.cons.call(null, x__7728, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7721)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7710.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7815 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7815)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7815
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7816 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7816)) {
            var and__3822__auto____7817 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7817)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7817
            }
          }else {
            return and__3822__auto____7816
          }
        }())
      };
      var ep1__4 = function() {
        var G__7886__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7818 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7818)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7818
            }
          }())
        };
        var G__7886 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7886__delegate.call(this, x, y, z, args)
        };
        G__7886.cljs$lang$maxFixedArity = 3;
        G__7886.cljs$lang$applyTo = function(arglist__7887) {
          var x = cljs.core.first(arglist__7887);
          var y = cljs.core.first(cljs.core.next(arglist__7887));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7887)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7887)));
          return G__7886__delegate(x, y, z, args)
        };
        G__7886.cljs$lang$arity$variadic = G__7886__delegate;
        return G__7886
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7830 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7830)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7830
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7831 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7831)) {
            var and__3822__auto____7832 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7832)) {
              var and__3822__auto____7833 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7833)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7833
              }
            }else {
              return and__3822__auto____7832
            }
          }else {
            return and__3822__auto____7831
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7834 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7834)) {
            var and__3822__auto____7835 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7835)) {
              var and__3822__auto____7836 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7836)) {
                var and__3822__auto____7837 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7837)) {
                  var and__3822__auto____7838 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7838)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7838
                  }
                }else {
                  return and__3822__auto____7837
                }
              }else {
                return and__3822__auto____7836
              }
            }else {
              return and__3822__auto____7835
            }
          }else {
            return and__3822__auto____7834
          }
        }())
      };
      var ep2__4 = function() {
        var G__7888__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7839 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7839)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7685_SHARP_) {
                var and__3822__auto____7840 = p1.call(null, p1__7685_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7840)) {
                  return p2.call(null, p1__7685_SHARP_)
                }else {
                  return and__3822__auto____7840
                }
              }, args)
            }else {
              return and__3822__auto____7839
            }
          }())
        };
        var G__7888 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7888__delegate.call(this, x, y, z, args)
        };
        G__7888.cljs$lang$maxFixedArity = 3;
        G__7888.cljs$lang$applyTo = function(arglist__7889) {
          var x = cljs.core.first(arglist__7889);
          var y = cljs.core.first(cljs.core.next(arglist__7889));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7889)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7889)));
          return G__7888__delegate(x, y, z, args)
        };
        G__7888.cljs$lang$arity$variadic = G__7888__delegate;
        return G__7888
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7859 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7859)) {
            var and__3822__auto____7860 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7860)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7860
            }
          }else {
            return and__3822__auto____7859
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7861 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7861)) {
            var and__3822__auto____7862 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7862)) {
              var and__3822__auto____7863 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7863)) {
                var and__3822__auto____7864 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7864)) {
                  var and__3822__auto____7865 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7865)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7865
                  }
                }else {
                  return and__3822__auto____7864
                }
              }else {
                return and__3822__auto____7863
              }
            }else {
              return and__3822__auto____7862
            }
          }else {
            return and__3822__auto____7861
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7866 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7866)) {
            var and__3822__auto____7867 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7867)) {
              var and__3822__auto____7868 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7868)) {
                var and__3822__auto____7869 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7869)) {
                  var and__3822__auto____7870 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7870)) {
                    var and__3822__auto____7871 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7871)) {
                      var and__3822__auto____7872 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7872)) {
                        var and__3822__auto____7873 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7873)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7873
                        }
                      }else {
                        return and__3822__auto____7872
                      }
                    }else {
                      return and__3822__auto____7871
                    }
                  }else {
                    return and__3822__auto____7870
                  }
                }else {
                  return and__3822__auto____7869
                }
              }else {
                return and__3822__auto____7868
              }
            }else {
              return and__3822__auto____7867
            }
          }else {
            return and__3822__auto____7866
          }
        }())
      };
      var ep3__4 = function() {
        var G__7890__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7874 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7874)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7686_SHARP_) {
                var and__3822__auto____7875 = p1.call(null, p1__7686_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7875)) {
                  var and__3822__auto____7876 = p2.call(null, p1__7686_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7876)) {
                    return p3.call(null, p1__7686_SHARP_)
                  }else {
                    return and__3822__auto____7876
                  }
                }else {
                  return and__3822__auto____7875
                }
              }, args)
            }else {
              return and__3822__auto____7874
            }
          }())
        };
        var G__7890 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7890__delegate.call(this, x, y, z, args)
        };
        G__7890.cljs$lang$maxFixedArity = 3;
        G__7890.cljs$lang$applyTo = function(arglist__7891) {
          var x = cljs.core.first(arglist__7891);
          var y = cljs.core.first(cljs.core.next(arglist__7891));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7891)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7891)));
          return G__7890__delegate(x, y, z, args)
        };
        G__7890.cljs$lang$arity$variadic = G__7890__delegate;
        return G__7890
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7892__delegate = function(p1, p2, p3, ps) {
      var ps__7877 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7687_SHARP_) {
            return p1__7687_SHARP_.call(null, x)
          }, ps__7877)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7688_SHARP_) {
            var and__3822__auto____7882 = p1__7688_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7882)) {
              return p1__7688_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7882
            }
          }, ps__7877)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7689_SHARP_) {
            var and__3822__auto____7883 = p1__7689_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7883)) {
              var and__3822__auto____7884 = p1__7689_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7884)) {
                return p1__7689_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7884
              }
            }else {
              return and__3822__auto____7883
            }
          }, ps__7877)
        };
        var epn__4 = function() {
          var G__7893__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7885 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7885)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7690_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7690_SHARP_, args)
                }, ps__7877)
              }else {
                return and__3822__auto____7885
              }
            }())
          };
          var G__7893 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7893__delegate.call(this, x, y, z, args)
          };
          G__7893.cljs$lang$maxFixedArity = 3;
          G__7893.cljs$lang$applyTo = function(arglist__7894) {
            var x = cljs.core.first(arglist__7894);
            var y = cljs.core.first(cljs.core.next(arglist__7894));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7894)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7894)));
            return G__7893__delegate(x, y, z, args)
          };
          G__7893.cljs$lang$arity$variadic = G__7893__delegate;
          return G__7893
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7892 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7892__delegate.call(this, p1, p2, p3, ps)
    };
    G__7892.cljs$lang$maxFixedArity = 3;
    G__7892.cljs$lang$applyTo = function(arglist__7895) {
      var p1 = cljs.core.first(arglist__7895);
      var p2 = cljs.core.first(cljs.core.next(arglist__7895));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7895)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7895)));
      return G__7892__delegate(p1, p2, p3, ps)
    };
    G__7892.cljs$lang$arity$variadic = G__7892__delegate;
    return G__7892
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7976 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7976)) {
          return or__3824__auto____7976
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7977 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7977)) {
          return or__3824__auto____7977
        }else {
          var or__3824__auto____7978 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7978)) {
            return or__3824__auto____7978
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8047__delegate = function(x, y, z, args) {
          var or__3824__auto____7979 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7979)) {
            return or__3824__auto____7979
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8047 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8047__delegate.call(this, x, y, z, args)
        };
        G__8047.cljs$lang$maxFixedArity = 3;
        G__8047.cljs$lang$applyTo = function(arglist__8048) {
          var x = cljs.core.first(arglist__8048);
          var y = cljs.core.first(cljs.core.next(arglist__8048));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8048)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8048)));
          return G__8047__delegate(x, y, z, args)
        };
        G__8047.cljs$lang$arity$variadic = G__8047__delegate;
        return G__8047
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____7991 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7991)) {
          return or__3824__auto____7991
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7992 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7992)) {
          return or__3824__auto____7992
        }else {
          var or__3824__auto____7993 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7993)) {
            return or__3824__auto____7993
          }else {
            var or__3824__auto____7994 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7994)) {
              return or__3824__auto____7994
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7995 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7995)) {
          return or__3824__auto____7995
        }else {
          var or__3824__auto____7996 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7996)) {
            return or__3824__auto____7996
          }else {
            var or__3824__auto____7997 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7997)) {
              return or__3824__auto____7997
            }else {
              var or__3824__auto____7998 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7998)) {
                return or__3824__auto____7998
              }else {
                var or__3824__auto____7999 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7999)) {
                  return or__3824__auto____7999
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8049__delegate = function(x, y, z, args) {
          var or__3824__auto____8000 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8000)) {
            return or__3824__auto____8000
          }else {
            return cljs.core.some.call(null, function(p1__7730_SHARP_) {
              var or__3824__auto____8001 = p1.call(null, p1__7730_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8001)) {
                return or__3824__auto____8001
              }else {
                return p2.call(null, p1__7730_SHARP_)
              }
            }, args)
          }
        };
        var G__8049 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8049__delegate.call(this, x, y, z, args)
        };
        G__8049.cljs$lang$maxFixedArity = 3;
        G__8049.cljs$lang$applyTo = function(arglist__8050) {
          var x = cljs.core.first(arglist__8050);
          var y = cljs.core.first(cljs.core.next(arglist__8050));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8050)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8050)));
          return G__8049__delegate(x, y, z, args)
        };
        G__8049.cljs$lang$arity$variadic = G__8049__delegate;
        return G__8049
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8020 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8020)) {
          return or__3824__auto____8020
        }else {
          var or__3824__auto____8021 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8021)) {
            return or__3824__auto____8021
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8022 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8022)) {
          return or__3824__auto____8022
        }else {
          var or__3824__auto____8023 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8023)) {
            return or__3824__auto____8023
          }else {
            var or__3824__auto____8024 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8024)) {
              return or__3824__auto____8024
            }else {
              var or__3824__auto____8025 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8025)) {
                return or__3824__auto____8025
              }else {
                var or__3824__auto____8026 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8026)) {
                  return or__3824__auto____8026
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8027 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8027)) {
          return or__3824__auto____8027
        }else {
          var or__3824__auto____8028 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8028)) {
            return or__3824__auto____8028
          }else {
            var or__3824__auto____8029 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8029)) {
              return or__3824__auto____8029
            }else {
              var or__3824__auto____8030 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8030)) {
                return or__3824__auto____8030
              }else {
                var or__3824__auto____8031 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8031)) {
                  return or__3824__auto____8031
                }else {
                  var or__3824__auto____8032 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8032)) {
                    return or__3824__auto____8032
                  }else {
                    var or__3824__auto____8033 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8033)) {
                      return or__3824__auto____8033
                    }else {
                      var or__3824__auto____8034 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8034)) {
                        return or__3824__auto____8034
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8051__delegate = function(x, y, z, args) {
          var or__3824__auto____8035 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8035)) {
            return or__3824__auto____8035
          }else {
            return cljs.core.some.call(null, function(p1__7731_SHARP_) {
              var or__3824__auto____8036 = p1.call(null, p1__7731_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8036)) {
                return or__3824__auto____8036
              }else {
                var or__3824__auto____8037 = p2.call(null, p1__7731_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8037)) {
                  return or__3824__auto____8037
                }else {
                  return p3.call(null, p1__7731_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8051 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8051__delegate.call(this, x, y, z, args)
        };
        G__8051.cljs$lang$maxFixedArity = 3;
        G__8051.cljs$lang$applyTo = function(arglist__8052) {
          var x = cljs.core.first(arglist__8052);
          var y = cljs.core.first(cljs.core.next(arglist__8052));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8052)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8052)));
          return G__8051__delegate(x, y, z, args)
        };
        G__8051.cljs$lang$arity$variadic = G__8051__delegate;
        return G__8051
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8053__delegate = function(p1, p2, p3, ps) {
      var ps__8038 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7732_SHARP_) {
            return p1__7732_SHARP_.call(null, x)
          }, ps__8038)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7733_SHARP_) {
            var or__3824__auto____8043 = p1__7733_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8043)) {
              return or__3824__auto____8043
            }else {
              return p1__7733_SHARP_.call(null, y)
            }
          }, ps__8038)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7734_SHARP_) {
            var or__3824__auto____8044 = p1__7734_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8044)) {
              return or__3824__auto____8044
            }else {
              var or__3824__auto____8045 = p1__7734_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8045)) {
                return or__3824__auto____8045
              }else {
                return p1__7734_SHARP_.call(null, z)
              }
            }
          }, ps__8038)
        };
        var spn__4 = function() {
          var G__8054__delegate = function(x, y, z, args) {
            var or__3824__auto____8046 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8046)) {
              return or__3824__auto____8046
            }else {
              return cljs.core.some.call(null, function(p1__7735_SHARP_) {
                return cljs.core.some.call(null, p1__7735_SHARP_, args)
              }, ps__8038)
            }
          };
          var G__8054 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8054__delegate.call(this, x, y, z, args)
          };
          G__8054.cljs$lang$maxFixedArity = 3;
          G__8054.cljs$lang$applyTo = function(arglist__8055) {
            var x = cljs.core.first(arglist__8055);
            var y = cljs.core.first(cljs.core.next(arglist__8055));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8055)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8055)));
            return G__8054__delegate(x, y, z, args)
          };
          G__8054.cljs$lang$arity$variadic = G__8054__delegate;
          return G__8054
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8053 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8053__delegate.call(this, p1, p2, p3, ps)
    };
    G__8053.cljs$lang$maxFixedArity = 3;
    G__8053.cljs$lang$applyTo = function(arglist__8056) {
      var p1 = cljs.core.first(arglist__8056);
      var p2 = cljs.core.first(cljs.core.next(arglist__8056));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8056)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8056)));
      return G__8053__delegate(p1, p2, p3, ps)
    };
    G__8053.cljs$lang$arity$variadic = G__8053__delegate;
    return G__8053
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8075 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8075) {
        var s__8076 = temp__3974__auto____8075;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8076)) {
          var c__8077 = cljs.core.chunk_first.call(null, s__8076);
          var size__8078 = cljs.core.count.call(null, c__8077);
          var b__8079 = cljs.core.chunk_buffer.call(null, size__8078);
          var n__2555__auto____8080 = size__8078;
          var i__8081 = 0;
          while(true) {
            if(i__8081 < n__2555__auto____8080) {
              cljs.core.chunk_append.call(null, b__8079, f.call(null, cljs.core._nth.call(null, c__8077, i__8081)));
              var G__8093 = i__8081 + 1;
              i__8081 = G__8093;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8079), map.call(null, f, cljs.core.chunk_rest.call(null, s__8076)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8076)), map.call(null, f, cljs.core.rest.call(null, s__8076)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8082 = cljs.core.seq.call(null, c1);
      var s2__8083 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8084 = s1__8082;
        if(and__3822__auto____8084) {
          return s2__8083
        }else {
          return and__3822__auto____8084
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8082), cljs.core.first.call(null, s2__8083)), map.call(null, f, cljs.core.rest.call(null, s1__8082), cljs.core.rest.call(null, s2__8083)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8085 = cljs.core.seq.call(null, c1);
      var s2__8086 = cljs.core.seq.call(null, c2);
      var s3__8087 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8088 = s1__8085;
        if(and__3822__auto____8088) {
          var and__3822__auto____8089 = s2__8086;
          if(and__3822__auto____8089) {
            return s3__8087
          }else {
            return and__3822__auto____8089
          }
        }else {
          return and__3822__auto____8088
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8085), cljs.core.first.call(null, s2__8086), cljs.core.first.call(null, s3__8087)), map.call(null, f, cljs.core.rest.call(null, s1__8085), cljs.core.rest.call(null, s2__8086), cljs.core.rest.call(null, s3__8087)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8094__delegate = function(f, c1, c2, c3, colls) {
      var step__8092 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8091 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8091)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8091), step.call(null, map.call(null, cljs.core.rest, ss__8091)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7896_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7896_SHARP_)
      }, step__8092.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8094 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8094__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8094.cljs$lang$maxFixedArity = 4;
    G__8094.cljs$lang$applyTo = function(arglist__8095) {
      var f = cljs.core.first(arglist__8095);
      var c1 = cljs.core.first(cljs.core.next(arglist__8095));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8095)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8095))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8095))));
      return G__8094__delegate(f, c1, c2, c3, colls)
    };
    G__8094.cljs$lang$arity$variadic = G__8094__delegate;
    return G__8094
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8098 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8098) {
        var s__8099 = temp__3974__auto____8098;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8099), take.call(null, n - 1, cljs.core.rest.call(null, s__8099)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8105 = function(n, coll) {
    while(true) {
      var s__8103 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8104 = n > 0;
        if(and__3822__auto____8104) {
          return s__8103
        }else {
          return and__3822__auto____8104
        }
      }())) {
        var G__8106 = n - 1;
        var G__8107 = cljs.core.rest.call(null, s__8103);
        n = G__8106;
        coll = G__8107;
        continue
      }else {
        return s__8103
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8105.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8110 = cljs.core.seq.call(null, coll);
  var lead__8111 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8111) {
      var G__8112 = cljs.core.next.call(null, s__8110);
      var G__8113 = cljs.core.next.call(null, lead__8111);
      s__8110 = G__8112;
      lead__8111 = G__8113;
      continue
    }else {
      return s__8110
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8119 = function(pred, coll) {
    while(true) {
      var s__8117 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8118 = s__8117;
        if(and__3822__auto____8118) {
          return pred.call(null, cljs.core.first.call(null, s__8117))
        }else {
          return and__3822__auto____8118
        }
      }())) {
        var G__8120 = pred;
        var G__8121 = cljs.core.rest.call(null, s__8117);
        pred = G__8120;
        coll = G__8121;
        continue
      }else {
        return s__8117
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8119.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8124 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8124) {
      var s__8125 = temp__3974__auto____8124;
      return cljs.core.concat.call(null, s__8125, cycle.call(null, s__8125))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8130 = cljs.core.seq.call(null, c1);
      var s2__8131 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8132 = s1__8130;
        if(and__3822__auto____8132) {
          return s2__8131
        }else {
          return and__3822__auto____8132
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8130), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8131), interleave.call(null, cljs.core.rest.call(null, s1__8130), cljs.core.rest.call(null, s2__8131))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8134__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8133 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8133)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8133), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8133)))
        }else {
          return null
        }
      }, null)
    };
    var G__8134 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8134__delegate.call(this, c1, c2, colls)
    };
    G__8134.cljs$lang$maxFixedArity = 2;
    G__8134.cljs$lang$applyTo = function(arglist__8135) {
      var c1 = cljs.core.first(arglist__8135);
      var c2 = cljs.core.first(cljs.core.next(arglist__8135));
      var colls = cljs.core.rest(cljs.core.next(arglist__8135));
      return G__8134__delegate(c1, c2, colls)
    };
    G__8134.cljs$lang$arity$variadic = G__8134__delegate;
    return G__8134
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8145 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8143 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8143) {
        var coll__8144 = temp__3971__auto____8143;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8144), cat.call(null, cljs.core.rest.call(null, coll__8144), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8145.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8146__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8146 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8146__delegate.call(this, f, coll, colls)
    };
    G__8146.cljs$lang$maxFixedArity = 2;
    G__8146.cljs$lang$applyTo = function(arglist__8147) {
      var f = cljs.core.first(arglist__8147);
      var coll = cljs.core.first(cljs.core.next(arglist__8147));
      var colls = cljs.core.rest(cljs.core.next(arglist__8147));
      return G__8146__delegate(f, coll, colls)
    };
    G__8146.cljs$lang$arity$variadic = G__8146__delegate;
    return G__8146
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8157 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8157) {
      var s__8158 = temp__3974__auto____8157;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8158)) {
        var c__8159 = cljs.core.chunk_first.call(null, s__8158);
        var size__8160 = cljs.core.count.call(null, c__8159);
        var b__8161 = cljs.core.chunk_buffer.call(null, size__8160);
        var n__2555__auto____8162 = size__8160;
        var i__8163 = 0;
        while(true) {
          if(i__8163 < n__2555__auto____8162) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8159, i__8163)))) {
              cljs.core.chunk_append.call(null, b__8161, cljs.core._nth.call(null, c__8159, i__8163))
            }else {
            }
            var G__8166 = i__8163 + 1;
            i__8163 = G__8166;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8161), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8158)))
      }else {
        var f__8164 = cljs.core.first.call(null, s__8158);
        var r__8165 = cljs.core.rest.call(null, s__8158);
        if(cljs.core.truth_(pred.call(null, f__8164))) {
          return cljs.core.cons.call(null, f__8164, filter.call(null, pred, r__8165))
        }else {
          return filter.call(null, pred, r__8165)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8169 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8169.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8167_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8167_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8173__8174 = to;
    if(G__8173__8174) {
      if(function() {
        var or__3824__auto____8175 = G__8173__8174.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8175) {
          return or__3824__auto____8175
        }else {
          return G__8173__8174.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8173__8174.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8173__8174)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8173__8174)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8176__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8176 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8176__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8176.cljs$lang$maxFixedArity = 4;
    G__8176.cljs$lang$applyTo = function(arglist__8177) {
      var f = cljs.core.first(arglist__8177);
      var c1 = cljs.core.first(cljs.core.next(arglist__8177));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8177)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8177))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8177))));
      return G__8176__delegate(f, c1, c2, c3, colls)
    };
    G__8176.cljs$lang$arity$variadic = G__8176__delegate;
    return G__8176
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8184 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8184) {
        var s__8185 = temp__3974__auto____8184;
        var p__8186 = cljs.core.take.call(null, n, s__8185);
        if(n === cljs.core.count.call(null, p__8186)) {
          return cljs.core.cons.call(null, p__8186, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8185)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8187 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8187) {
        var s__8188 = temp__3974__auto____8187;
        var p__8189 = cljs.core.take.call(null, n, s__8188);
        if(n === cljs.core.count.call(null, p__8189)) {
          return cljs.core.cons.call(null, p__8189, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8188)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8189, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8194 = cljs.core.lookup_sentinel;
    var m__8195 = m;
    var ks__8196 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8196) {
        var m__8197 = cljs.core._lookup.call(null, m__8195, cljs.core.first.call(null, ks__8196), sentinel__8194);
        if(sentinel__8194 === m__8197) {
          return not_found
        }else {
          var G__8198 = sentinel__8194;
          var G__8199 = m__8197;
          var G__8200 = cljs.core.next.call(null, ks__8196);
          sentinel__8194 = G__8198;
          m__8195 = G__8199;
          ks__8196 = G__8200;
          continue
        }
      }else {
        return m__8195
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8201, v) {
  var vec__8206__8207 = p__8201;
  var k__8208 = cljs.core.nth.call(null, vec__8206__8207, 0, null);
  var ks__8209 = cljs.core.nthnext.call(null, vec__8206__8207, 1);
  if(cljs.core.truth_(ks__8209)) {
    return cljs.core.assoc.call(null, m, k__8208, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8208, null), ks__8209, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8208, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8210, f, args) {
    var vec__8215__8216 = p__8210;
    var k__8217 = cljs.core.nth.call(null, vec__8215__8216, 0, null);
    var ks__8218 = cljs.core.nthnext.call(null, vec__8215__8216, 1);
    if(cljs.core.truth_(ks__8218)) {
      return cljs.core.assoc.call(null, m, k__8217, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8217, null), ks__8218, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8217, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8217, null), args))
    }
  };
  var update_in = function(m, p__8210, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8210, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8219) {
    var m = cljs.core.first(arglist__8219);
    var p__8210 = cljs.core.first(cljs.core.next(arglist__8219));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8219)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8219)));
    return update_in__delegate(m, p__8210, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8222 = this;
  var h__2220__auto____8223 = this__8222.__hash;
  if(!(h__2220__auto____8223 == null)) {
    return h__2220__auto____8223
  }else {
    var h__2220__auto____8224 = cljs.core.hash_coll.call(null, coll);
    this__8222.__hash = h__2220__auto____8224;
    return h__2220__auto____8224
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8225 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8226 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8227 = this;
  var new_array__8228 = this__8227.array.slice();
  new_array__8228[k] = v;
  return new cljs.core.Vector(this__8227.meta, new_array__8228, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8259 = null;
  var G__8259__2 = function(this_sym8229, k) {
    var this__8231 = this;
    var this_sym8229__8232 = this;
    var coll__8233 = this_sym8229__8232;
    return coll__8233.cljs$core$ILookup$_lookup$arity$2(coll__8233, k)
  };
  var G__8259__3 = function(this_sym8230, k, not_found) {
    var this__8231 = this;
    var this_sym8230__8234 = this;
    var coll__8235 = this_sym8230__8234;
    return coll__8235.cljs$core$ILookup$_lookup$arity$3(coll__8235, k, not_found)
  };
  G__8259 = function(this_sym8230, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8259__2.call(this, this_sym8230, k);
      case 3:
        return G__8259__3.call(this, this_sym8230, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8259
}();
cljs.core.Vector.prototype.apply = function(this_sym8220, args8221) {
  var this__8236 = this;
  return this_sym8220.call.apply(this_sym8220, [this_sym8220].concat(args8221.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8237 = this;
  var new_array__8238 = this__8237.array.slice();
  new_array__8238.push(o);
  return new cljs.core.Vector(this__8237.meta, new_array__8238, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8239 = this;
  var this__8240 = this;
  return cljs.core.pr_str.call(null, this__8240)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8241 = this;
  return cljs.core.ci_reduce.call(null, this__8241.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8242 = this;
  return cljs.core.ci_reduce.call(null, this__8242.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8243 = this;
  if(this__8243.array.length > 0) {
    var vector_seq__8244 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8243.array.length) {
          return cljs.core.cons.call(null, this__8243.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8244.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8245 = this;
  return this__8245.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8246 = this;
  var count__8247 = this__8246.array.length;
  if(count__8247 > 0) {
    return this__8246.array[count__8247 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8248 = this;
  if(this__8248.array.length > 0) {
    var new_array__8249 = this__8248.array.slice();
    new_array__8249.pop();
    return new cljs.core.Vector(this__8248.meta, new_array__8249, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8250 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8251 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8252 = this;
  return new cljs.core.Vector(meta, this__8252.array, this__8252.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8253 = this;
  return this__8253.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8254 = this;
  if(function() {
    var and__3822__auto____8255 = 0 <= n;
    if(and__3822__auto____8255) {
      return n < this__8254.array.length
    }else {
      return and__3822__auto____8255
    }
  }()) {
    return this__8254.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8256 = this;
  if(function() {
    var and__3822__auto____8257 = 0 <= n;
    if(and__3822__auto____8257) {
      return n < this__8256.array.length
    }else {
      return and__3822__auto____8257
    }
  }()) {
    return this__8256.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8258 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8258.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2338__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8261 = pv.cnt;
  if(cnt__8261 < 32) {
    return 0
  }else {
    return cnt__8261 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8267 = level;
  var ret__8268 = node;
  while(true) {
    if(ll__8267 === 0) {
      return ret__8268
    }else {
      var embed__8269 = ret__8268;
      var r__8270 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8271 = cljs.core.pv_aset.call(null, r__8270, 0, embed__8269);
      var G__8272 = ll__8267 - 5;
      var G__8273 = r__8270;
      ll__8267 = G__8272;
      ret__8268 = G__8273;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8279 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8280 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8279, subidx__8280, tailnode);
    return ret__8279
  }else {
    var child__8281 = cljs.core.pv_aget.call(null, parent, subidx__8280);
    if(!(child__8281 == null)) {
      var node_to_insert__8282 = push_tail.call(null, pv, level - 5, child__8281, tailnode);
      cljs.core.pv_aset.call(null, ret__8279, subidx__8280, node_to_insert__8282);
      return ret__8279
    }else {
      var node_to_insert__8283 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8279, subidx__8280, node_to_insert__8283);
      return ret__8279
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8287 = 0 <= i;
    if(and__3822__auto____8287) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8287
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8288 = pv.root;
      var level__8289 = pv.shift;
      while(true) {
        if(level__8289 > 0) {
          var G__8290 = cljs.core.pv_aget.call(null, node__8288, i >>> level__8289 & 31);
          var G__8291 = level__8289 - 5;
          node__8288 = G__8290;
          level__8289 = G__8291;
          continue
        }else {
          return node__8288.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8294 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8294, i & 31, val);
    return ret__8294
  }else {
    var subidx__8295 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8294, subidx__8295, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8295), i, val));
    return ret__8294
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8301 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8302 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8301));
    if(function() {
      var and__3822__auto____8303 = new_child__8302 == null;
      if(and__3822__auto____8303) {
        return subidx__8301 === 0
      }else {
        return and__3822__auto____8303
      }
    }()) {
      return null
    }else {
      var ret__8304 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8304, subidx__8301, new_child__8302);
      return ret__8304
    }
  }else {
    if(subidx__8301 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8305 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8305, subidx__8301, null);
        return ret__8305
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8308 = this;
  return new cljs.core.TransientVector(this__8308.cnt, this__8308.shift, cljs.core.tv_editable_root.call(null, this__8308.root), cljs.core.tv_editable_tail.call(null, this__8308.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8309 = this;
  var h__2220__auto____8310 = this__8309.__hash;
  if(!(h__2220__auto____8310 == null)) {
    return h__2220__auto____8310
  }else {
    var h__2220__auto____8311 = cljs.core.hash_coll.call(null, coll);
    this__8309.__hash = h__2220__auto____8311;
    return h__2220__auto____8311
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8312 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8313 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8314 = this;
  if(function() {
    var and__3822__auto____8315 = 0 <= k;
    if(and__3822__auto____8315) {
      return k < this__8314.cnt
    }else {
      return and__3822__auto____8315
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8316 = this__8314.tail.slice();
      new_tail__8316[k & 31] = v;
      return new cljs.core.PersistentVector(this__8314.meta, this__8314.cnt, this__8314.shift, this__8314.root, new_tail__8316, null)
    }else {
      return new cljs.core.PersistentVector(this__8314.meta, this__8314.cnt, this__8314.shift, cljs.core.do_assoc.call(null, coll, this__8314.shift, this__8314.root, k, v), this__8314.tail, null)
    }
  }else {
    if(k === this__8314.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8314.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8364 = null;
  var G__8364__2 = function(this_sym8317, k) {
    var this__8319 = this;
    var this_sym8317__8320 = this;
    var coll__8321 = this_sym8317__8320;
    return coll__8321.cljs$core$ILookup$_lookup$arity$2(coll__8321, k)
  };
  var G__8364__3 = function(this_sym8318, k, not_found) {
    var this__8319 = this;
    var this_sym8318__8322 = this;
    var coll__8323 = this_sym8318__8322;
    return coll__8323.cljs$core$ILookup$_lookup$arity$3(coll__8323, k, not_found)
  };
  G__8364 = function(this_sym8318, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8364__2.call(this, this_sym8318, k);
      case 3:
        return G__8364__3.call(this, this_sym8318, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8364
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8306, args8307) {
  var this__8324 = this;
  return this_sym8306.call.apply(this_sym8306, [this_sym8306].concat(args8307.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8325 = this;
  var step_init__8326 = [0, init];
  var i__8327 = 0;
  while(true) {
    if(i__8327 < this__8325.cnt) {
      var arr__8328 = cljs.core.array_for.call(null, v, i__8327);
      var len__8329 = arr__8328.length;
      var init__8333 = function() {
        var j__8330 = 0;
        var init__8331 = step_init__8326[1];
        while(true) {
          if(j__8330 < len__8329) {
            var init__8332 = f.call(null, init__8331, j__8330 + i__8327, arr__8328[j__8330]);
            if(cljs.core.reduced_QMARK_.call(null, init__8332)) {
              return init__8332
            }else {
              var G__8365 = j__8330 + 1;
              var G__8366 = init__8332;
              j__8330 = G__8365;
              init__8331 = G__8366;
              continue
            }
          }else {
            step_init__8326[0] = len__8329;
            step_init__8326[1] = init__8331;
            return init__8331
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8333)) {
        return cljs.core.deref.call(null, init__8333)
      }else {
        var G__8367 = i__8327 + step_init__8326[0];
        i__8327 = G__8367;
        continue
      }
    }else {
      return step_init__8326[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8334 = this;
  if(this__8334.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8335 = this__8334.tail.slice();
    new_tail__8335.push(o);
    return new cljs.core.PersistentVector(this__8334.meta, this__8334.cnt + 1, this__8334.shift, this__8334.root, new_tail__8335, null)
  }else {
    var root_overflow_QMARK___8336 = this__8334.cnt >>> 5 > 1 << this__8334.shift;
    var new_shift__8337 = root_overflow_QMARK___8336 ? this__8334.shift + 5 : this__8334.shift;
    var new_root__8339 = root_overflow_QMARK___8336 ? function() {
      var n_r__8338 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8338, 0, this__8334.root);
      cljs.core.pv_aset.call(null, n_r__8338, 1, cljs.core.new_path.call(null, null, this__8334.shift, new cljs.core.VectorNode(null, this__8334.tail)));
      return n_r__8338
    }() : cljs.core.push_tail.call(null, coll, this__8334.shift, this__8334.root, new cljs.core.VectorNode(null, this__8334.tail));
    return new cljs.core.PersistentVector(this__8334.meta, this__8334.cnt + 1, new_shift__8337, new_root__8339, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8340 = this;
  if(this__8340.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8340.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8341 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8342 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8343 = this;
  var this__8344 = this;
  return cljs.core.pr_str.call(null, this__8344)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8345 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8346 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8347 = this;
  if(this__8347.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8348 = this;
  return this__8348.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8349 = this;
  if(this__8349.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8349.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8350 = this;
  if(this__8350.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8350.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8350.meta)
    }else {
      if(1 < this__8350.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8350.meta, this__8350.cnt - 1, this__8350.shift, this__8350.root, this__8350.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8351 = cljs.core.array_for.call(null, coll, this__8350.cnt - 2);
          var nr__8352 = cljs.core.pop_tail.call(null, coll, this__8350.shift, this__8350.root);
          var new_root__8353 = nr__8352 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8352;
          var cnt_1__8354 = this__8350.cnt - 1;
          if(function() {
            var and__3822__auto____8355 = 5 < this__8350.shift;
            if(and__3822__auto____8355) {
              return cljs.core.pv_aget.call(null, new_root__8353, 1) == null
            }else {
              return and__3822__auto____8355
            }
          }()) {
            return new cljs.core.PersistentVector(this__8350.meta, cnt_1__8354, this__8350.shift - 5, cljs.core.pv_aget.call(null, new_root__8353, 0), new_tail__8351, null)
          }else {
            return new cljs.core.PersistentVector(this__8350.meta, cnt_1__8354, this__8350.shift, new_root__8353, new_tail__8351, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8356 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8357 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8358 = this;
  return new cljs.core.PersistentVector(meta, this__8358.cnt, this__8358.shift, this__8358.root, this__8358.tail, this__8358.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8359 = this;
  return this__8359.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8360 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8361 = this;
  if(function() {
    var and__3822__auto____8362 = 0 <= n;
    if(and__3822__auto____8362) {
      return n < this__8361.cnt
    }else {
      return and__3822__auto____8362
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8363 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8363.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8368 = xs.length;
  var xs__8369 = no_clone === true ? xs : xs.slice();
  if(l__8368 < 32) {
    return new cljs.core.PersistentVector(null, l__8368, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8369, null)
  }else {
    var node__8370 = xs__8369.slice(0, 32);
    var v__8371 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8370, null);
    var i__8372 = 32;
    var out__8373 = cljs.core._as_transient.call(null, v__8371);
    while(true) {
      if(i__8372 < l__8368) {
        var G__8374 = i__8372 + 1;
        var G__8375 = cljs.core.conj_BANG_.call(null, out__8373, xs__8369[i__8372]);
        i__8372 = G__8374;
        out__8373 = G__8375;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8373)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8376) {
    var args = cljs.core.seq(arglist__8376);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8377 = this;
  if(this__8377.off + 1 < this__8377.node.length) {
    var s__8378 = cljs.core.chunked_seq.call(null, this__8377.vec, this__8377.node, this__8377.i, this__8377.off + 1);
    if(s__8378 == null) {
      return null
    }else {
      return s__8378
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8379 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8380 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8381 = this;
  return this__8381.node[this__8381.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8382 = this;
  if(this__8382.off + 1 < this__8382.node.length) {
    var s__8383 = cljs.core.chunked_seq.call(null, this__8382.vec, this__8382.node, this__8382.i, this__8382.off + 1);
    if(s__8383 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8383
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8384 = this;
  var l__8385 = this__8384.node.length;
  var s__8386 = this__8384.i + l__8385 < cljs.core._count.call(null, this__8384.vec) ? cljs.core.chunked_seq.call(null, this__8384.vec, this__8384.i + l__8385, 0) : null;
  if(s__8386 == null) {
    return null
  }else {
    return s__8386
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8387 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8388 = this;
  return cljs.core.chunked_seq.call(null, this__8388.vec, this__8388.node, this__8388.i, this__8388.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8389 = this;
  return this__8389.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8390 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8390.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8391 = this;
  return cljs.core.array_chunk.call(null, this__8391.node, this__8391.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8392 = this;
  var l__8393 = this__8392.node.length;
  var s__8394 = this__8392.i + l__8393 < cljs.core._count.call(null, this__8392.vec) ? cljs.core.chunked_seq.call(null, this__8392.vec, this__8392.i + l__8393, 0) : null;
  if(s__8394 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8394
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8397 = this;
  var h__2220__auto____8398 = this__8397.__hash;
  if(!(h__2220__auto____8398 == null)) {
    return h__2220__auto____8398
  }else {
    var h__2220__auto____8399 = cljs.core.hash_coll.call(null, coll);
    this__8397.__hash = h__2220__auto____8399;
    return h__2220__auto____8399
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8400 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8401 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8402 = this;
  var v_pos__8403 = this__8402.start + key;
  return new cljs.core.Subvec(this__8402.meta, cljs.core._assoc.call(null, this__8402.v, v_pos__8403, val), this__8402.start, this__8402.end > v_pos__8403 + 1 ? this__8402.end : v_pos__8403 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8429 = null;
  var G__8429__2 = function(this_sym8404, k) {
    var this__8406 = this;
    var this_sym8404__8407 = this;
    var coll__8408 = this_sym8404__8407;
    return coll__8408.cljs$core$ILookup$_lookup$arity$2(coll__8408, k)
  };
  var G__8429__3 = function(this_sym8405, k, not_found) {
    var this__8406 = this;
    var this_sym8405__8409 = this;
    var coll__8410 = this_sym8405__8409;
    return coll__8410.cljs$core$ILookup$_lookup$arity$3(coll__8410, k, not_found)
  };
  G__8429 = function(this_sym8405, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8429__2.call(this, this_sym8405, k);
      case 3:
        return G__8429__3.call(this, this_sym8405, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8429
}();
cljs.core.Subvec.prototype.apply = function(this_sym8395, args8396) {
  var this__8411 = this;
  return this_sym8395.call.apply(this_sym8395, [this_sym8395].concat(args8396.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8412 = this;
  return new cljs.core.Subvec(this__8412.meta, cljs.core._assoc_n.call(null, this__8412.v, this__8412.end, o), this__8412.start, this__8412.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8413 = this;
  var this__8414 = this;
  return cljs.core.pr_str.call(null, this__8414)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8415 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8416 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8417 = this;
  var subvec_seq__8418 = function subvec_seq(i) {
    if(i === this__8417.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8417.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8418.call(null, this__8417.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8419 = this;
  return this__8419.end - this__8419.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8420 = this;
  return cljs.core._nth.call(null, this__8420.v, this__8420.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8421 = this;
  if(this__8421.start === this__8421.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8421.meta, this__8421.v, this__8421.start, this__8421.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8422 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8423 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8424 = this;
  return new cljs.core.Subvec(meta, this__8424.v, this__8424.start, this__8424.end, this__8424.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8425 = this;
  return this__8425.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8426 = this;
  return cljs.core._nth.call(null, this__8426.v, this__8426.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8427 = this;
  return cljs.core._nth.call(null, this__8427.v, this__8427.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8428 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8428.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8431 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8431, 0, tl.length);
  return ret__8431
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8435 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8436 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8435, subidx__8436, level === 5 ? tail_node : function() {
    var child__8437 = cljs.core.pv_aget.call(null, ret__8435, subidx__8436);
    if(!(child__8437 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8437, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8435
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8442 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8443 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8444 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8442, subidx__8443));
    if(function() {
      var and__3822__auto____8445 = new_child__8444 == null;
      if(and__3822__auto____8445) {
        return subidx__8443 === 0
      }else {
        return and__3822__auto____8445
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8442, subidx__8443, new_child__8444);
      return node__8442
    }
  }else {
    if(subidx__8443 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8442, subidx__8443, null);
        return node__8442
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8450 = 0 <= i;
    if(and__3822__auto____8450) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8450
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8451 = tv.root;
      var node__8452 = root__8451;
      var level__8453 = tv.shift;
      while(true) {
        if(level__8453 > 0) {
          var G__8454 = cljs.core.tv_ensure_editable.call(null, root__8451.edit, cljs.core.pv_aget.call(null, node__8452, i >>> level__8453 & 31));
          var G__8455 = level__8453 - 5;
          node__8452 = G__8454;
          level__8453 = G__8455;
          continue
        }else {
          return node__8452.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8495 = null;
  var G__8495__2 = function(this_sym8458, k) {
    var this__8460 = this;
    var this_sym8458__8461 = this;
    var coll__8462 = this_sym8458__8461;
    return coll__8462.cljs$core$ILookup$_lookup$arity$2(coll__8462, k)
  };
  var G__8495__3 = function(this_sym8459, k, not_found) {
    var this__8460 = this;
    var this_sym8459__8463 = this;
    var coll__8464 = this_sym8459__8463;
    return coll__8464.cljs$core$ILookup$_lookup$arity$3(coll__8464, k, not_found)
  };
  G__8495 = function(this_sym8459, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8495__2.call(this, this_sym8459, k);
      case 3:
        return G__8495__3.call(this, this_sym8459, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8495
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8456, args8457) {
  var this__8465 = this;
  return this_sym8456.call.apply(this_sym8456, [this_sym8456].concat(args8457.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8466 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8467 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8468 = this;
  if(this__8468.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8469 = this;
  if(function() {
    var and__3822__auto____8470 = 0 <= n;
    if(and__3822__auto____8470) {
      return n < this__8469.cnt
    }else {
      return and__3822__auto____8470
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8471 = this;
  if(this__8471.root.edit) {
    return this__8471.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8472 = this;
  if(this__8472.root.edit) {
    if(function() {
      var and__3822__auto____8473 = 0 <= n;
      if(and__3822__auto____8473) {
        return n < this__8472.cnt
      }else {
        return and__3822__auto____8473
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8472.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8478 = function go(level, node) {
          var node__8476 = cljs.core.tv_ensure_editable.call(null, this__8472.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8476, n & 31, val);
            return node__8476
          }else {
            var subidx__8477 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8476, subidx__8477, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8476, subidx__8477)));
            return node__8476
          }
        }.call(null, this__8472.shift, this__8472.root);
        this__8472.root = new_root__8478;
        return tcoll
      }
    }else {
      if(n === this__8472.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8472.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8479 = this;
  if(this__8479.root.edit) {
    if(this__8479.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8479.cnt) {
        this__8479.cnt = 0;
        return tcoll
      }else {
        if((this__8479.cnt - 1 & 31) > 0) {
          this__8479.cnt = this__8479.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8480 = cljs.core.editable_array_for.call(null, tcoll, this__8479.cnt - 2);
            var new_root__8482 = function() {
              var nr__8481 = cljs.core.tv_pop_tail.call(null, tcoll, this__8479.shift, this__8479.root);
              if(!(nr__8481 == null)) {
                return nr__8481
              }else {
                return new cljs.core.VectorNode(this__8479.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8483 = 5 < this__8479.shift;
              if(and__3822__auto____8483) {
                return cljs.core.pv_aget.call(null, new_root__8482, 1) == null
              }else {
                return and__3822__auto____8483
              }
            }()) {
              var new_root__8484 = cljs.core.tv_ensure_editable.call(null, this__8479.root.edit, cljs.core.pv_aget.call(null, new_root__8482, 0));
              this__8479.root = new_root__8484;
              this__8479.shift = this__8479.shift - 5;
              this__8479.cnt = this__8479.cnt - 1;
              this__8479.tail = new_tail__8480;
              return tcoll
            }else {
              this__8479.root = new_root__8482;
              this__8479.cnt = this__8479.cnt - 1;
              this__8479.tail = new_tail__8480;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8485 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8486 = this;
  if(this__8486.root.edit) {
    if(this__8486.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8486.tail[this__8486.cnt & 31] = o;
      this__8486.cnt = this__8486.cnt + 1;
      return tcoll
    }else {
      var tail_node__8487 = new cljs.core.VectorNode(this__8486.root.edit, this__8486.tail);
      var new_tail__8488 = cljs.core.make_array.call(null, 32);
      new_tail__8488[0] = o;
      this__8486.tail = new_tail__8488;
      if(this__8486.cnt >>> 5 > 1 << this__8486.shift) {
        var new_root_array__8489 = cljs.core.make_array.call(null, 32);
        var new_shift__8490 = this__8486.shift + 5;
        new_root_array__8489[0] = this__8486.root;
        new_root_array__8489[1] = cljs.core.new_path.call(null, this__8486.root.edit, this__8486.shift, tail_node__8487);
        this__8486.root = new cljs.core.VectorNode(this__8486.root.edit, new_root_array__8489);
        this__8486.shift = new_shift__8490;
        this__8486.cnt = this__8486.cnt + 1;
        return tcoll
      }else {
        var new_root__8491 = cljs.core.tv_push_tail.call(null, tcoll, this__8486.shift, this__8486.root, tail_node__8487);
        this__8486.root = new_root__8491;
        this__8486.cnt = this__8486.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8492 = this;
  if(this__8492.root.edit) {
    this__8492.root.edit = null;
    var len__8493 = this__8492.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8494 = cljs.core.make_array.call(null, len__8493);
    cljs.core.array_copy.call(null, this__8492.tail, 0, trimmed_tail__8494, 0, len__8493);
    return new cljs.core.PersistentVector(null, this__8492.cnt, this__8492.shift, this__8492.root, trimmed_tail__8494, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8496 = this;
  var h__2220__auto____8497 = this__8496.__hash;
  if(!(h__2220__auto____8497 == null)) {
    return h__2220__auto____8497
  }else {
    var h__2220__auto____8498 = cljs.core.hash_coll.call(null, coll);
    this__8496.__hash = h__2220__auto____8498;
    return h__2220__auto____8498
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8499 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8500 = this;
  var this__8501 = this;
  return cljs.core.pr_str.call(null, this__8501)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8502 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8503 = this;
  return cljs.core._first.call(null, this__8503.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8504 = this;
  var temp__3971__auto____8505 = cljs.core.next.call(null, this__8504.front);
  if(temp__3971__auto____8505) {
    var f1__8506 = temp__3971__auto____8505;
    return new cljs.core.PersistentQueueSeq(this__8504.meta, f1__8506, this__8504.rear, null)
  }else {
    if(this__8504.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8504.meta, this__8504.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8507 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8508 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8508.front, this__8508.rear, this__8508.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8509 = this;
  return this__8509.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8510 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8510.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8511 = this;
  var h__2220__auto____8512 = this__8511.__hash;
  if(!(h__2220__auto____8512 == null)) {
    return h__2220__auto____8512
  }else {
    var h__2220__auto____8513 = cljs.core.hash_coll.call(null, coll);
    this__8511.__hash = h__2220__auto____8513;
    return h__2220__auto____8513
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8514 = this;
  if(cljs.core.truth_(this__8514.front)) {
    return new cljs.core.PersistentQueue(this__8514.meta, this__8514.count + 1, this__8514.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8515 = this__8514.rear;
      if(cljs.core.truth_(or__3824__auto____8515)) {
        return or__3824__auto____8515
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8514.meta, this__8514.count + 1, cljs.core.conj.call(null, this__8514.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8516 = this;
  var this__8517 = this;
  return cljs.core.pr_str.call(null, this__8517)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8518 = this;
  var rear__8519 = cljs.core.seq.call(null, this__8518.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8520 = this__8518.front;
    if(cljs.core.truth_(or__3824__auto____8520)) {
      return or__3824__auto____8520
    }else {
      return rear__8519
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8518.front, cljs.core.seq.call(null, rear__8519), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8521 = this;
  return this__8521.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8522 = this;
  return cljs.core._first.call(null, this__8522.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8523 = this;
  if(cljs.core.truth_(this__8523.front)) {
    var temp__3971__auto____8524 = cljs.core.next.call(null, this__8523.front);
    if(temp__3971__auto____8524) {
      var f1__8525 = temp__3971__auto____8524;
      return new cljs.core.PersistentQueue(this__8523.meta, this__8523.count - 1, f1__8525, this__8523.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8523.meta, this__8523.count - 1, cljs.core.seq.call(null, this__8523.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8526 = this;
  return cljs.core.first.call(null, this__8526.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8527 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8528 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8529 = this;
  return new cljs.core.PersistentQueue(meta, this__8529.count, this__8529.front, this__8529.rear, this__8529.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8530 = this;
  return this__8530.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8531 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8532 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8535 = array.length;
  var i__8536 = 0;
  while(true) {
    if(i__8536 < len__8535) {
      if(k === array[i__8536]) {
        return i__8536
      }else {
        var G__8537 = i__8536 + incr;
        i__8536 = G__8537;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8540 = cljs.core.hash.call(null, a);
  var b__8541 = cljs.core.hash.call(null, b);
  if(a__8540 < b__8541) {
    return-1
  }else {
    if(a__8540 > b__8541) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8549 = m.keys;
  var len__8550 = ks__8549.length;
  var so__8551 = m.strobj;
  var out__8552 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8553 = 0;
  var out__8554 = cljs.core.transient$.call(null, out__8552);
  while(true) {
    if(i__8553 < len__8550) {
      var k__8555 = ks__8549[i__8553];
      var G__8556 = i__8553 + 1;
      var G__8557 = cljs.core.assoc_BANG_.call(null, out__8554, k__8555, so__8551[k__8555]);
      i__8553 = G__8556;
      out__8554 = G__8557;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8554, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8563 = {};
  var l__8564 = ks.length;
  var i__8565 = 0;
  while(true) {
    if(i__8565 < l__8564) {
      var k__8566 = ks[i__8565];
      new_obj__8563[k__8566] = obj[k__8566];
      var G__8567 = i__8565 + 1;
      i__8565 = G__8567;
      continue
    }else {
    }
    break
  }
  return new_obj__8563
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8570 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8571 = this;
  var h__2220__auto____8572 = this__8571.__hash;
  if(!(h__2220__auto____8572 == null)) {
    return h__2220__auto____8572
  }else {
    var h__2220__auto____8573 = cljs.core.hash_imap.call(null, coll);
    this__8571.__hash = h__2220__auto____8573;
    return h__2220__auto____8573
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8574 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8575 = this;
  if(function() {
    var and__3822__auto____8576 = goog.isString(k);
    if(and__3822__auto____8576) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8575.keys) == null)
    }else {
      return and__3822__auto____8576
    }
  }()) {
    return this__8575.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8577 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8578 = this__8577.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8578) {
        return or__3824__auto____8578
      }else {
        return this__8577.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8577.keys) == null)) {
        var new_strobj__8579 = cljs.core.obj_clone.call(null, this__8577.strobj, this__8577.keys);
        new_strobj__8579[k] = v;
        return new cljs.core.ObjMap(this__8577.meta, this__8577.keys, new_strobj__8579, this__8577.update_count + 1, null)
      }else {
        var new_strobj__8580 = cljs.core.obj_clone.call(null, this__8577.strobj, this__8577.keys);
        var new_keys__8581 = this__8577.keys.slice();
        new_strobj__8580[k] = v;
        new_keys__8581.push(k);
        return new cljs.core.ObjMap(this__8577.meta, new_keys__8581, new_strobj__8580, this__8577.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8582 = this;
  if(function() {
    var and__3822__auto____8583 = goog.isString(k);
    if(and__3822__auto____8583) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8582.keys) == null)
    }else {
      return and__3822__auto____8583
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8605 = null;
  var G__8605__2 = function(this_sym8584, k) {
    var this__8586 = this;
    var this_sym8584__8587 = this;
    var coll__8588 = this_sym8584__8587;
    return coll__8588.cljs$core$ILookup$_lookup$arity$2(coll__8588, k)
  };
  var G__8605__3 = function(this_sym8585, k, not_found) {
    var this__8586 = this;
    var this_sym8585__8589 = this;
    var coll__8590 = this_sym8585__8589;
    return coll__8590.cljs$core$ILookup$_lookup$arity$3(coll__8590, k, not_found)
  };
  G__8605 = function(this_sym8585, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8605__2.call(this, this_sym8585, k);
      case 3:
        return G__8605__3.call(this, this_sym8585, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8605
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8568, args8569) {
  var this__8591 = this;
  return this_sym8568.call.apply(this_sym8568, [this_sym8568].concat(args8569.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8592 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8593 = this;
  var this__8594 = this;
  return cljs.core.pr_str.call(null, this__8594)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8595 = this;
  if(this__8595.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8558_SHARP_) {
      return cljs.core.vector.call(null, p1__8558_SHARP_, this__8595.strobj[p1__8558_SHARP_])
    }, this__8595.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8596 = this;
  return this__8596.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8597 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8598 = this;
  return new cljs.core.ObjMap(meta, this__8598.keys, this__8598.strobj, this__8598.update_count, this__8598.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8599 = this;
  return this__8599.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8600 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8600.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8601 = this;
  if(function() {
    var and__3822__auto____8602 = goog.isString(k);
    if(and__3822__auto____8602) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8601.keys) == null)
    }else {
      return and__3822__auto____8602
    }
  }()) {
    var new_keys__8603 = this__8601.keys.slice();
    var new_strobj__8604 = cljs.core.obj_clone.call(null, this__8601.strobj, this__8601.keys);
    new_keys__8603.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8603), 1);
    cljs.core.js_delete.call(null, new_strobj__8604, k);
    return new cljs.core.ObjMap(this__8601.meta, new_keys__8603, new_strobj__8604, this__8601.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8609 = this;
  var h__2220__auto____8610 = this__8609.__hash;
  if(!(h__2220__auto____8610 == null)) {
    return h__2220__auto____8610
  }else {
    var h__2220__auto____8611 = cljs.core.hash_imap.call(null, coll);
    this__8609.__hash = h__2220__auto____8611;
    return h__2220__auto____8611
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8612 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8613 = this;
  var bucket__8614 = this__8613.hashobj[cljs.core.hash.call(null, k)];
  var i__8615 = cljs.core.truth_(bucket__8614) ? cljs.core.scan_array.call(null, 2, k, bucket__8614) : null;
  if(cljs.core.truth_(i__8615)) {
    return bucket__8614[i__8615 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8616 = this;
  var h__8617 = cljs.core.hash.call(null, k);
  var bucket__8618 = this__8616.hashobj[h__8617];
  if(cljs.core.truth_(bucket__8618)) {
    var new_bucket__8619 = bucket__8618.slice();
    var new_hashobj__8620 = goog.object.clone(this__8616.hashobj);
    new_hashobj__8620[h__8617] = new_bucket__8619;
    var temp__3971__auto____8621 = cljs.core.scan_array.call(null, 2, k, new_bucket__8619);
    if(cljs.core.truth_(temp__3971__auto____8621)) {
      var i__8622 = temp__3971__auto____8621;
      new_bucket__8619[i__8622 + 1] = v;
      return new cljs.core.HashMap(this__8616.meta, this__8616.count, new_hashobj__8620, null)
    }else {
      new_bucket__8619.push(k, v);
      return new cljs.core.HashMap(this__8616.meta, this__8616.count + 1, new_hashobj__8620, null)
    }
  }else {
    var new_hashobj__8623 = goog.object.clone(this__8616.hashobj);
    new_hashobj__8623[h__8617] = [k, v];
    return new cljs.core.HashMap(this__8616.meta, this__8616.count + 1, new_hashobj__8623, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8624 = this;
  var bucket__8625 = this__8624.hashobj[cljs.core.hash.call(null, k)];
  var i__8626 = cljs.core.truth_(bucket__8625) ? cljs.core.scan_array.call(null, 2, k, bucket__8625) : null;
  if(cljs.core.truth_(i__8626)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8651 = null;
  var G__8651__2 = function(this_sym8627, k) {
    var this__8629 = this;
    var this_sym8627__8630 = this;
    var coll__8631 = this_sym8627__8630;
    return coll__8631.cljs$core$ILookup$_lookup$arity$2(coll__8631, k)
  };
  var G__8651__3 = function(this_sym8628, k, not_found) {
    var this__8629 = this;
    var this_sym8628__8632 = this;
    var coll__8633 = this_sym8628__8632;
    return coll__8633.cljs$core$ILookup$_lookup$arity$3(coll__8633, k, not_found)
  };
  G__8651 = function(this_sym8628, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8651__2.call(this, this_sym8628, k);
      case 3:
        return G__8651__3.call(this, this_sym8628, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8651
}();
cljs.core.HashMap.prototype.apply = function(this_sym8607, args8608) {
  var this__8634 = this;
  return this_sym8607.call.apply(this_sym8607, [this_sym8607].concat(args8608.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8635 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8636 = this;
  var this__8637 = this;
  return cljs.core.pr_str.call(null, this__8637)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8638 = this;
  if(this__8638.count > 0) {
    var hashes__8639 = cljs.core.js_keys.call(null, this__8638.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8606_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8638.hashobj[p1__8606_SHARP_]))
    }, hashes__8639)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8640 = this;
  return this__8640.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8641 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8642 = this;
  return new cljs.core.HashMap(meta, this__8642.count, this__8642.hashobj, this__8642.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8643 = this;
  return this__8643.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8644 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8644.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8645 = this;
  var h__8646 = cljs.core.hash.call(null, k);
  var bucket__8647 = this__8645.hashobj[h__8646];
  var i__8648 = cljs.core.truth_(bucket__8647) ? cljs.core.scan_array.call(null, 2, k, bucket__8647) : null;
  if(cljs.core.not.call(null, i__8648)) {
    return coll
  }else {
    var new_hashobj__8649 = goog.object.clone(this__8645.hashobj);
    if(3 > bucket__8647.length) {
      cljs.core.js_delete.call(null, new_hashobj__8649, h__8646)
    }else {
      var new_bucket__8650 = bucket__8647.slice();
      new_bucket__8650.splice(i__8648, 2);
      new_hashobj__8649[h__8646] = new_bucket__8650
    }
    return new cljs.core.HashMap(this__8645.meta, this__8645.count - 1, new_hashobj__8649, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8652 = ks.length;
  var i__8653 = 0;
  var out__8654 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8653 < len__8652) {
      var G__8655 = i__8653 + 1;
      var G__8656 = cljs.core.assoc.call(null, out__8654, ks[i__8653], vs[i__8653]);
      i__8653 = G__8655;
      out__8654 = G__8656;
      continue
    }else {
      return out__8654
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8660 = m.arr;
  var len__8661 = arr__8660.length;
  var i__8662 = 0;
  while(true) {
    if(len__8661 <= i__8662) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8660[i__8662], k)) {
        return i__8662
      }else {
        if("\ufdd0'else") {
          var G__8663 = i__8662 + 2;
          i__8662 = G__8663;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8666 = this;
  return new cljs.core.TransientArrayMap({}, this__8666.arr.length, this__8666.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8667 = this;
  var h__2220__auto____8668 = this__8667.__hash;
  if(!(h__2220__auto____8668 == null)) {
    return h__2220__auto____8668
  }else {
    var h__2220__auto____8669 = cljs.core.hash_imap.call(null, coll);
    this__8667.__hash = h__2220__auto____8669;
    return h__2220__auto____8669
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8670 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8671 = this;
  var idx__8672 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8672 === -1) {
    return not_found
  }else {
    return this__8671.arr[idx__8672 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8673 = this;
  var idx__8674 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8674 === -1) {
    if(this__8673.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8673.meta, this__8673.cnt + 1, function() {
        var G__8675__8676 = this__8673.arr.slice();
        G__8675__8676.push(k);
        G__8675__8676.push(v);
        return G__8675__8676
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8673.arr[idx__8674 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8673.meta, this__8673.cnt, function() {
          var G__8677__8678 = this__8673.arr.slice();
          G__8677__8678[idx__8674 + 1] = v;
          return G__8677__8678
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8679 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8711 = null;
  var G__8711__2 = function(this_sym8680, k) {
    var this__8682 = this;
    var this_sym8680__8683 = this;
    var coll__8684 = this_sym8680__8683;
    return coll__8684.cljs$core$ILookup$_lookup$arity$2(coll__8684, k)
  };
  var G__8711__3 = function(this_sym8681, k, not_found) {
    var this__8682 = this;
    var this_sym8681__8685 = this;
    var coll__8686 = this_sym8681__8685;
    return coll__8686.cljs$core$ILookup$_lookup$arity$3(coll__8686, k, not_found)
  };
  G__8711 = function(this_sym8681, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8711__2.call(this, this_sym8681, k);
      case 3:
        return G__8711__3.call(this, this_sym8681, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8711
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8664, args8665) {
  var this__8687 = this;
  return this_sym8664.call.apply(this_sym8664, [this_sym8664].concat(args8665.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8688 = this;
  var len__8689 = this__8688.arr.length;
  var i__8690 = 0;
  var init__8691 = init;
  while(true) {
    if(i__8690 < len__8689) {
      var init__8692 = f.call(null, init__8691, this__8688.arr[i__8690], this__8688.arr[i__8690 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8692)) {
        return cljs.core.deref.call(null, init__8692)
      }else {
        var G__8712 = i__8690 + 2;
        var G__8713 = init__8692;
        i__8690 = G__8712;
        init__8691 = G__8713;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8693 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8694 = this;
  var this__8695 = this;
  return cljs.core.pr_str.call(null, this__8695)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8696 = this;
  if(this__8696.cnt > 0) {
    var len__8697 = this__8696.arr.length;
    var array_map_seq__8698 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8697) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8696.arr[i], this__8696.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8698.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8699 = this;
  return this__8699.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8700 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8701 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8701.cnt, this__8701.arr, this__8701.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8702 = this;
  return this__8702.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8703 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8703.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8704 = this;
  var idx__8705 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8705 >= 0) {
    var len__8706 = this__8704.arr.length;
    var new_len__8707 = len__8706 - 2;
    if(new_len__8707 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8708 = cljs.core.make_array.call(null, new_len__8707);
      var s__8709 = 0;
      var d__8710 = 0;
      while(true) {
        if(s__8709 >= len__8706) {
          return new cljs.core.PersistentArrayMap(this__8704.meta, this__8704.cnt - 1, new_arr__8708, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8704.arr[s__8709])) {
            var G__8714 = s__8709 + 2;
            var G__8715 = d__8710;
            s__8709 = G__8714;
            d__8710 = G__8715;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8708[d__8710] = this__8704.arr[s__8709];
              new_arr__8708[d__8710 + 1] = this__8704.arr[s__8709 + 1];
              var G__8716 = s__8709 + 2;
              var G__8717 = d__8710 + 2;
              s__8709 = G__8716;
              d__8710 = G__8717;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8718 = cljs.core.count.call(null, ks);
  var i__8719 = 0;
  var out__8720 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8719 < len__8718) {
      var G__8721 = i__8719 + 1;
      var G__8722 = cljs.core.assoc_BANG_.call(null, out__8720, ks[i__8719], vs[i__8719]);
      i__8719 = G__8721;
      out__8720 = G__8722;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8720)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8723 = this;
  if(cljs.core.truth_(this__8723.editable_QMARK_)) {
    var idx__8724 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8724 >= 0) {
      this__8723.arr[idx__8724] = this__8723.arr[this__8723.len - 2];
      this__8723.arr[idx__8724 + 1] = this__8723.arr[this__8723.len - 1];
      var G__8725__8726 = this__8723.arr;
      G__8725__8726.pop();
      G__8725__8726.pop();
      G__8725__8726;
      this__8723.len = this__8723.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8727 = this;
  if(cljs.core.truth_(this__8727.editable_QMARK_)) {
    var idx__8728 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8728 === -1) {
      if(this__8727.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8727.len = this__8727.len + 2;
        this__8727.arr.push(key);
        this__8727.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8727.len, this__8727.arr), key, val)
      }
    }else {
      if(val === this__8727.arr[idx__8728 + 1]) {
        return tcoll
      }else {
        this__8727.arr[idx__8728 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8729 = this;
  if(cljs.core.truth_(this__8729.editable_QMARK_)) {
    if(function() {
      var G__8730__8731 = o;
      if(G__8730__8731) {
        if(function() {
          var or__3824__auto____8732 = G__8730__8731.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8732) {
            return or__3824__auto____8732
          }else {
            return G__8730__8731.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8730__8731.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8730__8731)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8730__8731)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8733 = cljs.core.seq.call(null, o);
      var tcoll__8734 = tcoll;
      while(true) {
        var temp__3971__auto____8735 = cljs.core.first.call(null, es__8733);
        if(cljs.core.truth_(temp__3971__auto____8735)) {
          var e__8736 = temp__3971__auto____8735;
          var G__8742 = cljs.core.next.call(null, es__8733);
          var G__8743 = tcoll__8734.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8734, cljs.core.key.call(null, e__8736), cljs.core.val.call(null, e__8736));
          es__8733 = G__8742;
          tcoll__8734 = G__8743;
          continue
        }else {
          return tcoll__8734
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8737 = this;
  if(cljs.core.truth_(this__8737.editable_QMARK_)) {
    this__8737.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8737.len, 2), this__8737.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8738 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8739 = this;
  if(cljs.core.truth_(this__8739.editable_QMARK_)) {
    var idx__8740 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8740 === -1) {
      return not_found
    }else {
      return this__8739.arr[idx__8740 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8741 = this;
  if(cljs.core.truth_(this__8741.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8741.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8746 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8747 = 0;
  while(true) {
    if(i__8747 < len) {
      var G__8748 = cljs.core.assoc_BANG_.call(null, out__8746, arr[i__8747], arr[i__8747 + 1]);
      var G__8749 = i__8747 + 2;
      out__8746 = G__8748;
      i__8747 = G__8749;
      continue
    }else {
      return out__8746
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2338__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8754__8755 = arr.slice();
    G__8754__8755[i] = a;
    return G__8754__8755
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8756__8757 = arr.slice();
    G__8756__8757[i] = a;
    G__8756__8757[j] = b;
    return G__8756__8757
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8759 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8759, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8759, 2 * i, new_arr__8759.length - 2 * i);
  return new_arr__8759
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8762 = inode.ensure_editable(edit);
    editable__8762.arr[i] = a;
    return editable__8762
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8763 = inode.ensure_editable(edit);
    editable__8763.arr[i] = a;
    editable__8763.arr[j] = b;
    return editable__8763
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8770 = arr.length;
  var i__8771 = 0;
  var init__8772 = init;
  while(true) {
    if(i__8771 < len__8770) {
      var init__8775 = function() {
        var k__8773 = arr[i__8771];
        if(!(k__8773 == null)) {
          return f.call(null, init__8772, k__8773, arr[i__8771 + 1])
        }else {
          var node__8774 = arr[i__8771 + 1];
          if(!(node__8774 == null)) {
            return node__8774.kv_reduce(f, init__8772)
          }else {
            return init__8772
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8775)) {
        return cljs.core.deref.call(null, init__8775)
      }else {
        var G__8776 = i__8771 + 2;
        var G__8777 = init__8775;
        i__8771 = G__8776;
        init__8772 = G__8777;
        continue
      }
    }else {
      return init__8772
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8778 = this;
  var inode__8779 = this;
  if(this__8778.bitmap === bit) {
    return null
  }else {
    var editable__8780 = inode__8779.ensure_editable(e);
    var earr__8781 = editable__8780.arr;
    var len__8782 = earr__8781.length;
    editable__8780.bitmap = bit ^ editable__8780.bitmap;
    cljs.core.array_copy.call(null, earr__8781, 2 * (i + 1), earr__8781, 2 * i, len__8782 - 2 * (i + 1));
    earr__8781[len__8782 - 2] = null;
    earr__8781[len__8782 - 1] = null;
    return editable__8780
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8783 = this;
  var inode__8784 = this;
  var bit__8785 = 1 << (hash >>> shift & 31);
  var idx__8786 = cljs.core.bitmap_indexed_node_index.call(null, this__8783.bitmap, bit__8785);
  if((this__8783.bitmap & bit__8785) === 0) {
    var n__8787 = cljs.core.bit_count.call(null, this__8783.bitmap);
    if(2 * n__8787 < this__8783.arr.length) {
      var editable__8788 = inode__8784.ensure_editable(edit);
      var earr__8789 = editable__8788.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8789, 2 * idx__8786, earr__8789, 2 * (idx__8786 + 1), 2 * (n__8787 - idx__8786));
      earr__8789[2 * idx__8786] = key;
      earr__8789[2 * idx__8786 + 1] = val;
      editable__8788.bitmap = editable__8788.bitmap | bit__8785;
      return editable__8788
    }else {
      if(n__8787 >= 16) {
        var nodes__8790 = cljs.core.make_array.call(null, 32);
        var jdx__8791 = hash >>> shift & 31;
        nodes__8790[jdx__8791] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8792 = 0;
        var j__8793 = 0;
        while(true) {
          if(i__8792 < 32) {
            if((this__8783.bitmap >>> i__8792 & 1) === 0) {
              var G__8846 = i__8792 + 1;
              var G__8847 = j__8793;
              i__8792 = G__8846;
              j__8793 = G__8847;
              continue
            }else {
              nodes__8790[i__8792] = !(this__8783.arr[j__8793] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8783.arr[j__8793]), this__8783.arr[j__8793], this__8783.arr[j__8793 + 1], added_leaf_QMARK_) : this__8783.arr[j__8793 + 1];
              var G__8848 = i__8792 + 1;
              var G__8849 = j__8793 + 2;
              i__8792 = G__8848;
              j__8793 = G__8849;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8787 + 1, nodes__8790)
      }else {
        if("\ufdd0'else") {
          var new_arr__8794 = cljs.core.make_array.call(null, 2 * (n__8787 + 4));
          cljs.core.array_copy.call(null, this__8783.arr, 0, new_arr__8794, 0, 2 * idx__8786);
          new_arr__8794[2 * idx__8786] = key;
          new_arr__8794[2 * idx__8786 + 1] = val;
          cljs.core.array_copy.call(null, this__8783.arr, 2 * idx__8786, new_arr__8794, 2 * (idx__8786 + 1), 2 * (n__8787 - idx__8786));
          added_leaf_QMARK_.val = true;
          var editable__8795 = inode__8784.ensure_editable(edit);
          editable__8795.arr = new_arr__8794;
          editable__8795.bitmap = editable__8795.bitmap | bit__8785;
          return editable__8795
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8796 = this__8783.arr[2 * idx__8786];
    var val_or_node__8797 = this__8783.arr[2 * idx__8786 + 1];
    if(key_or_nil__8796 == null) {
      var n__8798 = val_or_node__8797.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8798 === val_or_node__8797) {
        return inode__8784
      }else {
        return cljs.core.edit_and_set.call(null, inode__8784, edit, 2 * idx__8786 + 1, n__8798)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8796)) {
        if(val === val_or_node__8797) {
          return inode__8784
        }else {
          return cljs.core.edit_and_set.call(null, inode__8784, edit, 2 * idx__8786 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8784, edit, 2 * idx__8786, null, 2 * idx__8786 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8796, val_or_node__8797, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8799 = this;
  var inode__8800 = this;
  return cljs.core.create_inode_seq.call(null, this__8799.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8801 = this;
  var inode__8802 = this;
  var bit__8803 = 1 << (hash >>> shift & 31);
  if((this__8801.bitmap & bit__8803) === 0) {
    return inode__8802
  }else {
    var idx__8804 = cljs.core.bitmap_indexed_node_index.call(null, this__8801.bitmap, bit__8803);
    var key_or_nil__8805 = this__8801.arr[2 * idx__8804];
    var val_or_node__8806 = this__8801.arr[2 * idx__8804 + 1];
    if(key_or_nil__8805 == null) {
      var n__8807 = val_or_node__8806.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8807 === val_or_node__8806) {
        return inode__8802
      }else {
        if(!(n__8807 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8802, edit, 2 * idx__8804 + 1, n__8807)
        }else {
          if(this__8801.bitmap === bit__8803) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8802.edit_and_remove_pair(edit, bit__8803, idx__8804)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8805)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8802.edit_and_remove_pair(edit, bit__8803, idx__8804)
      }else {
        if("\ufdd0'else") {
          return inode__8802
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8808 = this;
  var inode__8809 = this;
  if(e === this__8808.edit) {
    return inode__8809
  }else {
    var n__8810 = cljs.core.bit_count.call(null, this__8808.bitmap);
    var new_arr__8811 = cljs.core.make_array.call(null, n__8810 < 0 ? 4 : 2 * (n__8810 + 1));
    cljs.core.array_copy.call(null, this__8808.arr, 0, new_arr__8811, 0, 2 * n__8810);
    return new cljs.core.BitmapIndexedNode(e, this__8808.bitmap, new_arr__8811)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8812 = this;
  var inode__8813 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8812.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8814 = this;
  var inode__8815 = this;
  var bit__8816 = 1 << (hash >>> shift & 31);
  if((this__8814.bitmap & bit__8816) === 0) {
    return not_found
  }else {
    var idx__8817 = cljs.core.bitmap_indexed_node_index.call(null, this__8814.bitmap, bit__8816);
    var key_or_nil__8818 = this__8814.arr[2 * idx__8817];
    var val_or_node__8819 = this__8814.arr[2 * idx__8817 + 1];
    if(key_or_nil__8818 == null) {
      return val_or_node__8819.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8818)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8818, val_or_node__8819], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8820 = this;
  var inode__8821 = this;
  var bit__8822 = 1 << (hash >>> shift & 31);
  if((this__8820.bitmap & bit__8822) === 0) {
    return inode__8821
  }else {
    var idx__8823 = cljs.core.bitmap_indexed_node_index.call(null, this__8820.bitmap, bit__8822);
    var key_or_nil__8824 = this__8820.arr[2 * idx__8823];
    var val_or_node__8825 = this__8820.arr[2 * idx__8823 + 1];
    if(key_or_nil__8824 == null) {
      var n__8826 = val_or_node__8825.inode_without(shift + 5, hash, key);
      if(n__8826 === val_or_node__8825) {
        return inode__8821
      }else {
        if(!(n__8826 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8820.bitmap, cljs.core.clone_and_set.call(null, this__8820.arr, 2 * idx__8823 + 1, n__8826))
        }else {
          if(this__8820.bitmap === bit__8822) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8820.bitmap ^ bit__8822, cljs.core.remove_pair.call(null, this__8820.arr, idx__8823))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8824)) {
        return new cljs.core.BitmapIndexedNode(null, this__8820.bitmap ^ bit__8822, cljs.core.remove_pair.call(null, this__8820.arr, idx__8823))
      }else {
        if("\ufdd0'else") {
          return inode__8821
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8827 = this;
  var inode__8828 = this;
  var bit__8829 = 1 << (hash >>> shift & 31);
  var idx__8830 = cljs.core.bitmap_indexed_node_index.call(null, this__8827.bitmap, bit__8829);
  if((this__8827.bitmap & bit__8829) === 0) {
    var n__8831 = cljs.core.bit_count.call(null, this__8827.bitmap);
    if(n__8831 >= 16) {
      var nodes__8832 = cljs.core.make_array.call(null, 32);
      var jdx__8833 = hash >>> shift & 31;
      nodes__8832[jdx__8833] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8834 = 0;
      var j__8835 = 0;
      while(true) {
        if(i__8834 < 32) {
          if((this__8827.bitmap >>> i__8834 & 1) === 0) {
            var G__8850 = i__8834 + 1;
            var G__8851 = j__8835;
            i__8834 = G__8850;
            j__8835 = G__8851;
            continue
          }else {
            nodes__8832[i__8834] = !(this__8827.arr[j__8835] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8827.arr[j__8835]), this__8827.arr[j__8835], this__8827.arr[j__8835 + 1], added_leaf_QMARK_) : this__8827.arr[j__8835 + 1];
            var G__8852 = i__8834 + 1;
            var G__8853 = j__8835 + 2;
            i__8834 = G__8852;
            j__8835 = G__8853;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8831 + 1, nodes__8832)
    }else {
      var new_arr__8836 = cljs.core.make_array.call(null, 2 * (n__8831 + 1));
      cljs.core.array_copy.call(null, this__8827.arr, 0, new_arr__8836, 0, 2 * idx__8830);
      new_arr__8836[2 * idx__8830] = key;
      new_arr__8836[2 * idx__8830 + 1] = val;
      cljs.core.array_copy.call(null, this__8827.arr, 2 * idx__8830, new_arr__8836, 2 * (idx__8830 + 1), 2 * (n__8831 - idx__8830));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8827.bitmap | bit__8829, new_arr__8836)
    }
  }else {
    var key_or_nil__8837 = this__8827.arr[2 * idx__8830];
    var val_or_node__8838 = this__8827.arr[2 * idx__8830 + 1];
    if(key_or_nil__8837 == null) {
      var n__8839 = val_or_node__8838.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8839 === val_or_node__8838) {
        return inode__8828
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8827.bitmap, cljs.core.clone_and_set.call(null, this__8827.arr, 2 * idx__8830 + 1, n__8839))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8837)) {
        if(val === val_or_node__8838) {
          return inode__8828
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8827.bitmap, cljs.core.clone_and_set.call(null, this__8827.arr, 2 * idx__8830 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8827.bitmap, cljs.core.clone_and_set.call(null, this__8827.arr, 2 * idx__8830, null, 2 * idx__8830 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8837, val_or_node__8838, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8840 = this;
  var inode__8841 = this;
  var bit__8842 = 1 << (hash >>> shift & 31);
  if((this__8840.bitmap & bit__8842) === 0) {
    return not_found
  }else {
    var idx__8843 = cljs.core.bitmap_indexed_node_index.call(null, this__8840.bitmap, bit__8842);
    var key_or_nil__8844 = this__8840.arr[2 * idx__8843];
    var val_or_node__8845 = this__8840.arr[2 * idx__8843 + 1];
    if(key_or_nil__8844 == null) {
      return val_or_node__8845.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8844)) {
        return val_or_node__8845
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8861 = array_node.arr;
  var len__8862 = 2 * (array_node.cnt - 1);
  var new_arr__8863 = cljs.core.make_array.call(null, len__8862);
  var i__8864 = 0;
  var j__8865 = 1;
  var bitmap__8866 = 0;
  while(true) {
    if(i__8864 < len__8862) {
      if(function() {
        var and__3822__auto____8867 = !(i__8864 === idx);
        if(and__3822__auto____8867) {
          return!(arr__8861[i__8864] == null)
        }else {
          return and__3822__auto____8867
        }
      }()) {
        new_arr__8863[j__8865] = arr__8861[i__8864];
        var G__8868 = i__8864 + 1;
        var G__8869 = j__8865 + 2;
        var G__8870 = bitmap__8866 | 1 << i__8864;
        i__8864 = G__8868;
        j__8865 = G__8869;
        bitmap__8866 = G__8870;
        continue
      }else {
        var G__8871 = i__8864 + 1;
        var G__8872 = j__8865;
        var G__8873 = bitmap__8866;
        i__8864 = G__8871;
        j__8865 = G__8872;
        bitmap__8866 = G__8873;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8866, new_arr__8863)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8874 = this;
  var inode__8875 = this;
  var idx__8876 = hash >>> shift & 31;
  var node__8877 = this__8874.arr[idx__8876];
  if(node__8877 == null) {
    var editable__8878 = cljs.core.edit_and_set.call(null, inode__8875, edit, idx__8876, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8878.cnt = editable__8878.cnt + 1;
    return editable__8878
  }else {
    var n__8879 = node__8877.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8879 === node__8877) {
      return inode__8875
    }else {
      return cljs.core.edit_and_set.call(null, inode__8875, edit, idx__8876, n__8879)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8880 = this;
  var inode__8881 = this;
  return cljs.core.create_array_node_seq.call(null, this__8880.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8882 = this;
  var inode__8883 = this;
  var idx__8884 = hash >>> shift & 31;
  var node__8885 = this__8882.arr[idx__8884];
  if(node__8885 == null) {
    return inode__8883
  }else {
    var n__8886 = node__8885.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8886 === node__8885) {
      return inode__8883
    }else {
      if(n__8886 == null) {
        if(this__8882.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8883, edit, idx__8884)
        }else {
          var editable__8887 = cljs.core.edit_and_set.call(null, inode__8883, edit, idx__8884, n__8886);
          editable__8887.cnt = editable__8887.cnt - 1;
          return editable__8887
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8883, edit, idx__8884, n__8886)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8888 = this;
  var inode__8889 = this;
  if(e === this__8888.edit) {
    return inode__8889
  }else {
    return new cljs.core.ArrayNode(e, this__8888.cnt, this__8888.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8890 = this;
  var inode__8891 = this;
  var len__8892 = this__8890.arr.length;
  var i__8893 = 0;
  var init__8894 = init;
  while(true) {
    if(i__8893 < len__8892) {
      var node__8895 = this__8890.arr[i__8893];
      if(!(node__8895 == null)) {
        var init__8896 = node__8895.kv_reduce(f, init__8894);
        if(cljs.core.reduced_QMARK_.call(null, init__8896)) {
          return cljs.core.deref.call(null, init__8896)
        }else {
          var G__8915 = i__8893 + 1;
          var G__8916 = init__8896;
          i__8893 = G__8915;
          init__8894 = G__8916;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8894
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8897 = this;
  var inode__8898 = this;
  var idx__8899 = hash >>> shift & 31;
  var node__8900 = this__8897.arr[idx__8899];
  if(!(node__8900 == null)) {
    return node__8900.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8901 = this;
  var inode__8902 = this;
  var idx__8903 = hash >>> shift & 31;
  var node__8904 = this__8901.arr[idx__8903];
  if(!(node__8904 == null)) {
    var n__8905 = node__8904.inode_without(shift + 5, hash, key);
    if(n__8905 === node__8904) {
      return inode__8902
    }else {
      if(n__8905 == null) {
        if(this__8901.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8902, null, idx__8903)
        }else {
          return new cljs.core.ArrayNode(null, this__8901.cnt - 1, cljs.core.clone_and_set.call(null, this__8901.arr, idx__8903, n__8905))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8901.cnt, cljs.core.clone_and_set.call(null, this__8901.arr, idx__8903, n__8905))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8902
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8906 = this;
  var inode__8907 = this;
  var idx__8908 = hash >>> shift & 31;
  var node__8909 = this__8906.arr[idx__8908];
  if(node__8909 == null) {
    return new cljs.core.ArrayNode(null, this__8906.cnt + 1, cljs.core.clone_and_set.call(null, this__8906.arr, idx__8908, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8910 = node__8909.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8910 === node__8909) {
      return inode__8907
    }else {
      return new cljs.core.ArrayNode(null, this__8906.cnt, cljs.core.clone_and_set.call(null, this__8906.arr, idx__8908, n__8910))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8911 = this;
  var inode__8912 = this;
  var idx__8913 = hash >>> shift & 31;
  var node__8914 = this__8911.arr[idx__8913];
  if(!(node__8914 == null)) {
    return node__8914.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8919 = 2 * cnt;
  var i__8920 = 0;
  while(true) {
    if(i__8920 < lim__8919) {
      if(cljs.core.key_test.call(null, key, arr[i__8920])) {
        return i__8920
      }else {
        var G__8921 = i__8920 + 2;
        i__8920 = G__8921;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8922 = this;
  var inode__8923 = this;
  if(hash === this__8922.collision_hash) {
    var idx__8924 = cljs.core.hash_collision_node_find_index.call(null, this__8922.arr, this__8922.cnt, key);
    if(idx__8924 === -1) {
      if(this__8922.arr.length > 2 * this__8922.cnt) {
        var editable__8925 = cljs.core.edit_and_set.call(null, inode__8923, edit, 2 * this__8922.cnt, key, 2 * this__8922.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8925.cnt = editable__8925.cnt + 1;
        return editable__8925
      }else {
        var len__8926 = this__8922.arr.length;
        var new_arr__8927 = cljs.core.make_array.call(null, len__8926 + 2);
        cljs.core.array_copy.call(null, this__8922.arr, 0, new_arr__8927, 0, len__8926);
        new_arr__8927[len__8926] = key;
        new_arr__8927[len__8926 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8923.ensure_editable_array(edit, this__8922.cnt + 1, new_arr__8927)
      }
    }else {
      if(this__8922.arr[idx__8924 + 1] === val) {
        return inode__8923
      }else {
        return cljs.core.edit_and_set.call(null, inode__8923, edit, idx__8924 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8922.collision_hash >>> shift & 31), [null, inode__8923, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8928 = this;
  var inode__8929 = this;
  return cljs.core.create_inode_seq.call(null, this__8928.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8930 = this;
  var inode__8931 = this;
  var idx__8932 = cljs.core.hash_collision_node_find_index.call(null, this__8930.arr, this__8930.cnt, key);
  if(idx__8932 === -1) {
    return inode__8931
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8930.cnt === 1) {
      return null
    }else {
      var editable__8933 = inode__8931.ensure_editable(edit);
      var earr__8934 = editable__8933.arr;
      earr__8934[idx__8932] = earr__8934[2 * this__8930.cnt - 2];
      earr__8934[idx__8932 + 1] = earr__8934[2 * this__8930.cnt - 1];
      earr__8934[2 * this__8930.cnt - 1] = null;
      earr__8934[2 * this__8930.cnt - 2] = null;
      editable__8933.cnt = editable__8933.cnt - 1;
      return editable__8933
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8935 = this;
  var inode__8936 = this;
  if(e === this__8935.edit) {
    return inode__8936
  }else {
    var new_arr__8937 = cljs.core.make_array.call(null, 2 * (this__8935.cnt + 1));
    cljs.core.array_copy.call(null, this__8935.arr, 0, new_arr__8937, 0, 2 * this__8935.cnt);
    return new cljs.core.HashCollisionNode(e, this__8935.collision_hash, this__8935.cnt, new_arr__8937)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8938 = this;
  var inode__8939 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8938.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8940 = this;
  var inode__8941 = this;
  var idx__8942 = cljs.core.hash_collision_node_find_index.call(null, this__8940.arr, this__8940.cnt, key);
  if(idx__8942 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8940.arr[idx__8942])) {
      return cljs.core.PersistentVector.fromArray([this__8940.arr[idx__8942], this__8940.arr[idx__8942 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8943 = this;
  var inode__8944 = this;
  var idx__8945 = cljs.core.hash_collision_node_find_index.call(null, this__8943.arr, this__8943.cnt, key);
  if(idx__8945 === -1) {
    return inode__8944
  }else {
    if(this__8943.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8943.collision_hash, this__8943.cnt - 1, cljs.core.remove_pair.call(null, this__8943.arr, cljs.core.quot.call(null, idx__8945, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8946 = this;
  var inode__8947 = this;
  if(hash === this__8946.collision_hash) {
    var idx__8948 = cljs.core.hash_collision_node_find_index.call(null, this__8946.arr, this__8946.cnt, key);
    if(idx__8948 === -1) {
      var len__8949 = this__8946.arr.length;
      var new_arr__8950 = cljs.core.make_array.call(null, len__8949 + 2);
      cljs.core.array_copy.call(null, this__8946.arr, 0, new_arr__8950, 0, len__8949);
      new_arr__8950[len__8949] = key;
      new_arr__8950[len__8949 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8946.collision_hash, this__8946.cnt + 1, new_arr__8950)
    }else {
      if(cljs.core._EQ_.call(null, this__8946.arr[idx__8948], val)) {
        return inode__8947
      }else {
        return new cljs.core.HashCollisionNode(null, this__8946.collision_hash, this__8946.cnt, cljs.core.clone_and_set.call(null, this__8946.arr, idx__8948 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8946.collision_hash >>> shift & 31), [null, inode__8947])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8951 = this;
  var inode__8952 = this;
  var idx__8953 = cljs.core.hash_collision_node_find_index.call(null, this__8951.arr, this__8951.cnt, key);
  if(idx__8953 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8951.arr[idx__8953])) {
      return this__8951.arr[idx__8953 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8954 = this;
  var inode__8955 = this;
  if(e === this__8954.edit) {
    this__8954.arr = array;
    this__8954.cnt = count;
    return inode__8955
  }else {
    return new cljs.core.HashCollisionNode(this__8954.edit, this__8954.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8960 = cljs.core.hash.call(null, key1);
    if(key1hash__8960 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8960, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8961 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8960, key1, val1, added_leaf_QMARK___8961).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8961)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8962 = cljs.core.hash.call(null, key1);
    if(key1hash__8962 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8962, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8963 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8962, key1, val1, added_leaf_QMARK___8963).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8963)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8964 = this;
  var h__2220__auto____8965 = this__8964.__hash;
  if(!(h__2220__auto____8965 == null)) {
    return h__2220__auto____8965
  }else {
    var h__2220__auto____8966 = cljs.core.hash_coll.call(null, coll);
    this__8964.__hash = h__2220__auto____8966;
    return h__2220__auto____8966
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8967 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8968 = this;
  var this__8969 = this;
  return cljs.core.pr_str.call(null, this__8969)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8970 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8971 = this;
  if(this__8971.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8971.nodes[this__8971.i], this__8971.nodes[this__8971.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8971.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8972 = this;
  if(this__8972.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8972.nodes, this__8972.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8972.nodes, this__8972.i, cljs.core.next.call(null, this__8972.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8973 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8974 = this;
  return new cljs.core.NodeSeq(meta, this__8974.nodes, this__8974.i, this__8974.s, this__8974.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8975 = this;
  return this__8975.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8976 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8976.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8983 = nodes.length;
      var j__8984 = i;
      while(true) {
        if(j__8984 < len__8983) {
          if(!(nodes[j__8984] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8984, null, null)
          }else {
            var temp__3971__auto____8985 = nodes[j__8984 + 1];
            if(cljs.core.truth_(temp__3971__auto____8985)) {
              var node__8986 = temp__3971__auto____8985;
              var temp__3971__auto____8987 = node__8986.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8987)) {
                var node_seq__8988 = temp__3971__auto____8987;
                return new cljs.core.NodeSeq(null, nodes, j__8984 + 2, node_seq__8988, null)
              }else {
                var G__8989 = j__8984 + 2;
                j__8984 = G__8989;
                continue
              }
            }else {
              var G__8990 = j__8984 + 2;
              j__8984 = G__8990;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8991 = this;
  var h__2220__auto____8992 = this__8991.__hash;
  if(!(h__2220__auto____8992 == null)) {
    return h__2220__auto____8992
  }else {
    var h__2220__auto____8993 = cljs.core.hash_coll.call(null, coll);
    this__8991.__hash = h__2220__auto____8993;
    return h__2220__auto____8993
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8994 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8995 = this;
  var this__8996 = this;
  return cljs.core.pr_str.call(null, this__8996)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8997 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8998 = this;
  return cljs.core.first.call(null, this__8998.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8999 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8999.nodes, this__8999.i, cljs.core.next.call(null, this__8999.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9000 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9001 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9001.nodes, this__9001.i, this__9001.s, this__9001.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9002 = this;
  return this__9002.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9003 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9003.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9010 = nodes.length;
      var j__9011 = i;
      while(true) {
        if(j__9011 < len__9010) {
          var temp__3971__auto____9012 = nodes[j__9011];
          if(cljs.core.truth_(temp__3971__auto____9012)) {
            var nj__9013 = temp__3971__auto____9012;
            var temp__3971__auto____9014 = nj__9013.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9014)) {
              var ns__9015 = temp__3971__auto____9014;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9011 + 1, ns__9015, null)
            }else {
              var G__9016 = j__9011 + 1;
              j__9011 = G__9016;
              continue
            }
          }else {
            var G__9017 = j__9011 + 1;
            j__9011 = G__9017;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9020 = this;
  return new cljs.core.TransientHashMap({}, this__9020.root, this__9020.cnt, this__9020.has_nil_QMARK_, this__9020.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9021 = this;
  var h__2220__auto____9022 = this__9021.__hash;
  if(!(h__2220__auto____9022 == null)) {
    return h__2220__auto____9022
  }else {
    var h__2220__auto____9023 = cljs.core.hash_imap.call(null, coll);
    this__9021.__hash = h__2220__auto____9023;
    return h__2220__auto____9023
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9024 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9025 = this;
  if(k == null) {
    if(this__9025.has_nil_QMARK_) {
      return this__9025.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9025.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9025.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9026 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9027 = this__9026.has_nil_QMARK_;
      if(and__3822__auto____9027) {
        return v === this__9026.nil_val
      }else {
        return and__3822__auto____9027
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9026.meta, this__9026.has_nil_QMARK_ ? this__9026.cnt : this__9026.cnt + 1, this__9026.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9028 = new cljs.core.Box(false);
    var new_root__9029 = (this__9026.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9026.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9028);
    if(new_root__9029 === this__9026.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9026.meta, added_leaf_QMARK___9028.val ? this__9026.cnt + 1 : this__9026.cnt, new_root__9029, this__9026.has_nil_QMARK_, this__9026.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9030 = this;
  if(k == null) {
    return this__9030.has_nil_QMARK_
  }else {
    if(this__9030.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9030.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9053 = null;
  var G__9053__2 = function(this_sym9031, k) {
    var this__9033 = this;
    var this_sym9031__9034 = this;
    var coll__9035 = this_sym9031__9034;
    return coll__9035.cljs$core$ILookup$_lookup$arity$2(coll__9035, k)
  };
  var G__9053__3 = function(this_sym9032, k, not_found) {
    var this__9033 = this;
    var this_sym9032__9036 = this;
    var coll__9037 = this_sym9032__9036;
    return coll__9037.cljs$core$ILookup$_lookup$arity$3(coll__9037, k, not_found)
  };
  G__9053 = function(this_sym9032, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9053__2.call(this, this_sym9032, k);
      case 3:
        return G__9053__3.call(this, this_sym9032, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9053
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9018, args9019) {
  var this__9038 = this;
  return this_sym9018.call.apply(this_sym9018, [this_sym9018].concat(args9019.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9039 = this;
  var init__9040 = this__9039.has_nil_QMARK_ ? f.call(null, init, null, this__9039.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9040)) {
    return cljs.core.deref.call(null, init__9040)
  }else {
    if(!(this__9039.root == null)) {
      return this__9039.root.kv_reduce(f, init__9040)
    }else {
      if("\ufdd0'else") {
        return init__9040
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9041 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9042 = this;
  var this__9043 = this;
  return cljs.core.pr_str.call(null, this__9043)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9044 = this;
  if(this__9044.cnt > 0) {
    var s__9045 = !(this__9044.root == null) ? this__9044.root.inode_seq() : null;
    if(this__9044.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9044.nil_val], true), s__9045)
    }else {
      return s__9045
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9046 = this;
  return this__9046.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9047 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9048 = this;
  return new cljs.core.PersistentHashMap(meta, this__9048.cnt, this__9048.root, this__9048.has_nil_QMARK_, this__9048.nil_val, this__9048.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9049 = this;
  return this__9049.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9050 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9050.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9051 = this;
  if(k == null) {
    if(this__9051.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9051.meta, this__9051.cnt - 1, this__9051.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9051.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9052 = this__9051.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9052 === this__9051.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9051.meta, this__9051.cnt - 1, new_root__9052, this__9051.has_nil_QMARK_, this__9051.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9054 = ks.length;
  var i__9055 = 0;
  var out__9056 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9055 < len__9054) {
      var G__9057 = i__9055 + 1;
      var G__9058 = cljs.core.assoc_BANG_.call(null, out__9056, ks[i__9055], vs[i__9055]);
      i__9055 = G__9057;
      out__9056 = G__9058;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9056)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9059 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9060 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9061 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9062 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9063 = this;
  if(k == null) {
    if(this__9063.has_nil_QMARK_) {
      return this__9063.nil_val
    }else {
      return null
    }
  }else {
    if(this__9063.root == null) {
      return null
    }else {
      return this__9063.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9064 = this;
  if(k == null) {
    if(this__9064.has_nil_QMARK_) {
      return this__9064.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9064.root == null) {
      return not_found
    }else {
      return this__9064.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9065 = this;
  if(this__9065.edit) {
    return this__9065.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9066 = this;
  var tcoll__9067 = this;
  if(this__9066.edit) {
    if(function() {
      var G__9068__9069 = o;
      if(G__9068__9069) {
        if(function() {
          var or__3824__auto____9070 = G__9068__9069.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9070) {
            return or__3824__auto____9070
          }else {
            return G__9068__9069.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9068__9069.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9068__9069)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9068__9069)
      }
    }()) {
      return tcoll__9067.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9071 = cljs.core.seq.call(null, o);
      var tcoll__9072 = tcoll__9067;
      while(true) {
        var temp__3971__auto____9073 = cljs.core.first.call(null, es__9071);
        if(cljs.core.truth_(temp__3971__auto____9073)) {
          var e__9074 = temp__3971__auto____9073;
          var G__9085 = cljs.core.next.call(null, es__9071);
          var G__9086 = tcoll__9072.assoc_BANG_(cljs.core.key.call(null, e__9074), cljs.core.val.call(null, e__9074));
          es__9071 = G__9085;
          tcoll__9072 = G__9086;
          continue
        }else {
          return tcoll__9072
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9075 = this;
  var tcoll__9076 = this;
  if(this__9075.edit) {
    if(k == null) {
      if(this__9075.nil_val === v) {
      }else {
        this__9075.nil_val = v
      }
      if(this__9075.has_nil_QMARK_) {
      }else {
        this__9075.count = this__9075.count + 1;
        this__9075.has_nil_QMARK_ = true
      }
      return tcoll__9076
    }else {
      var added_leaf_QMARK___9077 = new cljs.core.Box(false);
      var node__9078 = (this__9075.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9075.root).inode_assoc_BANG_(this__9075.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9077);
      if(node__9078 === this__9075.root) {
      }else {
        this__9075.root = node__9078
      }
      if(added_leaf_QMARK___9077.val) {
        this__9075.count = this__9075.count + 1
      }else {
      }
      return tcoll__9076
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9079 = this;
  var tcoll__9080 = this;
  if(this__9079.edit) {
    if(k == null) {
      if(this__9079.has_nil_QMARK_) {
        this__9079.has_nil_QMARK_ = false;
        this__9079.nil_val = null;
        this__9079.count = this__9079.count - 1;
        return tcoll__9080
      }else {
        return tcoll__9080
      }
    }else {
      if(this__9079.root == null) {
        return tcoll__9080
      }else {
        var removed_leaf_QMARK___9081 = new cljs.core.Box(false);
        var node__9082 = this__9079.root.inode_without_BANG_(this__9079.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9081);
        if(node__9082 === this__9079.root) {
        }else {
          this__9079.root = node__9082
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9081[0])) {
          this__9079.count = this__9079.count - 1
        }else {
        }
        return tcoll__9080
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9083 = this;
  var tcoll__9084 = this;
  if(this__9083.edit) {
    this__9083.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9083.count, this__9083.root, this__9083.has_nil_QMARK_, this__9083.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9089 = node;
  var stack__9090 = stack;
  while(true) {
    if(!(t__9089 == null)) {
      var G__9091 = ascending_QMARK_ ? t__9089.left : t__9089.right;
      var G__9092 = cljs.core.conj.call(null, stack__9090, t__9089);
      t__9089 = G__9091;
      stack__9090 = G__9092;
      continue
    }else {
      return stack__9090
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9093 = this;
  var h__2220__auto____9094 = this__9093.__hash;
  if(!(h__2220__auto____9094 == null)) {
    return h__2220__auto____9094
  }else {
    var h__2220__auto____9095 = cljs.core.hash_coll.call(null, coll);
    this__9093.__hash = h__2220__auto____9095;
    return h__2220__auto____9095
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9096 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9097 = this;
  var this__9098 = this;
  return cljs.core.pr_str.call(null, this__9098)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9099 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9100 = this;
  if(this__9100.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9100.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9101 = this;
  return cljs.core.peek.call(null, this__9101.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9102 = this;
  var t__9103 = cljs.core.first.call(null, this__9102.stack);
  var next_stack__9104 = cljs.core.tree_map_seq_push.call(null, this__9102.ascending_QMARK_ ? t__9103.right : t__9103.left, cljs.core.next.call(null, this__9102.stack), this__9102.ascending_QMARK_);
  if(!(next_stack__9104 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9104, this__9102.ascending_QMARK_, this__9102.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9105 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9106 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9106.stack, this__9106.ascending_QMARK_, this__9106.cnt, this__9106.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9107 = this;
  return this__9107.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9109 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9109) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9109
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9111 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9111) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9111
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9115 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9115)) {
    return cljs.core.deref.call(null, init__9115)
  }else {
    var init__9116 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9115) : init__9115;
    if(cljs.core.reduced_QMARK_.call(null, init__9116)) {
      return cljs.core.deref.call(null, init__9116)
    }else {
      var init__9117 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9116) : init__9116;
      if(cljs.core.reduced_QMARK_.call(null, init__9117)) {
        return cljs.core.deref.call(null, init__9117)
      }else {
        return init__9117
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9120 = this;
  var h__2220__auto____9121 = this__9120.__hash;
  if(!(h__2220__auto____9121 == null)) {
    return h__2220__auto____9121
  }else {
    var h__2220__auto____9122 = cljs.core.hash_coll.call(null, coll);
    this__9120.__hash = h__2220__auto____9122;
    return h__2220__auto____9122
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9123 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9124 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9125 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9125.key, this__9125.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9173 = null;
  var G__9173__2 = function(this_sym9126, k) {
    var this__9128 = this;
    var this_sym9126__9129 = this;
    var node__9130 = this_sym9126__9129;
    return node__9130.cljs$core$ILookup$_lookup$arity$2(node__9130, k)
  };
  var G__9173__3 = function(this_sym9127, k, not_found) {
    var this__9128 = this;
    var this_sym9127__9131 = this;
    var node__9132 = this_sym9127__9131;
    return node__9132.cljs$core$ILookup$_lookup$arity$3(node__9132, k, not_found)
  };
  G__9173 = function(this_sym9127, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9173__2.call(this, this_sym9127, k);
      case 3:
        return G__9173__3.call(this, this_sym9127, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9173
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9118, args9119) {
  var this__9133 = this;
  return this_sym9118.call.apply(this_sym9118, [this_sym9118].concat(args9119.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9134 = this;
  return cljs.core.PersistentVector.fromArray([this__9134.key, this__9134.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9135 = this;
  return this__9135.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9136 = this;
  return this__9136.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9137 = this;
  var node__9138 = this;
  return ins.balance_right(node__9138)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9139 = this;
  var node__9140 = this;
  return new cljs.core.RedNode(this__9139.key, this__9139.val, this__9139.left, this__9139.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9141 = this;
  var node__9142 = this;
  return cljs.core.balance_right_del.call(null, this__9141.key, this__9141.val, this__9141.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9143 = this;
  var node__9144 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9145 = this;
  var node__9146 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9146, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9147 = this;
  var node__9148 = this;
  return cljs.core.balance_left_del.call(null, this__9147.key, this__9147.val, del, this__9147.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9149 = this;
  var node__9150 = this;
  return ins.balance_left(node__9150)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9151 = this;
  var node__9152 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9152, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9174 = null;
  var G__9174__0 = function() {
    var this__9153 = this;
    var this__9155 = this;
    return cljs.core.pr_str.call(null, this__9155)
  };
  G__9174 = function() {
    switch(arguments.length) {
      case 0:
        return G__9174__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9174
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9156 = this;
  var node__9157 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9157, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9158 = this;
  var node__9159 = this;
  return node__9159
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9160 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9161 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9162 = this;
  return cljs.core.list.call(null, this__9162.key, this__9162.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9163 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9164 = this;
  return this__9164.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9165 = this;
  return cljs.core.PersistentVector.fromArray([this__9165.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9166 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9166.key, this__9166.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9167 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9168 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9168.key, this__9168.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9169 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9170 = this;
  if(n === 0) {
    return this__9170.key
  }else {
    if(n === 1) {
      return this__9170.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9171 = this;
  if(n === 0) {
    return this__9171.key
  }else {
    if(n === 1) {
      return this__9171.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9172 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9177 = this;
  var h__2220__auto____9178 = this__9177.__hash;
  if(!(h__2220__auto____9178 == null)) {
    return h__2220__auto____9178
  }else {
    var h__2220__auto____9179 = cljs.core.hash_coll.call(null, coll);
    this__9177.__hash = h__2220__auto____9179;
    return h__2220__auto____9179
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9180 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9181 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9182 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9182.key, this__9182.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9230 = null;
  var G__9230__2 = function(this_sym9183, k) {
    var this__9185 = this;
    var this_sym9183__9186 = this;
    var node__9187 = this_sym9183__9186;
    return node__9187.cljs$core$ILookup$_lookup$arity$2(node__9187, k)
  };
  var G__9230__3 = function(this_sym9184, k, not_found) {
    var this__9185 = this;
    var this_sym9184__9188 = this;
    var node__9189 = this_sym9184__9188;
    return node__9189.cljs$core$ILookup$_lookup$arity$3(node__9189, k, not_found)
  };
  G__9230 = function(this_sym9184, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9230__2.call(this, this_sym9184, k);
      case 3:
        return G__9230__3.call(this, this_sym9184, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9230
}();
cljs.core.RedNode.prototype.apply = function(this_sym9175, args9176) {
  var this__9190 = this;
  return this_sym9175.call.apply(this_sym9175, [this_sym9175].concat(args9176.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9191 = this;
  return cljs.core.PersistentVector.fromArray([this__9191.key, this__9191.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9192 = this;
  return this__9192.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9193 = this;
  return this__9193.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9194 = this;
  var node__9195 = this;
  return new cljs.core.RedNode(this__9194.key, this__9194.val, this__9194.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9196 = this;
  var node__9197 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9198 = this;
  var node__9199 = this;
  return new cljs.core.RedNode(this__9198.key, this__9198.val, this__9198.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9200 = this;
  var node__9201 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9202 = this;
  var node__9203 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9203, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9204 = this;
  var node__9205 = this;
  return new cljs.core.RedNode(this__9204.key, this__9204.val, del, this__9204.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9206 = this;
  var node__9207 = this;
  return new cljs.core.RedNode(this__9206.key, this__9206.val, ins, this__9206.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9208 = this;
  var node__9209 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9208.left)) {
    return new cljs.core.RedNode(this__9208.key, this__9208.val, this__9208.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9208.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9208.right)) {
      return new cljs.core.RedNode(this__9208.right.key, this__9208.right.val, new cljs.core.BlackNode(this__9208.key, this__9208.val, this__9208.left, this__9208.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9208.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9209, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9231 = null;
  var G__9231__0 = function() {
    var this__9210 = this;
    var this__9212 = this;
    return cljs.core.pr_str.call(null, this__9212)
  };
  G__9231 = function() {
    switch(arguments.length) {
      case 0:
        return G__9231__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9231
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9213 = this;
  var node__9214 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9213.right)) {
    return new cljs.core.RedNode(this__9213.key, this__9213.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9213.left, null), this__9213.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9213.left)) {
      return new cljs.core.RedNode(this__9213.left.key, this__9213.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9213.left.left, null), new cljs.core.BlackNode(this__9213.key, this__9213.val, this__9213.left.right, this__9213.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9214, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9215 = this;
  var node__9216 = this;
  return new cljs.core.BlackNode(this__9215.key, this__9215.val, this__9215.left, this__9215.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9217 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9218 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9219 = this;
  return cljs.core.list.call(null, this__9219.key, this__9219.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9220 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9221 = this;
  return this__9221.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9222 = this;
  return cljs.core.PersistentVector.fromArray([this__9222.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9223 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9223.key, this__9223.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9224 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9225 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9225.key, this__9225.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9226 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9227 = this;
  if(n === 0) {
    return this__9227.key
  }else {
    if(n === 1) {
      return this__9227.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9228 = this;
  if(n === 0) {
    return this__9228.key
  }else {
    if(n === 1) {
      return this__9228.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9229 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9235 = comp.call(null, k, tree.key);
    if(c__9235 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9235 < 0) {
        var ins__9236 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9236 == null)) {
          return tree.add_left(ins__9236)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9237 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9237 == null)) {
            return tree.add_right(ins__9237)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9240 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9240)) {
            return new cljs.core.RedNode(app__9240.key, app__9240.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9240.left, null), new cljs.core.RedNode(right.key, right.val, app__9240.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9240, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9241 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9241)) {
              return new cljs.core.RedNode(app__9241.key, app__9241.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9241.left, null), new cljs.core.BlackNode(right.key, right.val, app__9241.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9241, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9247 = comp.call(null, k, tree.key);
    if(c__9247 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9247 < 0) {
        var del__9248 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9249 = !(del__9248 == null);
          if(or__3824__auto____9249) {
            return or__3824__auto____9249
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9248, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9248, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9250 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9251 = !(del__9250 == null);
            if(or__3824__auto____9251) {
              return or__3824__auto____9251
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9250)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9250, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9254 = tree.key;
  var c__9255 = comp.call(null, k, tk__9254);
  if(c__9255 === 0) {
    return tree.replace(tk__9254, v, tree.left, tree.right)
  }else {
    if(c__9255 < 0) {
      return tree.replace(tk__9254, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9254, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9258 = this;
  var h__2220__auto____9259 = this__9258.__hash;
  if(!(h__2220__auto____9259 == null)) {
    return h__2220__auto____9259
  }else {
    var h__2220__auto____9260 = cljs.core.hash_imap.call(null, coll);
    this__9258.__hash = h__2220__auto____9260;
    return h__2220__auto____9260
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9261 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9262 = this;
  var n__9263 = coll.entry_at(k);
  if(!(n__9263 == null)) {
    return n__9263.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9264 = this;
  var found__9265 = [null];
  var t__9266 = cljs.core.tree_map_add.call(null, this__9264.comp, this__9264.tree, k, v, found__9265);
  if(t__9266 == null) {
    var found_node__9267 = cljs.core.nth.call(null, found__9265, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9267.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9264.comp, cljs.core.tree_map_replace.call(null, this__9264.comp, this__9264.tree, k, v), this__9264.cnt, this__9264.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9264.comp, t__9266.blacken(), this__9264.cnt + 1, this__9264.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9268 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9302 = null;
  var G__9302__2 = function(this_sym9269, k) {
    var this__9271 = this;
    var this_sym9269__9272 = this;
    var coll__9273 = this_sym9269__9272;
    return coll__9273.cljs$core$ILookup$_lookup$arity$2(coll__9273, k)
  };
  var G__9302__3 = function(this_sym9270, k, not_found) {
    var this__9271 = this;
    var this_sym9270__9274 = this;
    var coll__9275 = this_sym9270__9274;
    return coll__9275.cljs$core$ILookup$_lookup$arity$3(coll__9275, k, not_found)
  };
  G__9302 = function(this_sym9270, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9302__2.call(this, this_sym9270, k);
      case 3:
        return G__9302__3.call(this, this_sym9270, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9302
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9256, args9257) {
  var this__9276 = this;
  return this_sym9256.call.apply(this_sym9256, [this_sym9256].concat(args9257.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9277 = this;
  if(!(this__9277.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9277.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9278 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9279 = this;
  if(this__9279.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9279.tree, false, this__9279.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9280 = this;
  var this__9281 = this;
  return cljs.core.pr_str.call(null, this__9281)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9282 = this;
  var coll__9283 = this;
  var t__9284 = this__9282.tree;
  while(true) {
    if(!(t__9284 == null)) {
      var c__9285 = this__9282.comp.call(null, k, t__9284.key);
      if(c__9285 === 0) {
        return t__9284
      }else {
        if(c__9285 < 0) {
          var G__9303 = t__9284.left;
          t__9284 = G__9303;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9304 = t__9284.right;
            t__9284 = G__9304;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9286 = this;
  if(this__9286.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9286.tree, ascending_QMARK_, this__9286.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9287 = this;
  if(this__9287.cnt > 0) {
    var stack__9288 = null;
    var t__9289 = this__9287.tree;
    while(true) {
      if(!(t__9289 == null)) {
        var c__9290 = this__9287.comp.call(null, k, t__9289.key);
        if(c__9290 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9288, t__9289), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9290 < 0) {
              var G__9305 = cljs.core.conj.call(null, stack__9288, t__9289);
              var G__9306 = t__9289.left;
              stack__9288 = G__9305;
              t__9289 = G__9306;
              continue
            }else {
              var G__9307 = stack__9288;
              var G__9308 = t__9289.right;
              stack__9288 = G__9307;
              t__9289 = G__9308;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9290 > 0) {
                var G__9309 = cljs.core.conj.call(null, stack__9288, t__9289);
                var G__9310 = t__9289.right;
                stack__9288 = G__9309;
                t__9289 = G__9310;
                continue
              }else {
                var G__9311 = stack__9288;
                var G__9312 = t__9289.left;
                stack__9288 = G__9311;
                t__9289 = G__9312;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9288 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9288, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9291 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9292 = this;
  return this__9292.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9293 = this;
  if(this__9293.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9293.tree, true, this__9293.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9294 = this;
  return this__9294.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9295 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9296 = this;
  return new cljs.core.PersistentTreeMap(this__9296.comp, this__9296.tree, this__9296.cnt, meta, this__9296.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9297 = this;
  return this__9297.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9298 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9298.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9299 = this;
  var found__9300 = [null];
  var t__9301 = cljs.core.tree_map_remove.call(null, this__9299.comp, this__9299.tree, k, found__9300);
  if(t__9301 == null) {
    if(cljs.core.nth.call(null, found__9300, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9299.comp, null, 0, this__9299.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9299.comp, t__9301.blacken(), this__9299.cnt - 1, this__9299.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9315 = cljs.core.seq.call(null, keyvals);
    var out__9316 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9315) {
        var G__9317 = cljs.core.nnext.call(null, in__9315);
        var G__9318 = cljs.core.assoc_BANG_.call(null, out__9316, cljs.core.first.call(null, in__9315), cljs.core.second.call(null, in__9315));
        in__9315 = G__9317;
        out__9316 = G__9318;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9316)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9319) {
    var keyvals = cljs.core.seq(arglist__9319);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9320) {
    var keyvals = cljs.core.seq(arglist__9320);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9324 = [];
    var obj__9325 = {};
    var kvs__9326 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9326) {
        ks__9324.push(cljs.core.first.call(null, kvs__9326));
        obj__9325[cljs.core.first.call(null, kvs__9326)] = cljs.core.second.call(null, kvs__9326);
        var G__9327 = cljs.core.nnext.call(null, kvs__9326);
        kvs__9326 = G__9327;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9324, obj__9325)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9328) {
    var keyvals = cljs.core.seq(arglist__9328);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9331 = cljs.core.seq.call(null, keyvals);
    var out__9332 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9331) {
        var G__9333 = cljs.core.nnext.call(null, in__9331);
        var G__9334 = cljs.core.assoc.call(null, out__9332, cljs.core.first.call(null, in__9331), cljs.core.second.call(null, in__9331));
        in__9331 = G__9333;
        out__9332 = G__9334;
        continue
      }else {
        return out__9332
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9335) {
    var keyvals = cljs.core.seq(arglist__9335);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9338 = cljs.core.seq.call(null, keyvals);
    var out__9339 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9338) {
        var G__9340 = cljs.core.nnext.call(null, in__9338);
        var G__9341 = cljs.core.assoc.call(null, out__9339, cljs.core.first.call(null, in__9338), cljs.core.second.call(null, in__9338));
        in__9338 = G__9340;
        out__9339 = G__9341;
        continue
      }else {
        return out__9339
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9342) {
    var comparator = cljs.core.first(arglist__9342);
    var keyvals = cljs.core.rest(arglist__9342);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9343_SHARP_, p2__9344_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9346 = p1__9343_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9346)) {
            return or__3824__auto____9346
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9344_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9347) {
    var maps = cljs.core.seq(arglist__9347);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9355 = function(m, e) {
        var k__9353 = cljs.core.first.call(null, e);
        var v__9354 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9353)) {
          return cljs.core.assoc.call(null, m, k__9353, f.call(null, cljs.core._lookup.call(null, m, k__9353, null), v__9354))
        }else {
          return cljs.core.assoc.call(null, m, k__9353, v__9354)
        }
      };
      var merge2__9357 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9355, function() {
          var or__3824__auto____9356 = m1;
          if(cljs.core.truth_(or__3824__auto____9356)) {
            return or__3824__auto____9356
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9357, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9358) {
    var f = cljs.core.first(arglist__9358);
    var maps = cljs.core.rest(arglist__9358);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9363 = cljs.core.ObjMap.EMPTY;
  var keys__9364 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9364) {
      var key__9365 = cljs.core.first.call(null, keys__9364);
      var entry__9366 = cljs.core._lookup.call(null, map, key__9365, "\ufdd0'cljs.core/not-found");
      var G__9367 = cljs.core.not_EQ_.call(null, entry__9366, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9363, key__9365, entry__9366) : ret__9363;
      var G__9368 = cljs.core.next.call(null, keys__9364);
      ret__9363 = G__9367;
      keys__9364 = G__9368;
      continue
    }else {
      return ret__9363
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9372 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9372.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9373 = this;
  var h__2220__auto____9374 = this__9373.__hash;
  if(!(h__2220__auto____9374 == null)) {
    return h__2220__auto____9374
  }else {
    var h__2220__auto____9375 = cljs.core.hash_iset.call(null, coll);
    this__9373.__hash = h__2220__auto____9375;
    return h__2220__auto____9375
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9376 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9377 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9377.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9398 = null;
  var G__9398__2 = function(this_sym9378, k) {
    var this__9380 = this;
    var this_sym9378__9381 = this;
    var coll__9382 = this_sym9378__9381;
    return coll__9382.cljs$core$ILookup$_lookup$arity$2(coll__9382, k)
  };
  var G__9398__3 = function(this_sym9379, k, not_found) {
    var this__9380 = this;
    var this_sym9379__9383 = this;
    var coll__9384 = this_sym9379__9383;
    return coll__9384.cljs$core$ILookup$_lookup$arity$3(coll__9384, k, not_found)
  };
  G__9398 = function(this_sym9379, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9398__2.call(this, this_sym9379, k);
      case 3:
        return G__9398__3.call(this, this_sym9379, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9398
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9370, args9371) {
  var this__9385 = this;
  return this_sym9370.call.apply(this_sym9370, [this_sym9370].concat(args9371.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9386 = this;
  return new cljs.core.PersistentHashSet(this__9386.meta, cljs.core.assoc.call(null, this__9386.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9387 = this;
  var this__9388 = this;
  return cljs.core.pr_str.call(null, this__9388)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9389 = this;
  return cljs.core.keys.call(null, this__9389.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9390 = this;
  return new cljs.core.PersistentHashSet(this__9390.meta, cljs.core.dissoc.call(null, this__9390.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9391 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9392 = this;
  var and__3822__auto____9393 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9393) {
    var and__3822__auto____9394 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9394) {
      return cljs.core.every_QMARK_.call(null, function(p1__9369_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9369_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9394
    }
  }else {
    return and__3822__auto____9393
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9395 = this;
  return new cljs.core.PersistentHashSet(meta, this__9395.hash_map, this__9395.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9396 = this;
  return this__9396.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9397 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9397.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9399 = cljs.core.count.call(null, items);
  var i__9400 = 0;
  var out__9401 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9400 < len__9399) {
      var G__9402 = i__9400 + 1;
      var G__9403 = cljs.core.conj_BANG_.call(null, out__9401, items[i__9400]);
      i__9400 = G__9402;
      out__9401 = G__9403;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9401)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9421 = null;
  var G__9421__2 = function(this_sym9407, k) {
    var this__9409 = this;
    var this_sym9407__9410 = this;
    var tcoll__9411 = this_sym9407__9410;
    if(cljs.core._lookup.call(null, this__9409.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9421__3 = function(this_sym9408, k, not_found) {
    var this__9409 = this;
    var this_sym9408__9412 = this;
    var tcoll__9413 = this_sym9408__9412;
    if(cljs.core._lookup.call(null, this__9409.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9421 = function(this_sym9408, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9421__2.call(this, this_sym9408, k);
      case 3:
        return G__9421__3.call(this, this_sym9408, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9421
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9405, args9406) {
  var this__9414 = this;
  return this_sym9405.call.apply(this_sym9405, [this_sym9405].concat(args9406.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9415 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9416 = this;
  if(cljs.core._lookup.call(null, this__9416.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9417 = this;
  return cljs.core.count.call(null, this__9417.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9418 = this;
  this__9418.transient_map = cljs.core.dissoc_BANG_.call(null, this__9418.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9419 = this;
  this__9419.transient_map = cljs.core.assoc_BANG_.call(null, this__9419.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9420 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9420.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9424 = this;
  var h__2220__auto____9425 = this__9424.__hash;
  if(!(h__2220__auto____9425 == null)) {
    return h__2220__auto____9425
  }else {
    var h__2220__auto____9426 = cljs.core.hash_iset.call(null, coll);
    this__9424.__hash = h__2220__auto____9426;
    return h__2220__auto____9426
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9427 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9428 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9428.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9454 = null;
  var G__9454__2 = function(this_sym9429, k) {
    var this__9431 = this;
    var this_sym9429__9432 = this;
    var coll__9433 = this_sym9429__9432;
    return coll__9433.cljs$core$ILookup$_lookup$arity$2(coll__9433, k)
  };
  var G__9454__3 = function(this_sym9430, k, not_found) {
    var this__9431 = this;
    var this_sym9430__9434 = this;
    var coll__9435 = this_sym9430__9434;
    return coll__9435.cljs$core$ILookup$_lookup$arity$3(coll__9435, k, not_found)
  };
  G__9454 = function(this_sym9430, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9454__2.call(this, this_sym9430, k);
      case 3:
        return G__9454__3.call(this, this_sym9430, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9454
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9422, args9423) {
  var this__9436 = this;
  return this_sym9422.call.apply(this_sym9422, [this_sym9422].concat(args9423.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9437 = this;
  return new cljs.core.PersistentTreeSet(this__9437.meta, cljs.core.assoc.call(null, this__9437.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9438 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9438.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9439 = this;
  var this__9440 = this;
  return cljs.core.pr_str.call(null, this__9440)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9441 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9441.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9442 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9442.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9443 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9444 = this;
  return cljs.core._comparator.call(null, this__9444.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9445 = this;
  return cljs.core.keys.call(null, this__9445.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9446 = this;
  return new cljs.core.PersistentTreeSet(this__9446.meta, cljs.core.dissoc.call(null, this__9446.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9447 = this;
  return cljs.core.count.call(null, this__9447.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9448 = this;
  var and__3822__auto____9449 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9449) {
    var and__3822__auto____9450 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9450) {
      return cljs.core.every_QMARK_.call(null, function(p1__9404_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9404_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9450
    }
  }else {
    return and__3822__auto____9449
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9451 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9451.tree_map, this__9451.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9452 = this;
  return this__9452.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9453 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9453.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9459__delegate = function(keys) {
      var in__9457 = cljs.core.seq.call(null, keys);
      var out__9458 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9457)) {
          var G__9460 = cljs.core.next.call(null, in__9457);
          var G__9461 = cljs.core.conj_BANG_.call(null, out__9458, cljs.core.first.call(null, in__9457));
          in__9457 = G__9460;
          out__9458 = G__9461;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9458)
        }
        break
      }
    };
    var G__9459 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9459__delegate.call(this, keys)
    };
    G__9459.cljs$lang$maxFixedArity = 0;
    G__9459.cljs$lang$applyTo = function(arglist__9462) {
      var keys = cljs.core.seq(arglist__9462);
      return G__9459__delegate(keys)
    };
    G__9459.cljs$lang$arity$variadic = G__9459__delegate;
    return G__9459
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9463) {
    var keys = cljs.core.seq(arglist__9463);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9465) {
    var comparator = cljs.core.first(arglist__9465);
    var keys = cljs.core.rest(arglist__9465);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9471 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9472 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9472)) {
        var e__9473 = temp__3971__auto____9472;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9473))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9471, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9464_SHARP_) {
      var temp__3971__auto____9474 = cljs.core.find.call(null, smap, p1__9464_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9474)) {
        var e__9475 = temp__3971__auto____9474;
        return cljs.core.second.call(null, e__9475)
      }else {
        return p1__9464_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9505 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9498, seen) {
        while(true) {
          var vec__9499__9500 = p__9498;
          var f__9501 = cljs.core.nth.call(null, vec__9499__9500, 0, null);
          var xs__9502 = vec__9499__9500;
          var temp__3974__auto____9503 = cljs.core.seq.call(null, xs__9502);
          if(temp__3974__auto____9503) {
            var s__9504 = temp__3974__auto____9503;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9501)) {
              var G__9506 = cljs.core.rest.call(null, s__9504);
              var G__9507 = seen;
              p__9498 = G__9506;
              seen = G__9507;
              continue
            }else {
              return cljs.core.cons.call(null, f__9501, step.call(null, cljs.core.rest.call(null, s__9504), cljs.core.conj.call(null, seen, f__9501)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9505.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9510 = cljs.core.PersistentVector.EMPTY;
  var s__9511 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9511)) {
      var G__9512 = cljs.core.conj.call(null, ret__9510, cljs.core.first.call(null, s__9511));
      var G__9513 = cljs.core.next.call(null, s__9511);
      ret__9510 = G__9512;
      s__9511 = G__9513;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9510)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9516 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9516) {
        return or__3824__auto____9516
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9517 = x.lastIndexOf("/");
      if(i__9517 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9517 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9520 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9520) {
      return or__3824__auto____9520
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9521 = x.lastIndexOf("/");
    if(i__9521 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9521)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9528 = cljs.core.ObjMap.EMPTY;
  var ks__9529 = cljs.core.seq.call(null, keys);
  var vs__9530 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9531 = ks__9529;
      if(and__3822__auto____9531) {
        return vs__9530
      }else {
        return and__3822__auto____9531
      }
    }()) {
      var G__9532 = cljs.core.assoc.call(null, map__9528, cljs.core.first.call(null, ks__9529), cljs.core.first.call(null, vs__9530));
      var G__9533 = cljs.core.next.call(null, ks__9529);
      var G__9534 = cljs.core.next.call(null, vs__9530);
      map__9528 = G__9532;
      ks__9529 = G__9533;
      vs__9530 = G__9534;
      continue
    }else {
      return map__9528
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9537__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9522_SHARP_, p2__9523_SHARP_) {
        return max_key.call(null, k, p1__9522_SHARP_, p2__9523_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9537 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9537__delegate.call(this, k, x, y, more)
    };
    G__9537.cljs$lang$maxFixedArity = 3;
    G__9537.cljs$lang$applyTo = function(arglist__9538) {
      var k = cljs.core.first(arglist__9538);
      var x = cljs.core.first(cljs.core.next(arglist__9538));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9538)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9538)));
      return G__9537__delegate(k, x, y, more)
    };
    G__9537.cljs$lang$arity$variadic = G__9537__delegate;
    return G__9537
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9539__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9535_SHARP_, p2__9536_SHARP_) {
        return min_key.call(null, k, p1__9535_SHARP_, p2__9536_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9539 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9539__delegate.call(this, k, x, y, more)
    };
    G__9539.cljs$lang$maxFixedArity = 3;
    G__9539.cljs$lang$applyTo = function(arglist__9540) {
      var k = cljs.core.first(arglist__9540);
      var x = cljs.core.first(cljs.core.next(arglist__9540));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9540)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9540)));
      return G__9539__delegate(k, x, y, more)
    };
    G__9539.cljs$lang$arity$variadic = G__9539__delegate;
    return G__9539
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9543 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9543) {
        var s__9544 = temp__3974__auto____9543;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9544), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9544)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9547 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9547) {
      var s__9548 = temp__3974__auto____9547;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9548)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9548), take_while.call(null, pred, cljs.core.rest.call(null, s__9548)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9550 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9550.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9562 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9563 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9563)) {
        var vec__9564__9565 = temp__3974__auto____9563;
        var e__9566 = cljs.core.nth.call(null, vec__9564__9565, 0, null);
        var s__9567 = vec__9564__9565;
        if(cljs.core.truth_(include__9562.call(null, e__9566))) {
          return s__9567
        }else {
          return cljs.core.next.call(null, s__9567)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9562, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9568 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9568)) {
      var vec__9569__9570 = temp__3974__auto____9568;
      var e__9571 = cljs.core.nth.call(null, vec__9569__9570, 0, null);
      var s__9572 = vec__9569__9570;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9571)) ? s__9572 : cljs.core.next.call(null, s__9572))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9584 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9585 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9585)) {
        var vec__9586__9587 = temp__3974__auto____9585;
        var e__9588 = cljs.core.nth.call(null, vec__9586__9587, 0, null);
        var s__9589 = vec__9586__9587;
        if(cljs.core.truth_(include__9584.call(null, e__9588))) {
          return s__9589
        }else {
          return cljs.core.next.call(null, s__9589)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9584, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9590 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9590)) {
      var vec__9591__9592 = temp__3974__auto____9590;
      var e__9593 = cljs.core.nth.call(null, vec__9591__9592, 0, null);
      var s__9594 = vec__9591__9592;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9593)) ? s__9594 : cljs.core.next.call(null, s__9594))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9595 = this;
  var h__2220__auto____9596 = this__9595.__hash;
  if(!(h__2220__auto____9596 == null)) {
    return h__2220__auto____9596
  }else {
    var h__2220__auto____9597 = cljs.core.hash_coll.call(null, rng);
    this__9595.__hash = h__2220__auto____9597;
    return h__2220__auto____9597
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9598 = this;
  if(this__9598.step > 0) {
    if(this__9598.start + this__9598.step < this__9598.end) {
      return new cljs.core.Range(this__9598.meta, this__9598.start + this__9598.step, this__9598.end, this__9598.step, null)
    }else {
      return null
    }
  }else {
    if(this__9598.start + this__9598.step > this__9598.end) {
      return new cljs.core.Range(this__9598.meta, this__9598.start + this__9598.step, this__9598.end, this__9598.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9599 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9600 = this;
  var this__9601 = this;
  return cljs.core.pr_str.call(null, this__9601)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9602 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9603 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9604 = this;
  if(this__9604.step > 0) {
    if(this__9604.start < this__9604.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9604.start > this__9604.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9605 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9605.end - this__9605.start) / this__9605.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9606 = this;
  return this__9606.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9607 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9607.meta, this__9607.start + this__9607.step, this__9607.end, this__9607.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9608 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9609 = this;
  return new cljs.core.Range(meta, this__9609.start, this__9609.end, this__9609.step, this__9609.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9610 = this;
  return this__9610.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9611 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9611.start + n * this__9611.step
  }else {
    if(function() {
      var and__3822__auto____9612 = this__9611.start > this__9611.end;
      if(and__3822__auto____9612) {
        return this__9611.step === 0
      }else {
        return and__3822__auto____9612
      }
    }()) {
      return this__9611.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9613 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9613.start + n * this__9613.step
  }else {
    if(function() {
      var and__3822__auto____9614 = this__9613.start > this__9613.end;
      if(and__3822__auto____9614) {
        return this__9613.step === 0
      }else {
        return and__3822__auto____9614
      }
    }()) {
      return this__9613.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9615 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9615.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9618 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9618) {
      var s__9619 = temp__3974__auto____9618;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9619), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9619)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9626 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9626) {
      var s__9627 = temp__3974__auto____9626;
      var fst__9628 = cljs.core.first.call(null, s__9627);
      var fv__9629 = f.call(null, fst__9628);
      var run__9630 = cljs.core.cons.call(null, fst__9628, cljs.core.take_while.call(null, function(p1__9620_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9629, f.call(null, p1__9620_SHARP_))
      }, cljs.core.next.call(null, s__9627)));
      return cljs.core.cons.call(null, run__9630, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9630), s__9627))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9645 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9645) {
        var s__9646 = temp__3971__auto____9645;
        return reductions.call(null, f, cljs.core.first.call(null, s__9646), cljs.core.rest.call(null, s__9646))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9647 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9647) {
        var s__9648 = temp__3974__auto____9647;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9648)), cljs.core.rest.call(null, s__9648))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9651 = null;
      var G__9651__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9651__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9651__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9651__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9651__4 = function() {
        var G__9652__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9652 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9652__delegate.call(this, x, y, z, args)
        };
        G__9652.cljs$lang$maxFixedArity = 3;
        G__9652.cljs$lang$applyTo = function(arglist__9653) {
          var x = cljs.core.first(arglist__9653);
          var y = cljs.core.first(cljs.core.next(arglist__9653));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9653)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9653)));
          return G__9652__delegate(x, y, z, args)
        };
        G__9652.cljs$lang$arity$variadic = G__9652__delegate;
        return G__9652
      }();
      G__9651 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9651__0.call(this);
          case 1:
            return G__9651__1.call(this, x);
          case 2:
            return G__9651__2.call(this, x, y);
          case 3:
            return G__9651__3.call(this, x, y, z);
          default:
            return G__9651__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9651.cljs$lang$maxFixedArity = 3;
      G__9651.cljs$lang$applyTo = G__9651__4.cljs$lang$applyTo;
      return G__9651
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9654 = null;
      var G__9654__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9654__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9654__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9654__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9654__4 = function() {
        var G__9655__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9655 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9655__delegate.call(this, x, y, z, args)
        };
        G__9655.cljs$lang$maxFixedArity = 3;
        G__9655.cljs$lang$applyTo = function(arglist__9656) {
          var x = cljs.core.first(arglist__9656);
          var y = cljs.core.first(cljs.core.next(arglist__9656));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9656)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9656)));
          return G__9655__delegate(x, y, z, args)
        };
        G__9655.cljs$lang$arity$variadic = G__9655__delegate;
        return G__9655
      }();
      G__9654 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9654__0.call(this);
          case 1:
            return G__9654__1.call(this, x);
          case 2:
            return G__9654__2.call(this, x, y);
          case 3:
            return G__9654__3.call(this, x, y, z);
          default:
            return G__9654__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9654.cljs$lang$maxFixedArity = 3;
      G__9654.cljs$lang$applyTo = G__9654__4.cljs$lang$applyTo;
      return G__9654
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9657 = null;
      var G__9657__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9657__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9657__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9657__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9657__4 = function() {
        var G__9658__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9658 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9658__delegate.call(this, x, y, z, args)
        };
        G__9658.cljs$lang$maxFixedArity = 3;
        G__9658.cljs$lang$applyTo = function(arglist__9659) {
          var x = cljs.core.first(arglist__9659);
          var y = cljs.core.first(cljs.core.next(arglist__9659));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9659)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9659)));
          return G__9658__delegate(x, y, z, args)
        };
        G__9658.cljs$lang$arity$variadic = G__9658__delegate;
        return G__9658
      }();
      G__9657 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9657__0.call(this);
          case 1:
            return G__9657__1.call(this, x);
          case 2:
            return G__9657__2.call(this, x, y);
          case 3:
            return G__9657__3.call(this, x, y, z);
          default:
            return G__9657__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9657.cljs$lang$maxFixedArity = 3;
      G__9657.cljs$lang$applyTo = G__9657__4.cljs$lang$applyTo;
      return G__9657
    }()
  };
  var juxt__4 = function() {
    var G__9660__delegate = function(f, g, h, fs) {
      var fs__9650 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9661 = null;
        var G__9661__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9631_SHARP_, p2__9632_SHARP_) {
            return cljs.core.conj.call(null, p1__9631_SHARP_, p2__9632_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9650)
        };
        var G__9661__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9633_SHARP_, p2__9634_SHARP_) {
            return cljs.core.conj.call(null, p1__9633_SHARP_, p2__9634_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9650)
        };
        var G__9661__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9635_SHARP_, p2__9636_SHARP_) {
            return cljs.core.conj.call(null, p1__9635_SHARP_, p2__9636_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9650)
        };
        var G__9661__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9637_SHARP_, p2__9638_SHARP_) {
            return cljs.core.conj.call(null, p1__9637_SHARP_, p2__9638_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9650)
        };
        var G__9661__4 = function() {
          var G__9662__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9639_SHARP_, p2__9640_SHARP_) {
              return cljs.core.conj.call(null, p1__9639_SHARP_, cljs.core.apply.call(null, p2__9640_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9650)
          };
          var G__9662 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9662__delegate.call(this, x, y, z, args)
          };
          G__9662.cljs$lang$maxFixedArity = 3;
          G__9662.cljs$lang$applyTo = function(arglist__9663) {
            var x = cljs.core.first(arglist__9663);
            var y = cljs.core.first(cljs.core.next(arglist__9663));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9663)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9663)));
            return G__9662__delegate(x, y, z, args)
          };
          G__9662.cljs$lang$arity$variadic = G__9662__delegate;
          return G__9662
        }();
        G__9661 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9661__0.call(this);
            case 1:
              return G__9661__1.call(this, x);
            case 2:
              return G__9661__2.call(this, x, y);
            case 3:
              return G__9661__3.call(this, x, y, z);
            default:
              return G__9661__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9661.cljs$lang$maxFixedArity = 3;
        G__9661.cljs$lang$applyTo = G__9661__4.cljs$lang$applyTo;
        return G__9661
      }()
    };
    var G__9660 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9660__delegate.call(this, f, g, h, fs)
    };
    G__9660.cljs$lang$maxFixedArity = 3;
    G__9660.cljs$lang$applyTo = function(arglist__9664) {
      var f = cljs.core.first(arglist__9664);
      var g = cljs.core.first(cljs.core.next(arglist__9664));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9664)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9664)));
      return G__9660__delegate(f, g, h, fs)
    };
    G__9660.cljs$lang$arity$variadic = G__9660__delegate;
    return G__9660
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9667 = cljs.core.next.call(null, coll);
        coll = G__9667;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____9666 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9666) {
          return n > 0
        }else {
          return and__3822__auto____9666
        }
      }())) {
        var G__9668 = n - 1;
        var G__9669 = cljs.core.next.call(null, coll);
        n = G__9668;
        coll = G__9669;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9671 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9671), s)) {
    if(cljs.core.count.call(null, matches__9671) === 1) {
      return cljs.core.first.call(null, matches__9671)
    }else {
      return cljs.core.vec.call(null, matches__9671)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9673 = re.exec(s);
  if(matches__9673 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9673) === 1) {
      return cljs.core.first.call(null, matches__9673)
    }else {
      return cljs.core.vec.call(null, matches__9673)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9678 = cljs.core.re_find.call(null, re, s);
  var match_idx__9679 = s.search(re);
  var match_str__9680 = cljs.core.coll_QMARK_.call(null, match_data__9678) ? cljs.core.first.call(null, match_data__9678) : match_data__9678;
  var post_match__9681 = cljs.core.subs.call(null, s, match_idx__9679 + cljs.core.count.call(null, match_str__9680));
  if(cljs.core.truth_(match_data__9678)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9678, re_seq.call(null, re, post_match__9681))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9688__9689 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9690 = cljs.core.nth.call(null, vec__9688__9689, 0, null);
  var flags__9691 = cljs.core.nth.call(null, vec__9688__9689, 1, null);
  var pattern__9692 = cljs.core.nth.call(null, vec__9688__9689, 2, null);
  return new RegExp(pattern__9692, flags__9691)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9682_SHARP_) {
    return print_one.call(null, p1__9682_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____9702 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9702)) {
            var and__3822__auto____9706 = function() {
              var G__9703__9704 = obj;
              if(G__9703__9704) {
                if(function() {
                  var or__3824__auto____9705 = G__9703__9704.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9705) {
                    return or__3824__auto____9705
                  }else {
                    return G__9703__9704.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9703__9704.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9703__9704)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9703__9704)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9706)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9706
            }
          }else {
            return and__3822__auto____9702
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9707 = !(obj == null);
          if(and__3822__auto____9707) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9707
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9708__9709 = obj;
          if(G__9708__9709) {
            if(function() {
              var or__3824__auto____9710 = G__9708__9709.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9710) {
                return or__3824__auto____9710
              }else {
                return G__9708__9709.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9708__9709.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9708__9709)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9708__9709)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9730 = new goog.string.StringBuffer;
  var G__9731__9732 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9731__9732) {
    var string__9733 = cljs.core.first.call(null, G__9731__9732);
    var G__9731__9734 = G__9731__9732;
    while(true) {
      sb__9730.append(string__9733);
      var temp__3974__auto____9735 = cljs.core.next.call(null, G__9731__9734);
      if(temp__3974__auto____9735) {
        var G__9731__9736 = temp__3974__auto____9735;
        var G__9749 = cljs.core.first.call(null, G__9731__9736);
        var G__9750 = G__9731__9736;
        string__9733 = G__9749;
        G__9731__9734 = G__9750;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9737__9738 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9737__9738) {
    var obj__9739 = cljs.core.first.call(null, G__9737__9738);
    var G__9737__9740 = G__9737__9738;
    while(true) {
      sb__9730.append(" ");
      var G__9741__9742 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9739, opts));
      if(G__9741__9742) {
        var string__9743 = cljs.core.first.call(null, G__9741__9742);
        var G__9741__9744 = G__9741__9742;
        while(true) {
          sb__9730.append(string__9743);
          var temp__3974__auto____9745 = cljs.core.next.call(null, G__9741__9744);
          if(temp__3974__auto____9745) {
            var G__9741__9746 = temp__3974__auto____9745;
            var G__9751 = cljs.core.first.call(null, G__9741__9746);
            var G__9752 = G__9741__9746;
            string__9743 = G__9751;
            G__9741__9744 = G__9752;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9747 = cljs.core.next.call(null, G__9737__9740);
      if(temp__3974__auto____9747) {
        var G__9737__9748 = temp__3974__auto____9747;
        var G__9753 = cljs.core.first.call(null, G__9737__9748);
        var G__9754 = G__9737__9748;
        obj__9739 = G__9753;
        G__9737__9740 = G__9754;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9730
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9756 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9756.append("\n");
  return[cljs.core.str(sb__9756)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9775__9776 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9775__9776) {
    var string__9777 = cljs.core.first.call(null, G__9775__9776);
    var G__9775__9778 = G__9775__9776;
    while(true) {
      cljs.core.string_print.call(null, string__9777);
      var temp__3974__auto____9779 = cljs.core.next.call(null, G__9775__9778);
      if(temp__3974__auto____9779) {
        var G__9775__9780 = temp__3974__auto____9779;
        var G__9793 = cljs.core.first.call(null, G__9775__9780);
        var G__9794 = G__9775__9780;
        string__9777 = G__9793;
        G__9775__9778 = G__9794;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9781__9782 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9781__9782) {
    var obj__9783 = cljs.core.first.call(null, G__9781__9782);
    var G__9781__9784 = G__9781__9782;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9785__9786 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9783, opts));
      if(G__9785__9786) {
        var string__9787 = cljs.core.first.call(null, G__9785__9786);
        var G__9785__9788 = G__9785__9786;
        while(true) {
          cljs.core.string_print.call(null, string__9787);
          var temp__3974__auto____9789 = cljs.core.next.call(null, G__9785__9788);
          if(temp__3974__auto____9789) {
            var G__9785__9790 = temp__3974__auto____9789;
            var G__9795 = cljs.core.first.call(null, G__9785__9790);
            var G__9796 = G__9785__9790;
            string__9787 = G__9795;
            G__9785__9788 = G__9796;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9791 = cljs.core.next.call(null, G__9781__9784);
      if(temp__3974__auto____9791) {
        var G__9781__9792 = temp__3974__auto____9791;
        var G__9797 = cljs.core.first.call(null, G__9781__9792);
        var G__9798 = G__9781__9792;
        obj__9783 = G__9797;
        G__9781__9784 = G__9798;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9799) {
    var objs = cljs.core.seq(arglist__9799);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9800) {
    var objs = cljs.core.seq(arglist__9800);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9801) {
    var objs = cljs.core.seq(arglist__9801);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9802) {
    var objs = cljs.core.seq(arglist__9802);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9803) {
    var objs = cljs.core.seq(arglist__9803);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9804) {
    var objs = cljs.core.seq(arglist__9804);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9805) {
    var objs = cljs.core.seq(arglist__9805);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9806) {
    var objs = cljs.core.seq(arglist__9806);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9807) {
    var fmt = cljs.core.first(arglist__9807);
    var args = cljs.core.rest(arglist__9807);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9808 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9808, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9809 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9809, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9810 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9810, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9811 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9811)) {
        var nspc__9812 = temp__3974__auto____9811;
        return[cljs.core.str(nspc__9812), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9813 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9813)) {
          var nspc__9814 = temp__3974__auto____9813;
          return[cljs.core.str(nspc__9814), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9815 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9815, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9817 = function(n, len) {
    var ns__9816 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9816) < len) {
        var G__9819 = [cljs.core.str("0"), cljs.core.str(ns__9816)].join("");
        ns__9816 = G__9819;
        continue
      }else {
        return ns__9816
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9817.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9817.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9817.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9817.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9817.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9817.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9818 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9818, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9820 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9821 = this;
  var G__9822__9823 = cljs.core.seq.call(null, this__9821.watches);
  if(G__9822__9823) {
    var G__9825__9827 = cljs.core.first.call(null, G__9822__9823);
    var vec__9826__9828 = G__9825__9827;
    var key__9829 = cljs.core.nth.call(null, vec__9826__9828, 0, null);
    var f__9830 = cljs.core.nth.call(null, vec__9826__9828, 1, null);
    var G__9822__9831 = G__9822__9823;
    var G__9825__9832 = G__9825__9827;
    var G__9822__9833 = G__9822__9831;
    while(true) {
      var vec__9834__9835 = G__9825__9832;
      var key__9836 = cljs.core.nth.call(null, vec__9834__9835, 0, null);
      var f__9837 = cljs.core.nth.call(null, vec__9834__9835, 1, null);
      var G__9822__9838 = G__9822__9833;
      f__9837.call(null, key__9836, this$, oldval, newval);
      var temp__3974__auto____9839 = cljs.core.next.call(null, G__9822__9838);
      if(temp__3974__auto____9839) {
        var G__9822__9840 = temp__3974__auto____9839;
        var G__9847 = cljs.core.first.call(null, G__9822__9840);
        var G__9848 = G__9822__9840;
        G__9825__9832 = G__9847;
        G__9822__9833 = G__9848;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9841 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9841.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9842 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9842.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9843 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9843.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9844 = this;
  return this__9844.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9845 = this;
  return this__9845.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9846 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9860__delegate = function(x, p__9849) {
      var map__9855__9856 = p__9849;
      var map__9855__9857 = cljs.core.seq_QMARK_.call(null, map__9855__9856) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9855__9856) : map__9855__9856;
      var validator__9858 = cljs.core._lookup.call(null, map__9855__9857, "\ufdd0'validator", null);
      var meta__9859 = cljs.core._lookup.call(null, map__9855__9857, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9859, validator__9858, null)
    };
    var G__9860 = function(x, var_args) {
      var p__9849 = null;
      if(goog.isDef(var_args)) {
        p__9849 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9860__delegate.call(this, x, p__9849)
    };
    G__9860.cljs$lang$maxFixedArity = 1;
    G__9860.cljs$lang$applyTo = function(arglist__9861) {
      var x = cljs.core.first(arglist__9861);
      var p__9849 = cljs.core.rest(arglist__9861);
      return G__9860__delegate(x, p__9849)
    };
    G__9860.cljs$lang$arity$variadic = G__9860__delegate;
    return G__9860
  }();
  atom = function(x, var_args) {
    var p__9849 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____9865 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9865)) {
    var validate__9866 = temp__3974__auto____9865;
    if(cljs.core.truth_(validate__9866.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9867 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9867, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9868__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9868 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9868__delegate.call(this, a, f, x, y, z, more)
    };
    G__9868.cljs$lang$maxFixedArity = 5;
    G__9868.cljs$lang$applyTo = function(arglist__9869) {
      var a = cljs.core.first(arglist__9869);
      var f = cljs.core.first(cljs.core.next(arglist__9869));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9869)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9869))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9869)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9869)))));
      return G__9868__delegate(a, f, x, y, z, more)
    };
    G__9868.cljs$lang$arity$variadic = G__9868__delegate;
    return G__9868
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9870) {
    var iref = cljs.core.first(arglist__9870);
    var f = cljs.core.first(cljs.core.next(arglist__9870));
    var args = cljs.core.rest(cljs.core.next(arglist__9870));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9871 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9871.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9872 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9872.state, function(p__9873) {
    var map__9874__9875 = p__9873;
    var map__9874__9876 = cljs.core.seq_QMARK_.call(null, map__9874__9875) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9874__9875) : map__9874__9875;
    var curr_state__9877 = map__9874__9876;
    var done__9878 = cljs.core._lookup.call(null, map__9874__9876, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9878)) {
      return curr_state__9877
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9872.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9899__9900 = options;
    var map__9899__9901 = cljs.core.seq_QMARK_.call(null, map__9899__9900) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9899__9900) : map__9899__9900;
    var keywordize_keys__9902 = cljs.core._lookup.call(null, map__9899__9901, "\ufdd0'keywordize-keys", null);
    var keyfn__9903 = cljs.core.truth_(keywordize_keys__9902) ? cljs.core.keyword : cljs.core.str;
    var f__9918 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2490__auto____9917 = function iter__9911(s__9912) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9912__9915 = s__9912;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9912__9915)) {
                        var k__9916 = cljs.core.first.call(null, s__9912__9915);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9903.call(null, k__9916), thisfn.call(null, x[k__9916])], true), iter__9911.call(null, cljs.core.rest.call(null, s__9912__9915)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2490__auto____9917.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9918.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9919) {
    var x = cljs.core.first(arglist__9919);
    var options = cljs.core.rest(arglist__9919);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9924 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9928__delegate = function(args) {
      var temp__3971__auto____9925 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9924), args, null);
      if(cljs.core.truth_(temp__3971__auto____9925)) {
        var v__9926 = temp__3971__auto____9925;
        return v__9926
      }else {
        var ret__9927 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9924, cljs.core.assoc, args, ret__9927);
        return ret__9927
      }
    };
    var G__9928 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9928__delegate.call(this, args)
    };
    G__9928.cljs$lang$maxFixedArity = 0;
    G__9928.cljs$lang$applyTo = function(arglist__9929) {
      var args = cljs.core.seq(arglist__9929);
      return G__9928__delegate(args)
    };
    G__9928.cljs$lang$arity$variadic = G__9928__delegate;
    return G__9928
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9931 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9931)) {
        var G__9932 = ret__9931;
        f = G__9932;
        continue
      }else {
        return ret__9931
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9933__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9933 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9933__delegate.call(this, f, args)
    };
    G__9933.cljs$lang$maxFixedArity = 1;
    G__9933.cljs$lang$applyTo = function(arglist__9934) {
      var f = cljs.core.first(arglist__9934);
      var args = cljs.core.rest(arglist__9934);
      return G__9933__delegate(f, args)
    };
    G__9933.cljs$lang$arity$variadic = G__9933__delegate;
    return G__9933
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9936 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9936, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9936, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9945 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9945) {
      return or__3824__auto____9945
    }else {
      var or__3824__auto____9946 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9946) {
        return or__3824__auto____9946
      }else {
        var and__3822__auto____9947 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9947) {
          var and__3822__auto____9948 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9948) {
            var and__3822__auto____9949 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9949) {
              var ret__9950 = true;
              var i__9951 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9952 = cljs.core.not.call(null, ret__9950);
                  if(or__3824__auto____9952) {
                    return or__3824__auto____9952
                  }else {
                    return i__9951 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9950
                }else {
                  var G__9953 = isa_QMARK_.call(null, h, child.call(null, i__9951), parent.call(null, i__9951));
                  var G__9954 = i__9951 + 1;
                  ret__9950 = G__9953;
                  i__9951 = G__9954;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9949
            }
          }else {
            return and__3822__auto____9948
          }
        }else {
          return and__3822__auto____9947
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__9963 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9964 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9965 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9966 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9967 = cljs.core.contains_QMARK_.call(null, tp__9963.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9965.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9965.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9963, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9966.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9964, parent, ta__9965), "\ufdd0'descendants":tf__9966.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9965, tag, td__9964)})
    }();
    if(cljs.core.truth_(or__3824__auto____9967)) {
      return or__3824__auto____9967
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9972 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9973 = cljs.core.truth_(parentMap__9972.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9972.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9974 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9973)) ? cljs.core.assoc.call(null, parentMap__9972, tag, childsParents__9973) : cljs.core.dissoc.call(null, parentMap__9972, tag);
    var deriv_seq__9975 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9955_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9955_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9955_SHARP_), cljs.core.second.call(null, p1__9955_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9974)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9972.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9956_SHARP_, p2__9957_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9956_SHARP_, p2__9957_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9975))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9983 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9985 = cljs.core.truth_(function() {
    var and__3822__auto____9984 = xprefs__9983;
    if(cljs.core.truth_(and__3822__auto____9984)) {
      return xprefs__9983.call(null, y)
    }else {
      return and__3822__auto____9984
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9985)) {
    return or__3824__auto____9985
  }else {
    var or__3824__auto____9987 = function() {
      var ps__9986 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9986) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9986), prefer_table))) {
          }else {
          }
          var G__9990 = cljs.core.rest.call(null, ps__9986);
          ps__9986 = G__9990;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9987)) {
      return or__3824__auto____9987
    }else {
      var or__3824__auto____9989 = function() {
        var ps__9988 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9988) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9988), y, prefer_table))) {
            }else {
            }
            var G__9991 = cljs.core.rest.call(null, ps__9988);
            ps__9988 = G__9991;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9989)) {
        return or__3824__auto____9989
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9993 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9993)) {
    return or__3824__auto____9993
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10011 = cljs.core.reduce.call(null, function(be, p__10003) {
    var vec__10004__10005 = p__10003;
    var k__10006 = cljs.core.nth.call(null, vec__10004__10005, 0, null);
    var ___10007 = cljs.core.nth.call(null, vec__10004__10005, 1, null);
    var e__10008 = vec__10004__10005;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10006)) {
      var be2__10010 = cljs.core.truth_(function() {
        var or__3824__auto____10009 = be == null;
        if(or__3824__auto____10009) {
          return or__3824__auto____10009
        }else {
          return cljs.core.dominates.call(null, k__10006, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10008 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10010), k__10006, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10006), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10010)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10010
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10011)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10011));
      return cljs.core.second.call(null, best_entry__10011)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10016 = mf;
    if(and__3822__auto____10016) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10016
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2391__auto____10017 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10018 = cljs.core._reset[goog.typeOf(x__2391__auto____10017)];
      if(or__3824__auto____10018) {
        return or__3824__auto____10018
      }else {
        var or__3824__auto____10019 = cljs.core._reset["_"];
        if(or__3824__auto____10019) {
          return or__3824__auto____10019
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10024 = mf;
    if(and__3822__auto____10024) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10024
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2391__auto____10025 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10026 = cljs.core._add_method[goog.typeOf(x__2391__auto____10025)];
      if(or__3824__auto____10026) {
        return or__3824__auto____10026
      }else {
        var or__3824__auto____10027 = cljs.core._add_method["_"];
        if(or__3824__auto____10027) {
          return or__3824__auto____10027
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10032 = mf;
    if(and__3822__auto____10032) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10032
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10033 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10034 = cljs.core._remove_method[goog.typeOf(x__2391__auto____10033)];
      if(or__3824__auto____10034) {
        return or__3824__auto____10034
      }else {
        var or__3824__auto____10035 = cljs.core._remove_method["_"];
        if(or__3824__auto____10035) {
          return or__3824__auto____10035
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10040 = mf;
    if(and__3822__auto____10040) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10040
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2391__auto____10041 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10042 = cljs.core._prefer_method[goog.typeOf(x__2391__auto____10041)];
      if(or__3824__auto____10042) {
        return or__3824__auto____10042
      }else {
        var or__3824__auto____10043 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10043) {
          return or__3824__auto____10043
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10048 = mf;
    if(and__3822__auto____10048) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10048
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10049 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10050 = cljs.core._get_method[goog.typeOf(x__2391__auto____10049)];
      if(or__3824__auto____10050) {
        return or__3824__auto____10050
      }else {
        var or__3824__auto____10051 = cljs.core._get_method["_"];
        if(or__3824__auto____10051) {
          return or__3824__auto____10051
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10056 = mf;
    if(and__3822__auto____10056) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10056
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2391__auto____10057 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10058 = cljs.core._methods[goog.typeOf(x__2391__auto____10057)];
      if(or__3824__auto____10058) {
        return or__3824__auto____10058
      }else {
        var or__3824__auto____10059 = cljs.core._methods["_"];
        if(or__3824__auto____10059) {
          return or__3824__auto____10059
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10064 = mf;
    if(and__3822__auto____10064) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10064
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2391__auto____10065 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10066 = cljs.core._prefers[goog.typeOf(x__2391__auto____10065)];
      if(or__3824__auto____10066) {
        return or__3824__auto____10066
      }else {
        var or__3824__auto____10067 = cljs.core._prefers["_"];
        if(or__3824__auto____10067) {
          return or__3824__auto____10067
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10072 = mf;
    if(and__3822__auto____10072) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10072
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2391__auto____10073 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10074 = cljs.core._dispatch[goog.typeOf(x__2391__auto____10073)];
      if(or__3824__auto____10074) {
        return or__3824__auto____10074
      }else {
        var or__3824__auto____10075 = cljs.core._dispatch["_"];
        if(or__3824__auto____10075) {
          return or__3824__auto____10075
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10078 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10079 = cljs.core._get_method.call(null, mf, dispatch_val__10078);
  if(cljs.core.truth_(target_fn__10079)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10078)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10079, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10080 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10081 = this;
  cljs.core.swap_BANG_.call(null, this__10081.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10081.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10081.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10081.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10082 = this;
  cljs.core.swap_BANG_.call(null, this__10082.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10082.method_cache, this__10082.method_table, this__10082.cached_hierarchy, this__10082.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10083 = this;
  cljs.core.swap_BANG_.call(null, this__10083.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10083.method_cache, this__10083.method_table, this__10083.cached_hierarchy, this__10083.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10084 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10084.cached_hierarchy), cljs.core.deref.call(null, this__10084.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10084.method_cache, this__10084.method_table, this__10084.cached_hierarchy, this__10084.hierarchy)
  }
  var temp__3971__auto____10085 = cljs.core.deref.call(null, this__10084.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10085)) {
    var target_fn__10086 = temp__3971__auto____10085;
    return target_fn__10086
  }else {
    var temp__3971__auto____10087 = cljs.core.find_and_cache_best_method.call(null, this__10084.name, dispatch_val, this__10084.hierarchy, this__10084.method_table, this__10084.prefer_table, this__10084.method_cache, this__10084.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10087)) {
      var target_fn__10088 = temp__3971__auto____10087;
      return target_fn__10088
    }else {
      return cljs.core.deref.call(null, this__10084.method_table).call(null, this__10084.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10089 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10089.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10089.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10089.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10089.method_cache, this__10089.method_table, this__10089.cached_hierarchy, this__10089.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10090 = this;
  return cljs.core.deref.call(null, this__10090.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10091 = this;
  return cljs.core.deref.call(null, this__10091.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10092 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10092.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10094__delegate = function(_, args) {
    var self__10093 = this;
    return cljs.core._dispatch.call(null, self__10093, args)
  };
  var G__10094 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10094__delegate.call(this, _, args)
  };
  G__10094.cljs$lang$maxFixedArity = 1;
  G__10094.cljs$lang$applyTo = function(arglist__10095) {
    var _ = cljs.core.first(arglist__10095);
    var args = cljs.core.rest(arglist__10095);
    return G__10094__delegate(_, args)
  };
  G__10094.cljs$lang$arity$variadic = G__10094__delegate;
  return G__10094
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10096 = this;
  return cljs.core._dispatch.call(null, self__10096, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10097 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10099, _) {
  var this__10098 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10098.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10100 = this;
  var and__3822__auto____10101 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10101) {
    return this__10100.uuid === other.uuid
  }else {
    return and__3822__auto____10101
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10102 = this;
  var this__10103 = this;
  return cljs.core.pr_str.call(null, this__10103)
};
cljs.core.UUID;
goog.provide("client.const$");
goog.require("cljs.core");
client.const$.maps = cljs.core.ObjMap.fromObject(["\ufdd0'country", "\ufdd0'overlay_id", "\ufdd0'map_id"], {"\ufdd0'country":"Germany", "\ufdd0'overlay_id":"animation_overlay", "\ufdd0'map_id":"map_canvas"});
client.const$.push = cljs.core.ObjMap.fromObject(["\ufdd0'bus_name", "\ufdd0'server_address"], {"\ufdd0'bus_name":"browser.tcp", "\ufdd0'server_address":"http://localhost:8081/eventbus"});
goog.provide("client.utils");
goog.require("cljs.core");
client.utils.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.call(null, cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__6137) {
    var args = cljs.core.seq(arglist__6137);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
client.utils.log_obj = function log_obj(obj) {
  return console.log(obj)
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("jc");
(function(ab, z) {
  var ad = [], ai = Math, f = ai.PI, v = f * 2, X = 0, S = 0, N = false, ae = false, V = /[A-z]+?/, Q = /\d.\w\w/, a = ab.navigator.userAgent.match(/Firefox\/\w+\.\w+/i), E = 180 / f, U = ai.max, i = ai.min, y = ai.cos, L = ai.sin, O = ai.floor, p = ai.round, Z = ai.abs, Y = ai.pow, ap = ai.sqrt, M = 1E3 / 60, c = function() {
    return ab.requestAnimationFrame || ab.webkitRequestAnimationFrame || ab.mozRequestAnimationFrame || ab.oRequestAnimationFrame || ab.msRequestAnimationFrame || function(ar, m) {
      return setTimeout(ar, M)
    }
  }(), I = function() {
    return ab.cancelAnimationFrame || ab.webkitCancelRequestAnimationFrame || ab.mozCancelRequestAnimationFrame || ab.oCancelRequestAnimationFrame || ab.msCancelRequestAnimationFrame || clearTimeout
  }();
  if(a != "" && a !== null) {
    var A = parseInt(a[0].split(/[ \/\.]/i)[1]) < 7
  }
  function ah(au, ar, aw) {
    var ax = ad[au].layers[ar].objs, ay = ad[au].layers[ar].grdntsnptrns, at = ax.length, av = ay.length;
    aw = aw.slice(1);
    for(var m = 0;m < at;m++) {
      if(ax[m].optns.id == aw) {
        return ax[m]
      }
    }
    for(m = 0;m < av;m++) {
      if(ay[m].optns.id == aw) {
        return ay[m]
      }
    }
    return false
  }
  function al(at, ar, au, av) {
    var ax = ad[at].layers[ar].objs, ay = ad[at].layers[ar].grdntsnptrns, m = av.slice(1).split(".");
    aw(au, m, ax);
    aw(au, m, ay);
    return au;
    function aw(aH, aC, aD) {
      var aE = aD.length, aF, aA, aB, az;
      for(aB = 0;aB < aE;aB++) {
        aF = aD[aB]._name.split(" ");
        if(aC.length > aF.length) {
          continue
        }
        var aG = aC.concat();
        for(aA = 0;aA < aF.length;aA++) {
          for(az = 0;az < aG.length;az++) {
            if(aF[aA] === aG[az]) {
              aG.splice(az, 1);
              az--;
              continue
            }
          }
          if(!aG.length) {
            aH.elements.push(aD[aB]);
            break
          }
        }
      }
    }
  }
  function B(au, ar, av) {
    var ax = ad[au].layers[ar].objs, ay = ad[au].layers[ar].grdntsnptrns, at = ax.length, aw = ay.length;
    for(var m = 0;m < at;m++) {
      av.elements.push(ax[m])
    }
    for(m = 0;m < aw;m++) {
      av.elements.push(ay[m])
    }
    return av
  }
  var P = function(aD, m) {
    if(aD === z) {
      return this
    }
    if(typeof aD == "object") {
      m = aD;
      aD = z
    }
    var aC = -1, au = -1, ar = ad.length, aB = G(), ay, av, at, az, ax, aw, aA;
    if(m === z) {
      if(aD.charAt(0) === "#") {
        for(ay = 0;ay < ar;ay++) {
          aA = ad[ay].layers.length;
          for(av = 0;av < aA;av++) {
            aw = ah(ay, av, aD);
            if(aw) {
              return aw
            }
          }
        }
      }
      if(aD.charAt(0) === ".") {
        for(ay = 0;ay < ar;ay++) {
          aA = ad[ay].layers.length;
          for(av = 0;av < aA;av++) {
            aB = al(ay, av, aB, aD)
          }
        }
      }
    }else {
      if(m.canvas !== z) {
        for(ay = 0;ay < ar;ay++) {
          if(ad[ay].optns.id == m.canvas) {
            aC = ay;
            at = ad[ay];
            break
          }
        }
      }
      if(m.layer !== z) {
        if(aC != -1) {
          aA = at.layers.length;
          for(ay = 0;ay < aA;ay++) {
            if(at.layers[ay].optns.id == m.layer) {
              au = ay;
              az = at.layers[ay];
              break
            }
          }
        }else {
          for(ay = 0;ay < ar;ay++) {
            ax = ad[ay].layers;
            aA = ax.length;
            for(av = 0;av < aA;av++) {
              if(ax[av].optns.id == m.layer) {
                aC = ay;
                au = av;
                at = ad[ay];
                az = at.layers[av];
                break
              }
            }
            if(az > -1) {
              break
            }
          }
        }
      }
      if(au < 0 && aC < 0) {
        return G()
      }
      if(au < 0) {
        ax = at.layers;
        aA = ax.length;
        if(aD === z) {
          for(av = 0;av < aA;av++) {
            aB = B(aC, av, aB)
          }
        }else {
          if(aD.charAt(0) === "#") {
            for(av = 0;av < aA;av++) {
              aw = ah(aC, av, aD);
              if(aw) {
                return aw
              }
            }
          }else {
            if(aD.charAt(0) === ".") {
              for(av = 0;av < aA;av++) {
                aB = al(aC, av, aB, aD)
              }
            }
          }
        }
      }else {
        if(aD === z) {
          aB = B(aC, au, aB)
        }
        if(aD.charAt(0) === "#") {
          return ah(aC, au, aD)
        }
        if(aD.charAt(0) === ".") {
          aB = al(aC, au, aB, aD)
        }
      }
    }
    if(m !== z) {
      if(m.attrs !== z || m.fns !== z) {
        return aB.find(m)
      }
    }
    if(aB.elements.length) {
      return aB
    }
    return G()
  };
  function k(ar) {
    var m = ar.optns;
    ar.matrix(o(o(o(m.transformMatrix, m.translateMatrix), m.scaleMatrix), m.rotateMatrix));
    j(ar)
  }
  function af(m, at) {
    for(var ar in at) {
      if(m[ar] === z) {
        m[ar] = at[ar]
      }
    }
    return m
  }
  function j(m) {
    D(m).optns.redraw = 1
  }
  function F(av) {
    var ar = av.timeDiff, m = 1;
    for(var at = 0;at < this.animateQueue.length;at++) {
      var ay = this.animateQueue[at], ax = ay.duration, az = ay.easing, aw = ay.step, aA = ay.onstep, au = az.type == "in" || az.type == "inOut" && m < 0.5, aD = az.type == "out" || az.type == "inOut" && m > 0.5;
      ay.step += ar;
      m = aw / ax;
      for(var aF in ay) {
        if(this[aF] !== z && ay[aF]) {
          var aE = ay[aF], aC = aE.to, aB = aE.from;
          H(aF, this, ay);
          if(au) {
            this[aF] = (aC - aB) * h[az.fn](m, az) + aB
          }
          if(aD) {
            this[aF] = (aC - aB) * (1 - h[az.fn](1 - m, az)) + aB
          }
          if(aA) {
            aA.fn.call(this, aA)
          }
          if(aw >= ax) {
            this[aF] = aC;
            H(aF, this, ay);
            ay[aF] = false;
            ay.animateKeyCount--;
            if(!ay.animateKeyCount) {
              if(ay.animateFn) {
                ay.animateFn.apply(this)
              }
              this.animateQueue.splice(at, 1);
              at--
            }
          }
        }
      }
    }
    if(this.animateQueue.length) {
      j(this)
    }else {
      this.optns.animated = false
    }
    return this
  }
  function H(at, ar, m) {
    var av = ar[at];
    var au = m[at]["prev"];
    switch(at) {
      case "_rotateAngle":
        ar.rotate(av - au, ar._rotateX, ar._rotateY);
        break;
      case "_translateX":
        ar.translate(av - au, 0);
        break;
      case "_translateY":
        ar.translate(0, av - au);
        break;
      case "_translateToX":
        ar.translateTo(av, z);
        break;
      case "_translateToY":
        ar.translateTo(z, av);
        break;
      case "_scaleX":
        if(!au) {
          au = 1
        }
        ar.scale(av / au, 1);
        break;
      case "_scaleY":
        if(!au) {
          au = 1
        }
        ar.scale(1, av / au);
        break;
      default:
        return
    }
    m[at]["prev"] = av
  }
  function ag(at, ar, m) {
    at = at || ab.event;
    m[ar].event = at;
    m[ar].code = at.charCode || at.keyCode;
    m[ar].val = true;
    m.redraw = 1
  }
  function u(au, at, ar) {
    if(!ar[at].val) {
      return
    }
    au = au || ab.event;
    var m = {pageX:au.pageX || au.clientX, pageY:au.pageY || au.clientY};
    ar[at].event = au;
    ar[at].x = m.pageX - ar.x;
    ar[at].y = m.pageY - ar.y;
    ar.redraw = 1
  }
  function x(ar, m) {
    if(ar === z) {
      this["on" + m]()
    }else {
      this["on" + m] = ar
    }
    if(m == "mouseover" || m == "mouseout") {
      m = "mousemove"
    }
    D(this).optns[m].val = true;
    return this
  }
  function ao(ar, m) {
    if(ar === z) {
      this[m]()
    }else {
      this[m] = ar
    }
    return this
  }
  var h = {linear:function(m, ar) {
    return m
  }, exp:function(m, ar) {
    var at = ar.n || 2;
    return Y(m, at)
  }, circ:function(m, ar) {
    return 1 - ap(1 - m * m)
  }, sine:function(m, ar) {
    return 1 - L((1 - m) * f / 2)
  }, back:function(ar, at) {
    var au = at.n || 2;
    var m = at.x || 1.5;
    return Y(ar, au) * ((m + 1) * ar - m)
  }, elastic:function(av, aw) {
    var ax = aw.n || 2;
    var at = aw.m || 20;
    var au = aw.k || 3;
    var ar = aw.x || 1.5;
    return Y(ax, 10 * (av - 1)) * y(at * av * f * ar / au)
  }, bounce:function(at, aw) {
    var ax = aw.n || 4;
    var ar = aw.b || 0.25;
    var av = [1];
    for(var au = 1;au < ax;au++) {
      av[au] = av[au - 1] + Y(ar, au / 2)
    }
    var m = 2 * av[ax - 1] - 1;
    for(au = 0;au < ax;au++) {
      if(m * at >= (au > 0 ? 2 * av[au - 1] - 1 : 0) && m * at <= 2 * av[au] - 1) {
        return Y(m * (at - (2 * av[au] - 1 - Y(ar, au / 2)) / m), 2) + 1 - Y(ar, au)
      }
    }
    return 1
  }}, g = {color:{fn:function(ax, m, at, aw) {
    var ar, av, au;
    at = at[aw];
    for(av = 0;av < ax;av++) {
      for(au = 0;au < m;au++) {
        ar = this.getPixel(av, au);
        ar[at[0]] = ar[at[0]] * 2 - ar[at[1]] - ar[at[2]];
        ar[at[1]] = 0;
        ar[at[2]] = 0;
        ar[at[0]] = ar[at[0]] > 255 ? 255 : ar[at[0]];
        this.setPixel(av, au, ar)
      }
    }
  }, matrix:{red:[0, 1, 2], green:[1, 0, 2], blue:[2, 0, 1]}}, linear:{fn:function(ar, aC, aA, az) {
    var aB = [], au, ay, ax, aw, av, at;
    aA = aA[az];
    av = aA.length;
    at = aA[0].length;
    for(ay = 0;ay < ar;ay++) {
      aB[ay] = [];
      for(ax = 0;ax < aC;ax++) {
        aB[ay][ax] = [0, 0, 0, 1];
        for(av = 0;av < 3;av++) {
          for(at = 0;at < 3;at++) {
            au = this.getPixel(ay - parseInt(av / 2), ax - parseInt(at / 2));
            for(aw = 0;aw < 3;aw++) {
              aB[ay][ax][aw] += au[aw] * aA[av][at]
            }
          }
        }
      }
    }
    for(ay = 0;ay < ar;ay++) {
      for(ax = 0;ax < aC;ax++) {
        this.setPixel(ay, ax, aB[ay][ax])
      }
    }
  }, matrix:{sharp:[[-0.375, -0.375, -0.375], [-0.375, 4, -0.375], [-0.375, -0.375, -0.375]], blur:[[0.111, 0.111, 0.111], [0.111, 0.111, 0.111], [0.111, 0.111, 0.111]]}}};
  function o(ar, m) {
    return[[ar[0][0] * m[0][0] + ar[0][1] * m[1][0], ar[0][0] * m[0][1] + ar[0][1] * m[1][1], ar[0][0] * m[0][2] + ar[0][1] * m[1][2] + ar[0][2]], [ar[1][0] * m[0][0] + ar[1][1] * m[1][0], ar[1][0] * m[0][1] + ar[1][1] * m[1][1], ar[1][0] * m[0][2] + ar[1][1] * m[1][2] + ar[1][2]]]
  }
  function t(at, au, ar) {
    return{x:at * ar[0][0] + au * ar[0][1] + ar[0][2], y:at * ar[1][0] + au * ar[1][1] + ar[1][2]}
  }
  function ac(at, au, ar) {
    return{x:(at * ar[1][1] - au * ar[0][1] + ar[0][1] * ar[1][2] - ar[1][1] * ar[0][2]) / (ar[0][0] * ar[1][1] - ar[1][0] * ar[0][1]), y:(-at * ar[1][0] + au * ar[0][0] - ar[0][0] * ar[1][2] + ar[1][0] * ar[0][2]) / (ar[0][0] * ar[1][1] - ar[1][0] * ar[0][1])}
  }
  function b(aA, aF, aE) {
    if(aE == "poor") {
      return aF
    }
    var aB = {x:aF.x, y:aF.y}, aG = {x:aF.x + aF.width, y:aF.y + aF.height}, ax = o(aA.matrix(), aj(aA).matrix()), aC = t(aB.x, aB.y, ax), az = t(aG.x, aB.y, ax), av = t(aB.x, aG.y, ax), au = t(aG.x, aG.y, ax), aH = [[aC.x, aC.y], [az.x, az.y], [av.x, av.y], [au.x, au.y]];
    if(aE == "coords") {
      return aH
    }
    var ay, aw, at = ay = aC.x, ar = aw = aC.y;
    for(var aD = 0;aD < 4;aD++) {
      if(at < aH[aD][0]) {
        at = aH[aD][0]
      }
      if(ar < aH[aD][1]) {
        ar = aH[aD][1]
      }
      if(ay > aH[aD][0]) {
        ay = aH[aD][0]
      }
      if(aw > aH[aD][1]) {
        aw = aH[aD][1]
      }
    }
    return{x:ay, y:aw, width:at - ay, height:ar - aw}
  }
  function R(ar, m, at) {
    if(at == "poor") {
      return m
    }
    return t(m.x, m.y, o(ar.matrix(), aj(ar).matrix()))
  }
  function s(au) {
    var aw = {color:{val:au, notColor:z}, r:0, g:0, b:0, a:1};
    if(au.id !== z) {
      aw.color.notColor = {level:au._level, canvas:au.optns.canvas.number, layer:au.optns.layer.number};
      return aw
    }
    if(au.r !== z) {
      aw = af(au, {r:0, g:0, b:0, a:1});
      aw.color = {val:"rgba(" + aw.r + "," + aw.g + "," + aw.b + "," + aw.a + ")", notColor:z};
      return aw
    }
    if(au.charAt(0) == "#") {
      if(au.length > 4) {
        aw.r = parseInt(au.substr(1, 2), 16);
        aw.g = parseInt(au.substr(3, 2), 16);
        aw.b = parseInt(au.substr(5, 2), 16)
      }else {
        var m = au.charAt(1), ay = au.charAt(2), az = au.charAt(3);
        aw.r = parseInt(m + m, 16);
        aw.g = parseInt(ay + ay, 16);
        aw.b = parseInt(az + az, 16)
      }
    }else {
      var ax = au.split(",");
      if(ax.length == 4) {
        var av = ax[0].split("(");
        var at = ax[3].split(")");
        aw.r = parseInt(av[1]);
        aw.g = parseInt(ax[1]);
        aw.b = parseInt(ax[2]);
        aw.a = parseFloat(at[0])
      }
      if(ax.length == 3) {
        av = ax[0].split("(");
        var ar = ax[2].split(")");
        aw.r = parseInt(av[1]);
        aw.g = parseInt(ax[1]);
        aw.b = parseInt(ar[0])
      }
    }
    aw.color.notColor = z;
    return aw
  }
  function C(m) {
    if(m.getBoundingClientRect) {
      return r(m)
    }else {
      return aq(m)
    }
  }
  function aq(m) {
    var at = 0, ar = 0;
    while(m) {
      at = at + parseInt(m.offsetTop);
      ar = ar + parseInt(m.offsetLeft);
      m = m.offsetParent
    }
    return{top:at, left:ar}
  }
  function r(au) {
    var ax = au.getBoundingClientRect();
    var ay = document.body || {};
    var ar = document.documentElement;
    var m = ab.pageYOffset || ar.scrollTop || ay.scrollTop;
    var av = ab.pageXOffset || ar.scrollLeft || ay.scrollLeft;
    var aw = ar.clientTop || ay.clientTop || 0;
    var az = ar.clientLeft || ay.clientLeft || 0;
    var aA = ax.top + m - aw;
    var at = ax.left + av - az;
    return{top:p(aA), left:p(at)}
  }
  function ak(ar, m) {
    q(ar, m);
    am(ar, m)
  }
  function am(ar, m) {
    if(!ar.optns.focused) {
      return
    }
    if(m.keyDown.val != false) {
      if(typeof ar.onkeydown == "function") {
        ar.onkeydown(m.keyDown)
      }
    }
    if(m.keyUp.val != false) {
      if(typeof ar.onkeyup == "function") {
        ar.onkeyup(m.keyUp)
      }
    }
    if(m.keyPress.val != false) {
      if(typeof ar.onkeypress == "function") {
        ar.onkeypress(m.keyPress)
      }
    }
  }
  function K(av, ar, ay) {
    var m = {};
    var au = D(av);
    var at = au.optns.ctx;
    var ax = au.layers[av.optns.layer.number];
    m.x = ar;
    m.y = ay;
    if(A) {
      m = ac(ar, ay, ax.matrix());
      m = ac(m.x, m.y, av.matrix())
    }
    if(at.isPointInPath === z || av._img !== z || av._imgData !== z || av._proto == "text") {
      var aw = av.getRect("poor");
      m = ac(ar, ay, o(av.matrix(), ax.matrix()));
      if(aw.x <= m.x && aw.y <= m.y && aw.x + aw.width >= m.x && aw.y + aw.height >= m.y) {
        return m
      }
    }else {
      if(at.isPointInPath(m.x, m.y)) {
        return m
      }
    }
    return false
  }
  function q(at, m) {
    var ay = false, ar = m.mousemove, aw = m.mousedown, aA = m.mouseup, au = m.click, az = m.dblclick, ax = ar.x || aw.x || aA.x || az.x || au.x, av = ar.y || aw.y || aA.y || az.y || au.y;
    if(ax != false) {
      ay = K(at, ax, av)
    }
    if(ay) {
      if(ar.x != false) {
        ar.object = at
      }
      if(aw.x != false) {
        aw.objects[aw.objects.length] = at
      }
      if(au.x != false) {
        au.objects[au.objects.length] = at
      }
      if(az.x != false) {
        az.objects[az.objects.length] = at
      }
      if(aA.x != false) {
        aA.objects[aA.objects.length] = at
      }
      m.point = ay
    }
  }
  function aj(m) {
    return D(m).layers[m.optns.layer.number]
  }
  function D(m) {
    return ad[m.optns.canvas.number]
  }
  function e(ay, m, au) {
    j(m);
    var ar = m.optns.canvas;
    var at = m.optns.layer;
    if(ay === z) {
      return at.id
    }
    if(at.id == ay) {
      return m
    }
    var av = {i:ar.number, j:at.number};
    at.id = ay;
    var ax = P.layer(ay);
    var az = {i:ax.optns.canvas.number, j:ax.optns.number};
    var aw = ad[av.i].layers[av.j][au], aA = ad[az.i].layers[az.j][au];
    aw.splice(m.optns.number, 1);
    m._level = m.optns.number = aA.length;
    aA[m._level] = m;
    at.number = az.j;
    ar.number = az.i;
    ar.id = ax.optns.canvas.id;
    j(m);
    return m
  }
  function J(au, at) {
    for(var ar in at) {
      switch(typeof at[ar]) {
        case "function":
          if(ar.substr(0, 2) == "on") {
            break
          }
          if(au[ar] === z) {
            au[ar] = at[ar]
          }
          break;
        case "object":
          if(ar == "optns" || ar == "animateQueue") {
            break
          }
          if(ar == "objs" || ar == "grdntsnptrns") {
            for(var m in at[ar]) {
              if(at[ar].hasOwnProperty(m)) {
                at[ar][m].clone().layer(au.optns.id)
              }
            }
            break
          }
          if(!at[ar] || ar === "ctx") {
            continue
          }
          au[ar] = typeof at[ar].pop === "function" ? [] : {};
          J(au[ar], at[ar]);
          break;
        default:
          if(ar == "_level") {
            break
          }
          au[ar] = at[ar]
      }
    }
  }
  function n(aw, m, av) {
    j(m);
    var ar = m.optns.canvas;
    var au = m.optns.layer;
    if(aw === z) {
      return ad[ar.number].optns.id
    }
    if(ad[ar.number].optns.id == aw) {
      return m
    }
    var ax = {i:ar.number, j:au.number};
    P.canvas(aw);
    for(var at = 0;at < ad.length;at++) {
      var aA = ad[at];
      if(aA.optns.id == aw) {
        var ay = ad[ax.i].layers[ax.j][av], az = aA.layers[0][av];
        ay.splice(m.optns.number, 1);
        d(ay);
        m._level = m.optns.number = az.length;
        az[m._level] = m;
        au.number = 0;
        ar.number = at;
        ar.id = aA.optns.id;
        au.id = aA.layers[0].optns.id
      }
    }
    j(m);
    return m
  }
  function d(ar) {
    for(var m = 0;m < ar.length;m++) {
      ar[m].optns.number = m
    }
  }
  function l(ay, az, aA, at, ax) {
    var au = ay.length, m, ar, aw;
    for(var av = 0;av < au;av++) {
      m = ay[av].optns;
      ar = m.canvas;
      aw = m.layer;
      ar.id = at;
      ar.number = ax;
      aw.id = az;
      aw.number = aA
    }
  }
  function T(m) {
    m.sort(function(at, ar) {
      if(at._level > ar._level) {
        return 1
      }
      if(at._level < ar._level) {
        return-1
      }
      return 0
    });
    d(m);
    return m.length
  }
  function W(at) {
    var ar;
    do {
      ar = false;
      for(var m = 0;m < at.length;m++) {
        if(at[m].optns.deleted) {
          at.splice(m, 1);
          ar = true
        }
      }
    }while(ar);
    d(at);
    return at.length
  }
  var w = {};
  w.object = function() {
    this.getCenter = function(ar) {
      var at = this.getRect("poor"), m = {x:(at.x * 2 + at.width) / 2, y:(at.y * 2 + at.height) / 2};
      return R(this, m, ar)
    };
    this.position = function() {
      return t(this._x, this._y, o(this.matrix(), aj(this).matrix()))
    };
    this.buffer = function(aw) {
      var at = this.optns.buffer;
      if(aw === z) {
        if(at.val) {
          return at.cnv
        }else {
          return false
        }
      }
      if(at.val === aw) {
        return this
      }
      if(aw) {
        var ar = at.cnv = document.createElement("canvas"), m = at.ctx = ar.getContext("2d"), av = at.rect = this.getRect(), au = this.transform();
        ar.setAttribute("width", av.width);
        ar.setAttribute("height", av.height);
        at.x = this._x;
        at.y = this._y;
        at.dx = this._transformdx;
        at.dy = this._transformdy;
        this._x = this._y = 0;
        this.transform(1, 0, 0, 1, -av.x + at.dx, -av.y + at.dy, true);
        this.setOptns(m);
        J(at.optns = {}, D(this).optns);
        at.optns.ctx = m;
        this.draw(at.optns);
        this._x = at.x;
        this._y = at.y;
        this.transform(au[0][0], au[1][0], au[0][1], au[1][1], av.x, av.y, true);
        at.val = true
      }else {
        this.translate(-at.rect.x + at.dx, -at.rect.y + at.dy);
        this.optns.buffer = {val:false}
      }
      return this
    };
    this.clone = function(m) {
      var ar = new w[this._proto];
      w[this._proto].prototype.base.call(ar);
      J(ar, this);
      ar.layer(aj(this).optns.id);
      J(ar.optns.transformMatrix, this.optns.transformMatrix);
      J(ar.optns.translateMatrix, this.optns.translateMatrix);
      J(ar.optns.scaleMatrix, this.optns.scaleMatrix);
      J(ar.optns.rotateMatrix, this.optns.rotateMatrix);
      if(m === z) {
        return ar
      }
      return ar.animate(m)
    };
    this.shadow = function(ar) {
      for(var at in ar) {
        switch(at) {
          case "x":
            this._shadowX = ar.x;
            break;
          case "y":
            this._shadowY = ar.y;
            break;
          case "blur":
            this._shadowBlur = ar.blur;
            break;
          case "color":
            var m = s(ar.color);
            this._shadowColor = ar.color.val;
            this._shadowColorR = m.r;
            this._shadowColorG = m.g;
            this._shadowColorB = m.b;
            this._shadowColorA = m.a;
            break
        }
      }
      j(this);
      return this
    };
    this.setOptns = function(ar) {
      ar.globalAlpha = this._opacity;
      ar.shadowOffsetX = this._shadowX;
      ar.shadowOffsetY = this._shadowY;
      ar.shadowBlur = this._shadowBlur;
      ar.globalCompositeOperation = this._composite;
      var av = parseInt(this._shadowColorR), au = parseInt(this._shadowColorG), m = parseInt(this._shadowColorB), at = parseInt(this._shadowColorA * 100) / 100;
      if(this._shadowColorRPrev !== av || this._shadowColorGPrev !== au || this._shadowColorBPrev !== m || this._shadowColorAPrev !== at) {
        ar.shadowColor = this._shadowColor = "rgba(" + av + ", " + au + ", " + m + ", " + at + ")";
        this._shadowColorRPrev = av;
        this._shadowColorGPrev = au;
        this._shadowColorBPrev = m;
        this._shadowColorAPrev = at
      }else {
        ar.shadowColor = this._shadowColor
      }
      ar.transform(this._transform11, this._transform12, this._transform21, this._transform22, this._transformdx, this._transformdy);
      return this
    };
    this.up = function(ar) {
      if(ar === z) {
        ar = 1
      }
      if(ar == "top") {
        this.level(ar)
      }else {
        var m = aj(this).objs[this.optns.number + ar];
        if(m !== z) {
          ar = m._level + 1 - this._level
        }
        this.level(this._level + ar)
      }
      return this
    };
    this.down = function(ar) {
      if(ar == z) {
        ar = 1
      }
      if(ar == "bottom") {
        this.level(ar)
      }else {
        var m = aj(this).objs[this.optns.number - ar];
        if(m !== z) {
          ar = this._level - (m._level - 1)
        }
        this.level(this._level - ar)
      }
      return this
    };
    this.level = function(ar) {
      if(ar == z) {
        return this._level
      }
      var m = aj(this);
      if(ar == "bottom") {
        if(this.optns.number == 0) {
          ar = this._level
        }else {
          ar = m.objs[0]._level - 1
        }
      }
      if(ar == "top") {
        if(this.optns.number == m.objs.length) {
          ar = this._level
        }else {
          ar = m.objs[m.objs.length - 1]._level + 1
        }
      }
      this._level = ar;
      m.optns.anyObjLevelChanged = true;
      j(this);
      return this
    };
    this.del = function() {
      this.optns.deleted = true;
      aj(this).optns.anyObjDeleted = true;
      j(this)
    };
    this.focus = function(m) {
      if(m === z) {
        this.optns.focused = true;
        if(typeof this.onfocus == "function") {
          this.onfocus()
        }
      }else {
        this.onfocus = m
      }
      return this
    };
    this.blur = function(m) {
      if(m === z) {
        this.optns.focused = false;
        if(typeof this.onblur == "function") {
          this.onblur()
        }
      }else {
        this.onblur = m
      }
      return this
    };
    this.click = function(m) {
      return x.call(this, m, "click")
    };
    this.dblclick = function(m) {
      return x.call(this, m, "dblclick")
    };
    this.keypress = function(m) {
      return ao.call(this, m, "onkeypress")
    };
    this.keydown = function(m) {
      return ao.call(this, m, "onkeydown")
    };
    this.keyup = function(m) {
      return ao.call(this, m, "onkeyup")
    };
    this.mousedown = function(m) {
      return x.call(this, m, "mousedown")
    };
    this.mouseup = function(m) {
      return x.call(this, m, "mouseup")
    };
    this.mousemove = function(m) {
      return x.call(this, m, "mousemove")
    };
    this.mouseover = function(m) {
      return x.call(this, m, "mouseover")
    };
    this.mouseout = function(m) {
      return x.call(this, m, "mouseout")
    };
    this.attr = function(at, ar) {
      if(typeof at === "object") {
        var m = at
      }else {
        if(ar === z) {
          return this["_" + at]
        }
        m = {};
        m[at] = ar
      }
      return this.animate(m)
    };
    this.queue = function() {
      var at = this.animateQueue.length, m, aw, av, ay = 0, ar = 0, ax, au = arguments;
      for(aw = 0;aw < au.length;aw++) {
        if(typeof au[aw] == "function") {
          au[aw].apply(this);
          au[aw] = false;
          aw++;
          if(this.animateQueue.length > at) {
            for(av = at;av < this.animateQueue.length;av++) {
              m = this.animateQueue[av];
              if(m.duration !== z) {
                if(m.duration > ay) {
                  ay = m.duration;
                  ar = av
                }
                break
              }
            }
            if(ay) {
              m = this.animateQueue[ar];
              if(m.animateFn) {
                ax = m.animateFn;
                m.animateFn = function() {
                  ax.apply(this);
                  this.queue.apply(this, au)
                }
              }else {
                m.animateFn = function() {
                  this.queue.apply(this, au)
                }
              }
              break
            }
          }
        }
      }
    };
    this.stop = function(au, av) {
      this.optns.animated = false;
      if(av === z) {
        av = false
      }
      if(au === z) {
        au = false
      }
      for(var at = 0;at < this.animateQueue.length;at++) {
        var m = this.animateQueue[at];
        if(av) {
          m.animateFn.call(this)
        }
        if(au) {
          for(var ar in m) {
            if(m[ar]["from"] !== z) {
              this[ar] = m[ar]["to"];
              H(ar, this, m)
            }
          }
        }
      }
      this.animateQueue = [];
      return this
    };
    this.animate = function(aB, m, av, aw, ax) {
      if(m === z) {
        m = 1
      }else {
        if(typeof m == "function") {
          ax = m;
          m = 1
        }
        if(typeof m == "object") {
          av = m;
          m = 1
        }
      }
      if(av === z) {
        av = {fn:"linear", type:"in"}
      }else {
        if(typeof av == "function") {
          ax = av;
          av = {fn:"linear", type:"in"}
        }
        if(av.type === z) {
          av.type = "in"
        }
      }
      if(aw === z) {
        aw = false
      }else {
        if(typeof aw == "function") {
          ax = aw;
          aw = false
        }
      }
      if(aB.scale !== z) {
        this._scaleX = this._scaleY = 1;
        if(typeof aB.scale != "object") {
          aB.scaleX = aB.scaleY = aB.scale
        }else {
          aB.scaleX = aB.scale.x || 1;
          aB.scaleY = aB.scale.y || 1
        }
      }
      if(aB.translate !== z) {
        this._translateX = this._translateY = 0;
        if(typeof aB.translate != "object") {
          aB.translateX = aB.translateY = aB.translate
        }else {
          aB.translateX = aB.translate.x || 0;
          aB.translateY = aB.translate.y || 0
        }
        aB.translate = z
      }
      if(aB.translateTo !== z) {
        var az = this.position();
        this._translateToX = az.x;
        this._translateToY = az.y;
        if(typeof aB.translateTo != "object") {
          aB.translateToX = aB.translateToY = aB.translateTo
        }else {
          aB.translateToX = aB.translateTo.x || 0;
          aB.translateToY = aB.translateTo.y || 0
        }
        aB.translateTo = z
      }
      if(aB.rotate !== z) {
        aB.rotateAngle = aB.rotate.angle;
        this._rotateAngle = 0;
        this._rotateX = aB.rotate.x || 0;
        this._rotateY = aB.rotate.y || 0;
        aB.rotate = z
      }
      if(aB.color !== z) {
        var at = s(aB.color);
        if(at.color.notColor) {
          this.optns.color.notColor = at.color.notColor
        }else {
          aB.colorR = at.r;
          aB.colorG = at.g;
          aB.colorB = at.b;
          aB.alpha = at.a
        }
        aB.color = z
      }
      if(aB.shadowColor !== z) {
        at = s(aB.shadowColor);
        aB.shadowColorR = at.r;
        aB.shadowColorG = at.g;
        aB.shadowColorB = at.b;
        aB.shadowColorA = at.a;
        aB.shadowColor = z
      }
      if(m > 1) {
        var au = this.animateQueue[this.animateQueue.length] = {animateKeyCount:0};
        au.animateFn = ax || false;
        this.optns.animated = true;
        au.duration = m;
        au.step = 0;
        au.easing = av;
        au.onstep = aw
      }
      for(var aA in aB) {
        if(this["_" + aA] !== z && aB[aA] !== z) {
          var ar = aB[aA], ay = "_" + aA;
          if(ar != this[ay]) {
            if(ar.charAt) {
              if(aA == "string") {
                this._string = ar
              }else {
                if(ar.charAt(1) == "=") {
                  ar = this[ay] + parseInt(ar.charAt(0) + "1") * parseInt(ar.substr(2))
                }else {
                  if(!V.test(ar)) {
                    ar = parseInt(ar)
                  }else {
                    this[ay] = ar
                  }
                }
              }
            }
            if(m == 1) {
              this[ay] = ar
            }else {
              au[ay] = {from:this[ay], to:ar, prev:0};
              au.animateKeyCount++
            }
          }
        }
      }
      if(m == 1) {
        if(aB.rotateAngle) {
          this.rotate(this._rotateAngle, this._rotateX, this._rotateY)
        }
        if(aB.translateX || aB.translateY) {
          this.translate(this._translateX, this._translateY)
        }
        if(aB.translateToX || aB.translateToY) {
          this.translate(this._translateToX, this._translateToY)
        }
        if(aB.scaleX || aB.scaleY) {
          this.scale(this._scaleX, this._scaleY)
        }
      }
      j(this);
      return this
    };
    this.matrix = function(ar) {
      if(ar === z) {
        return[[this._transform11, this._transform21, this._transformdx], [this._transform12, this._transform22, this._transformdy]]
      }
      this._transform11 = ar[0][0];
      this._transform21 = ar[0][1];
      this._transform12 = ar[1][0];
      this._transform22 = ar[1][1];
      this._transformdx = ar[0][2];
      this._transformdy = ar[1][2];
      return this
    };
    this.translateTo = function(m, az, ar, at, au, aw) {
      if(ar !== z) {
        return this.animate({translateTo:{x:m, y:az}}, ar, at, au, aw)
      }
      var ay = this.position(), ax = 0, av = 0;
      if(m !== z) {
        ax = m - ay.x
      }
      if(az !== z) {
        av = az - ay.y
      }
      return this.translate(ax, av)
    };
    this.translate = function(m, aw, au, av, at, ar) {
      if(au !== z) {
        return this.animate({translate:{x:m, y:aw}}, au, av, at, ar)
      }
      this.optns.translateMatrix = o(this.optns.translateMatrix, [[1, 0, m], [0, 1, aw]]);
      k(this);
      return this
    };
    this.scale = function(m, aw, au, av, at, ar) {
      if(au !== z) {
        return this.animate({scale:{x:m, y:aw}}, au, av, at, ar)
      }
      if(aw === z) {
        aw = m
      }
      this.optns.scaleMatrix = o(this.optns.scaleMatrix, [[m, 0, this._x * (1 - m)], [0, aw, this._y * (1 - aw)]]);
      k(this);
      return this
    };
    this.rotate = function(aA, ar, az, au, av, ax, ay) {
      if(au !== z) {
        return this.animate({rotate:{angle:aA, x:ar, y:az}}, au, av, ax, ay)
      }
      aA = aA / E;
      var aC = y(aA), aw = L(aA), at = 0, m = 0;
      if(ar !== z) {
        if(ar == "center") {
          var aB = this.getCenter("poor");
          if(az === z) {
            ar = aB.x;
            az = aB.y
          }else {
            ar = aB.x + az.x;
            az = aB.y + az.y
          }
        }
        at = -ar * (aC - 1) + az * aw;
        m = -az * (aC - 1) - ar * aw
      }
      this.optns.rotateMatrix = o(this.optns.rotateMatrix, [[aC, -aw, at], [aw, aC, m]]);
      k(this);
      return this
    };
    this.transform = function(aw, av, ay, ax, ar, m, au) {
      if(aw === z) {
        return this.matrix()
      }
      var at = this.optns;
      if(au !== z) {
        at.transformMatrix = [[aw, ay, ar], [av, ax, m]];
        at.rotateMatrix = [[1, 0, 0], [0, 1, 0]];
        at.scaleMatrix = [[1, 0, 0], [0, 1, 0]];
        at.translateMatrix = [[1, 0, 0], [0, 1, 0]]
      }else {
        at.transformMatrix = o(at.transformMatrix, [[aw, ay, ar], [av, ax, m]])
      }
      k(this);
      return this
    };
    this.beforeDraw = function(ar) {
      if(!this._visible) {
        return false
      }
      var m = ar.ctx;
      m.save();
      if(this.optns.clipObject) {
        var at = this.optns.clipObject;
        at._visible = true;
        if(at.optns.animated) {
          F.call(at, ar)
        }
        at.setOptns(m);
        m.beginPath();
        at.draw(m);
        m.clip()
      }
      this.setOptns(m);
      if(this.optns.animated) {
        F.call(this, ar)
      }
      m.beginPath();
      return true
    };
    this.clip = function(m) {
      if(m === z) {
        return this.optns.clipObject
      }
      aj(this).objs.splice(m.optns.number, 1);
      this.optns.clipObject = m;
      return this
    };
    this.afterDraw = function(m) {
      m.ctx.closePath();
      ak(this, m);
      m.ctx.restore();
      if(this.optns.clipObject) {
        w.shape.prototype.afterDraw.call(this.optns.clipObject, m)
      }
    };
    this.isPointIn = function(az, ax, ar) {
      var au = D(this).optns, aB = au.ctx, av = false, m = this.optns, at = false;
      if(ar !== z) {
        az -= au.x;
        ax -= au.y
      }
      if(m.animated) {
        av = true
      }
      m.animated = false;
      if(m.clipObject) {
        var ay = m.clipObject, aw = ay.optns;
        if(aw.animated) {
          at = true;
          aw.animated = false
        }
      }
      aj(this).setOptns(aB);
      this.beforeDraw(au);
      this.draw(aB);
      var aA = K(this, az, ax);
      aB.closePath();
      aB.restore();
      m.animated = av;
      if(at) {
        aw.animated = at
      }
      return aA
    };
    this.layer = function(m) {
      return e(m, this, "objs")
    };
    this.canvas = function(m) {
      return n(m, this, "objs")
    };
    this.draggable = function(av, au, ax) {
      if(au === z && typeof av == "object" && av.optns === z) {
        au = av.params;
        ax = av.drag;
        var ar = av.start, ay = av.stop, aw = av.disabled;
        av = av.object
      }
      var at = this;
      var az = this.optns.drag;
      if(typeof au === "function") {
        ax = au;
        au = z
      }
      if(typeof av == "function") {
        ax = av;
        av = z
      }
      az.shiftX = 0;
      az.shiftY = 0;
      if(au !== z) {
        if(au.shiftX !== z) {
          az.shiftX = au.shiftX;
          au.shiftX = z
        }
        if(au.shiftY !== z) {
          az.shiftY = au.shiftY;
          au.shiftY = z
        }
      }
      if(av !== z) {
        if(av.id) {
          at = au === z ? av.visible(false) : av.animate(au).visible(false)
        }
        if(av == "clone") {
          at = this.clone(au).visible(false);
          az.type = "clone"
        }
      }
      az.val = true;
      az.x = this._x;
      az.y = this._y;
      az.dx = this._transformdx;
      az.dy = this._transformdy;
      az.object = at;
      az.params = au;
      az.drag = ax || false;
      az.start = ar || false;
      az.stop = ay || false;
      az.disabled = aw || false;
      var m = D(this).optns;
      m.mousemove.val = true;
      m.mousedown.val = true;
      m.mouseup.val = true;
      return this
    };
    this.droppable = function(m) {
      this.optns.drop.val = true;
      if(m !== z) {
        this.optns.drop.fn = m
      }
      return this
    };
    this.name = function(m) {
      return this.attr("name", m)
    };
    this.hasName = function(m) {
      var at = this.attr("name").split(" "), ar = 0;
      while(ar < at.length) {
        if(at[ar] === m) {
          return true
        }
        ar++
      }
      return false
    };
    this.addName = function(m) {
      var at = this.attr("name").split(" "), ar = 0;
      while(ar < at.length) {
        if(at[ar] === m) {
          return this
        }
        ar++
      }
      at.push(m);
      return this.attr("name", at.join(" "))
    };
    this.removeName = function(m) {
      var at = this.attr("name").split(" "), ar = 0;
      while(ar < at.length) {
        if(at[ar] === m) {
          at.splice(ar, 1);
          return this.attr("name", at.join(" "))
        }
        ar++
      }
      return this
    };
    this.visible = function(m) {
      return this.attr("visible", m)
    };
    this.composite = function(m) {
      return this.attr("composite", m)
    };
    this.id = function(m) {
      if(m === z) {
        return this.optns.id
      }
      this.optns.id = m;
      return this
    };
    this.opacity = function(m) {
      return this.attr("opacity", m)
    };
    this.fadeIn = function(at, au, ar, m) {
      return this.fadeTo(1, at, au, ar, m)
    };
    this.fadeOut = function(at, au, ar, m) {
      return this.fadeTo(0, at, au, ar, m)
    };
    this.fadeTo = function(au, at, av, ar, m) {
      if(at === z) {
        at = 600
      }
      return this.animate({opacity:au}, at, av, ar, m)
    };
    this.fadeToggle = function(at, au, ar, m) {
      if(this._opacity) {
        this.fadeOut(at, au, ar, m)
      }else {
        this.fadeIn(at, au, ar, m)
      }
      return this
    };
    this.instanceOf = function(m) {
      if(m === z) {
        return this._proto
      }
      return this instanceof w[m]
    };
    this.base = function(ar, aw, m) {
      if(typeof ar == "object") {
        ar = af(ar, {x:0, y:0, service:false});
        m = ar.service;
        aw = ar.y;
        ar = ar.x
      }else {
        if(m === z) {
          m = false
        }
      }
      var au = ad[X];
      this.optns = {animated:false, clipObject:false, drop:{val:false, fn:function() {
      }}, drag:{val:false}, layer:{id:au.optns.id + "Layer0", number:0}, canvas:{number:0}, focused:false, buffer:{val:false}, rotateMatrix:[[1, 0, 0], [0, 1, 0]], scaleMatrix:[[1, 0, 0], [0, 1, 0]], translateMatrix:[[1, 0, 0], [0, 1, 0]], transformMatrix:[[1, 0, 0], [0, 1, 0]]};
      this.animateQueue = [];
      this._x = ar;
      this._y = aw;
      if(m == false && au !== z && au.layers[0] !== z) {
        this.optns.layer.number = 0;
        this.optns.canvas.number = X;
        var av = aj(this), at = av.objs.length;
        this.optns.number = at;
        this._level = at ? av.objs[at - 1]._level + 1 : 0;
        av.objs[at] = this;
        this.optns.layer.id = av.optns.id;
        j(this)
      }
      return this
    };
    this._visible = true;
    this._composite = "source-over";
    this._name = "";
    this._opacity = 1;
    this._shadowX = 0;
    this._shadowY = 0;
    this._shadowBlur = 0;
    this._shadowColor = "rgba(0,0,0,0)";
    this._shadowColorR = 0;
    this._shadowColorG = 0;
    this._shadowColorB = 0;
    this._shadowColorA = 0;
    this._shadowColorRPrev = 0;
    this._shadowColorGPrev = 0;
    this._shadowColorBPrev = 0;
    this._shadowColorAPrev = 0;
    this._translateX = 0;
    this._translateY = 0;
    this._scaleX = 1;
    this._scaleY = 1;
    this._rotateAngle = 0;
    this._rotateX = 0;
    this._rotateY = 0;
    this._transform11 = 1;
    this._transform12 = 0;
    this._transform21 = 0;
    this._transform22 = 1;
    this._transformdx = 0;
    this._transformdy = 0;
    this._matrixChanged = false
  };
  w.object.prototype = new w.object;
  w.shape = function() {
    this.color = function(m) {
      if(m === z) {
        return[this._colorR, this._colorG, this._colorB, this._alpha]
      }
      return this.attr("color", m)
    };
    this.lineStyle = function(m) {
      return this.attr(m)
    };
    this.setOptns = function(at) {
      w.shape.prototype.setOptns.call(this, at);
      at.lineWidth = this._lineWidth;
      at.lineCap = this._cap;
      at.lineJoin = this._join;
      at.miterLimit = this._miterLimit;
      var au = this.optns.color;
      if(au.notColor === z) {
        var ay = parseInt(this._colorR), ax = parseInt(this._colorG), ar = parseInt(this._colorB), av = parseInt(this._alpha * 100) / 100;
        if(this._colorRPrev !== ay || this._colorGPrev !== ax || this._colorBPrev !== ar || this._alphaPrev !== av) {
          au.val = this._color = "rgba(" + ay + ", " + ax + ", " + ar + ", " + av + ")";
          this._colorRPrev = ay;
          this._colorGPrev = ax;
          this._colorBPrev = ar;
          this._alphaPrev = av
        }else {
          au.val = this._color
        }
      }else {
        var m = au.notColor;
        var aw = ad[m.canvas].layers[m.layer];
        if(aw.grdntsnptrns[m.level] !== z) {
          au.val = aw.grdntsnptrns[m.level].val
        }
      }
      if(this._fill) {
        at.fillStyle = au.val
      }else {
        at.strokeStyle = au.val
      }
    };
    this.afterDraw = function(m) {
      if(this._fill) {
        m.ctx.fill()
      }else {
        m.ctx.stroke()
      }
      w.shape.prototype.afterDraw.call(this, m)
    };
    this.base = function(m) {
      if(m === z) {
        m = {}
      }
      if(m.color === z) {
        m.color = "rgba(0,0,0,1)"
      }else {
        if(!m.color.charAt && m.color.id === z && m.color.r === z) {
          m.fill = m.color;
          m.color = "rgba(0,0,0,1)"
        }
      }
      m = af(m, {color:"rgba(0,0,0,1)", fill:0});
      w.shape.prototype.base.call(this, m);
      this._fill = m.fill;
      this.optns.color = {val:m.color, notColor:z};
      return this.color(m.color)
    };
    this._colorR = 0;
    this._colorG = 0;
    this._colorB = 0;
    this._alpha = 0;
    this._colorRPrev = 0;
    this._colorGPrev = 0;
    this._colorBPrev = 0;
    this._alphaPrev = 0;
    this._color = "rgba(0,0,0,0)";
    this._lineWidth = 1;
    this._cap = "butt";
    this._join = "miter";
    this._miterLimit = 1
  };
  w.shape.prototype = new w.object;
  w.lines = function() {
    this.getCenter = function(at) {
      var m = {x:this._x0, y:this._y0};
      for(var ar = 1;ar < this.shapesCount;ar++) {
        m.x += this["_x" + ar];
        m.y += this["_y" + ar]
      }
      m.x = m.x / this.shapesCount;
      m.y = m.y / this.shapesCount;
      return R(this, m, at)
    };
    this.position = function() {
      return t(this._x0, this._y0, o(this.matrix(), aj(this).matrix()))
    };
    this.getRect = function(au) {
      var m, ax, aw = m = this._x0, av = ax = this._y0;
      for(var ar = 1;ar < this.shapesCount;ar++) {
        if(aw < this["_x" + ar]) {
          aw = this["_x" + ar]
        }
        if(av < this["_y" + ar]) {
          av = this["_y" + ar]
        }
        if(m > this["_x" + ar]) {
          m = this["_x" + ar]
        }
        if(ax > this["_y" + ar]) {
          ax = this["_y" + ar]
        }
      }
      var at = {x:m, y:ax, width:aw - m, height:av - ax};
      return b(this, at, au)
    };
    this.addPoint = function() {
      j(this);
      var ar = this.pointNames;
      for(var m = 0;m < ar.length;m++) {
        this[ar[m] + this.shapesCount] = arguments[m]
      }
      this.shapesCount++;
      return this
    };
    this.delPoint = function(ar, av, m) {
      j(this);
      if(av === z) {
        var au = this.points();
        au.splice(ar, 1);
        this.points(au)
      }else {
        m = m || 0;
        for(var at = 0;at < this.shapesCount;at++) {
          if(this["_x" + at] < ar + m && this["_x" + at] > ar - m && this["_y" + at] < av + m && this["_y" + at] < av + m) {
            this.delPoint(at);
            at--
          }
        }
      }
      return this
    };
    this.points = function(au) {
      var av = this.pointNames;
      if(au === z) {
        au = [];
        for(var ar = 0;ar < this.shapesCount;ar++) {
          au[ar] = [];
          for(var at = 0;at < av.length;at++) {
            au[ar][at] = this[av[at] + ar]
          }
        }
        return au
      }
      j(this);
      var m = this.shapesCount;
      this.shapesCount = au.length;
      for(ar = 0;ar < this.shapesCount;ar++) {
        for(at = 0;at < av.length;at++) {
          this[av[at] + ar] = au[ar][at]
        }
      }
      for(ar = this.shapesCount;ar < m;ar++) {
        for(at = 0;at < av.length;at++) {
          this[av[at] + ar] = z
        }
      }
      return this
    };
    this.base = function(ar, m, at) {
      if(ar !== z) {
        if(typeof ar.pop == "function") {
          ar = {points:ar, color:m, fill:at}
        }
      }
      w.lines.prototype.base.call(this, ar);
      this.shapesCount = 0;
      if(ar !== z) {
        if(ar.points !== z) {
          this.points(ar.points)
        }
      }
      return this
    }
  };
  w.lines.prototype = new w.shape;
  w.line = function() {
    this.draw = function(m) {
      if(this._x0 === z) {
        return
      }
      m.moveTo(this._x0, this._y0);
      for(var ar = 1;ar < this.shapesCount;ar++) {
        m.lineTo(this["_x" + ar], this["_y" + ar])
      }
    };
    this.base = function(ar, m, at) {
      w.line.prototype.base.call(this, ar, m, at);
      return this
    };
    this._proto = "line";
    this.pointNames = ["_x", "_y"]
  };
  w.line.prototype = new w.lines;
  w.qCurve = function() {
    this.draw = function(m) {
      if(this._x0 === z) {
        return
      }
      m.moveTo(this._x0, this._y0);
      for(var ar = 1;ar < this.shapesCount;ar++) {
        m.quadraticCurveTo(this["_cp1x" + ar], this["_cp1y" + ar], this["_x" + ar], this["_y" + ar])
      }
    };
    this.base = function(ar, m, at) {
      w.qCurve.prototype.base.call(this, ar, m, at);
      return this
    };
    this._proto = "qCurve";
    this.pointNames = ["_x", "_y", "_cp1x", "_cp1y"]
  };
  w.qCurve.prototype = new w.lines;
  w.bCurve = function() {
    this.draw = function(m) {
      if(this._x0 === z) {
        return
      }
      m.moveTo(this._x0, this._y0);
      for(var ar = 1;ar < this.shapesCount;ar++) {
        m.bezierCurveTo(this["_cp1x" + ar], this["_cp1y" + ar], this["_cp2x" + ar], this["_cp2y" + ar], this["_x" + ar], this["_y" + ar])
      }
    };
    this.base = function(ar, m, at) {
      w.bCurve.prototype.base.call(this, ar, m, at);
      return this
    };
    this._proto = "bCurve";
    this.pointNames = ["_x", "_y", "_cp1x", "_cp1y", "_cp2x", "_cp2y"]
  };
  w.bCurve.prototype = new w.lines;
  w.circle = function() {
    this.getCenter = function(m) {
      return R(this, {x:this._x, y:this._y}, m)
    };
    this.getRect = function(ar) {
      var m = {x:Math.floor(this._x - this._radius), y:Math.floor(this._y - this._radius)};
      m.width = m.height = Math.ceil(this._radius) * 2;
      return b(this, m, ar)
    };
    this.draw = function(m) {
      m.arc(this._x, this._y, this._radius, 0, v, true)
    };
    this.base = function(ar, av, m, at, au) {
      if(typeof ar != "object") {
        ar = {x:ar, y:av, radius:m, color:at, fill:au}
      }
      ar = af(ar, {radius:0});
      w.circle.prototype.base.call(this, ar);
      this._radius = ar.radius;
      return this
    };
    this._proto = "circle"
  };
  w.circle.prototype = new w.shape;
  w.rect = function() {
    this.getRect = function(m) {
      return b(this, {x:this._x, y:this._y, width:this._width, height:this._height}, m)
    };
    this.draw = function(m) {
      m.rect(this._x, this._y, this._width, this._height)
    };
    this.base = function(ar, aw, au, m, at, av) {
      if(typeof ar != "object") {
        ar = {x:ar, y:aw, width:au, height:m, color:at, fill:av}
      }
      ar = af(ar, {width:0, height:0});
      w.rect.prototype.base.call(this, ar);
      this._width = ar.width;
      this._height = ar.height;
      return this
    };
    this._proto = "rect"
  };
  w.rect.prototype = new w.shape;
  w.arc = function() {
    this.getRect = function(ay) {
      var az = {x:this._x, y:this._y}, ax = this._startAngle, m = this._endAngle, aw = this._radius, au = O(L(ax / E) * aw), av = O(y(ax / E) * aw), aA = O(L(m / E) * aw), aB = O(y(m / E) * aw), at = av > 0 && aB > 0, ar = av < 0 && aB < 0, aD = au > 0 && aA > 0, aC = au < 0 && aA < 0;
      az.width = az.height = aw;
      if(this._anticlockwise && ax < m || !this._anticlockwise && ax > m) {
        if(ar || at && (aC || aD) || av == 0 && aB == 0) {
          az.y -= aw;
          az.height += aw
        }else {
          if(at && aA < 0 && au > 0) {
            az.y += aA;
            az.height += aA
          }else {
            if(aB > 0 && aA < 0 && av < 0) {
              az.y += i(aA, au);
              az.height -= i(aA, au)
            }else {
              if(aC) {
                az.y -= U(aA, au)
              }else {
                az.y -= aw
              }
              az.height += U(aA, au)
            }
          }
        }
        if(aD || aC && (ar || at) || au == 0 && aA == 0) {
          az.x -= aw;
          az.width += aw
        }else {
          if(aA < 0 && au > 0) {
            az.x += i(aB, av);
            az.width -= i(aB, av)
          }else {
            if(ar) {
              az.x -= U(aB, av)
            }else {
              az.x -= aw
            }
            az.width += U(aB, av)
          }
        }
      }else {
        at = av >= 0 && aB >= 0;
        aD = au >= 0 && aA >= 0;
        ar = av <= 0 && aB <= 0;
        aC = au <= 0 && aA <= 0;
        if(aC && at) {
          az.x += i(aB, av);
          az.width -= i(aB, av);
          az.y += i(aA, au);
          az.height += U(aA, au)
        }else {
          if(aC && ar) {
            az.x += i(aB, av);
            az.width += U(aB, av);
            az.y += i(aA, au);
            az.height += U(aA, au)
          }else {
            if(aC) {
              az.x += i(aB, av);
              az.width += U(aB, av);
              az.y -= aw;
              az.height += U(aA, au)
            }else {
              if(at && aD) {
                az.x += i(aB, av);
                az.width = Z(aB - av);
                az.y += i(aA, au);
                az.height -= i(aA, au)
              }else {
                if(aD) {
                  az.x += i(aB, av);
                  az.width = Z(aB) + Z(av);
                  az.y += i(aA, au);
                  az.height -= i(aA, au)
                }else {
                  if(ar) {
                    az.x -= aw;
                    az.width += U(aB, av);
                    az.y -= aw;
                    az.height += U(aA, au)
                  }else {
                    if(at) {
                      az.x -= aw;
                      az.width += U(aB, av);
                      az.y -= aw;
                      az.height += aw
                    }
                  }
                }
              }
            }
          }
        }
      }
      return b(this, az, ay)
    };
    this.draw = function(m) {
      m.arc(this._x, this._y, this._radius, this._startAngle / E, this._endAngle / E, this._anticlockwise)
    };
    this.base = function(ar, ay, m, av, au, aw, at, ax) {
      if(aw !== z) {
        if(aw.charAt) {
          at = aw
        }
        if(aw) {
          aw = true
        }else {
          aw = false
        }
      }
      if(typeof ar != "object") {
        ar = {x:ar, y:ay, radius:m, startAngle:av, endAngle:au, anticlockwise:aw, color:at, fill:ax}
      }
      ar = af(ar, {radius:0, startAngle:0, endAngle:0, anticlockwise:true});
      w.arc.prototype.base.call(this, ar);
      this._radius = ar.radius;
      this._startAngle = ar.startAngle;
      this._endAngle = ar.endAngle;
      this._anticlockwise = ar.anticlockwise;
      return this
    };
    this._proto = "arc"
  };
  w.arc.prototype = new w.shape;
  w.text = function() {
    this.font = function(m) {
      return this.attr("font", m)
    };
    this._font = "10px sans-serif";
    this.align = function(m) {
      return this.attr("align", m)
    };
    this._align = "start";
    this.baseline = function(m) {
      return this.attr("baseline", m)
    };
    this._baseline = "alphabetic";
    this.string = function(m) {
      return this.attr("string", m)
    };
    this.position = function() {
      var ar = {x:this._x, y:this._y}, m = D(this).optns.ctx;
      ar.height = parseInt(this._font.match(Q)[0]);
      ar.y -= ar.height;
      m.save();
      m.textBaseline = this._baseline;
      m.font = this._font;
      m.textAlign = this._align;
      ar.width = m.measureText(this._string).width;
      m.restore();
      return b(this, ar)
    };
    this.getRect = function(at) {
      var ar = {x:this._x, y:this._y}, m = D(this).optns.ctx;
      ar.height = parseInt(this._font.match(Q)[0]);
      ar.y -= ar.height;
      m.save();
      m.textBaseline = this._baseline;
      m.font = this._font;
      m.textAlign = this._align;
      ar.width = m.measureText(this._string).width;
      if(this._align == "center") {
        ar.x -= ar.width / 2
      }
      if(this._align == "right") {
        ar.x -= ar.width
      }
      m.restore();
      return b(this, ar, at)
    };
    this.setOptns = function(m) {
      w.text.prototype.setOptns.call(this, m);
      m.textBaseline = this._baseline;
      m.font = this._font;
      m.textAlign = this._align
    };
    this.draw = function(m) {
      if(this._maxWidth === false) {
        if(this._fill) {
          m.fillText(this._string, this._x, this._y)
        }else {
          m.strokeText(this._string, this._x, this._y)
        }
      }else {
        if(this._fill) {
          m.fillText(this._string, this._x, this._y, this._maxWidth)
        }else {
          m.strokeText(this._string, this._x, this._y, this._maxWidth)
        }
      }
    };
    this.base = function(at, m, aw, au, ar, av) {
      if(au !== z) {
        if(au.charAt) {
          if(ar !== z) {
            av = ar
          }
          ar = au;
          au = false
        }
      }
      if(typeof at != "object") {
        at = {string:at, x:m, y:aw, maxWidth:au, color:ar, fill:av}
      }
      at = af(at, {string:"", maxWidth:false, fill:1});
      w.text.prototype.base.call(this, at);
      this._string = at.string;
      this._maxWidth = at.maxWidth;
      return this
    };
    this._proto = "text"
  };
  w.text.prototype = new w.shape;
  w.grdntsnptrn = function() {
    this.layer = function(ar) {
      return e(ar, this, "grdntsnptrns")
    };
    this.canvas = function(ar) {
      return n(ar, this, "grdntsnptrns")
    };
    var m = new w.object;
    this.animate = m.animate;
    this.attr = m.attr;
    this.id = m.id;
    this.name = m.name;
    this.level = m.level;
    this.base = function() {
      this.animateQueue = [];
      this.optns = {animated:false, name:"", layer:{id:ad[0].optns.id + "Layer_0", number:0}, canvas:{number:0}, visible:true};
      this.optns.layer.id = ad[X].optns.id + "Layer_0";
      this.optns.layer.number = 0;
      this.optns.canvas.number = X;
      var ar = ad[X].layers[0].grdntsnptrns;
      this._level = ar.length;
      ar[this._level] = this;
      j(this)
    };
    return this
  };
  w.gradients = function() {
    this.colorStopsCount = 0;
    this.paramNames = ["_pos", "_colorR", "_colorG", "_colorB", "_alpha"];
    this.addColorStop = function(au, ar) {
      j(this);
      var m = s(ar);
      var at = this.colorStopsCount;
      this["_pos" + at] = au;
      this["_colorR" + at] = m.r;
      this["_colorG" + at] = m.g;
      this["_colorB" + at] = m.b;
      this["_alpha" + at] = m.a;
      this.colorStopsCount++;
      return this
    };
    this.animate = function(av, ax, ay, aw, au) {
      for(var at in av) {
        if(at.substr(0, 5) == "color") {
          var ar = at.substring(5);
          var m = s(av[at]);
          av["colorR" + ar] = m.r;
          av["colorG" + ar] = m.g;
          av["colorB" + ar] = m.b;
          av["alpha" + ar] = m.a
        }
      }
      w.gradients.prototype.animate.call(this, av, ax, ay, aw, au)
    };
    this.delColorStop = function(ar) {
      j(this);
      var m = this.colorStops();
      m.splice(ar, 1);
      if(m.length > 0) {
        this.colorStops(m)
      }else {
        this.colorStopsCount = 0
      }
      return this
    };
    this.colorStops = function(aw) {
      var av = this.paramNames;
      if(aw === z) {
        aw = [];
        for(var at = 0;at < this.colorStopsCount;at++) {
          aw[at] = [];
          for(var au = 0;au < av.length;au++) {
            aw[at][au] = this[av[au] + at]
          }
        }
        return aw
      }
      j(this);
      var ar = this.colorStopsCount;
      var m = aw.length;
      if(aw[0].length == 2) {
        for(at = 0;at < m;at++) {
          this.addColorStop(aw[at][0], aw[at][1])
        }
      }else {
        for(at = 0;at < m;at++) {
          for(au = 0;au < av.length;au++) {
            this[av[au] + at] = aw[at][au]
          }
        }
      }
      for(at = m;at < ar;at++) {
        for(au = 0;au < av.length;au++) {
          this[av[au] + at] = z
        }
      }
      this.colorStopsCount = m;
      return this
    };
    this.base = function(m) {
      w.gradients.prototype.base.call(this);
      if(m == z) {
        return this
      }else {
        return this.colorStops(m)
      }
    }
  };
  w.gradients.prototype = new w.grdntsnptrn;
  w.pattern = function() {
    this.create = function(m) {
      if(this.optns.animated) {
        F.call(this, m)
      }
      this.val = m.ctx.createPattern(this._img, this._type)
    };
    this.base = function(ar, m) {
      if(ar.onload) {
        ar = {image:ar, type:m}
      }
      ar = af(ar, {type:"repeat"});
      w.pattern.prototype.base.call(this);
      this._img = ar.image;
      this._type = ar.type;
      return this
    };
    this._proto = "pattern"
  };
  w.pattern.prototype = new w.grdntsnptrn;
  w.lGradient = function() {
    this.create = function(ar) {
      if(this.optns.animated) {
        F.call(this, ar)
      }
      this.val = ar.ctx.createLinearGradient(this._x1, this._y1, this._x2, this._y2);
      for(var m = 0;m < this.colorStopsCount;m++) {
        this.val.addColorStop(this["_pos" + m], "rgba(" + parseInt(this["_colorR" + m]) + "," + parseInt(this["_colorG" + m]) + "," + parseInt(this["_colorB" + m]) + "," + this["_alpha" + m] + ")")
      }
    };
    this.base = function(at, av, ar, au, m) {
      if(typeof at !== "object") {
        at = {x1:at, y1:av, x2:ar, y2:au, colors:m}
      }
      at = af(at, {x1:0, y1:0, x2:0, y2:0});
      w.lGradient.prototype.base.call(this, at.colors);
      this._x1 = at.x1;
      this._y1 = at.y1;
      this._x2 = at.x2;
      this._y2 = at.y2;
      return this
    };
    this._proto = "lGradient"
  };
  w.lGradient.prototype = new w.gradients;
  w.rGradient = function() {
    this.create = function(ar) {
      if(this.optns.animated) {
        F.call(this)
      }
      this.val = ar.ctx.createRadialGradient(this._x1, this._y1, this._r1, this._x2, this._y2, this._r2);
      for(var m = 0;m < this.colorStopsCount;m++) {
        this.val.addColorStop(this["_pos" + m], "rgba(" + parseInt(this["_colorR" + m]) + "," + parseInt(this["_colorG" + m]) + "," + parseInt(this["_colorB" + m]) + "," + this["_alpha" + m] + ")")
      }
    };
    this.base = function(av, ax, au, at, aw, ar, m) {
      if(typeof av !== "object") {
        av = {x1:av, y1:ax, r1:au, x2:at, y2:aw, r2:ar, colors:m}
      }
      av = af(av, {x1:0, y1:0, r1:0, x2:0, y2:0, r2:0});
      w.rGradient.prototype.base.call(this, av.colors);
      this._x1 = av.x1;
      this._y1 = av.y1;
      this._r1 = av.r1;
      this._x2 = av.x2;
      this._y2 = av.y2;
      this._r2 = av.r2;
      return this
    };
    this._proto = "rGradient"
  };
  w.rGradient.prototype = new w.gradients;
  w.layer = function() {
    this.position = function() {
      var av = this.objs, au, m, at, ar = av.length;
      for(at = 0;at < ar;at++) {
        m = av[at].position();
        if(au === z) {
          au = m
        }
        if(au.x > m.x) {
          au.x = m.x
        }
        if(au.y > m.y) {
          au.y = m.y
        }
      }
      return au
    };
    this.getRect = function(au) {
      var aw = this.objs, at, av, ar, m = aw.length;
      if(aw.length == 0) {
        return false
      }
      if(au == "coords") {
        for(ar = 0;ar < m;ar++) {
          av = aw[ar].getRect(au);
          if(at === z) {
            at = av
          }
          if(at[0][0] > av[0][0]) {
            at[0][0] = av[0][0]
          }
          if(at[0][1] > av[0][1]) {
            at[0][1] = av[0][1]
          }
          if(at[1][0] < av[1][0]) {
            at[1][0] = av[1][0]
          }
          if(at[1][1] > av[1][1]) {
            at[1][1] = av[1][1]
          }
          if(at[2][0] > av[2][0]) {
            at[2][0] = av[2][0]
          }
          if(at[2][1] < av[2][1]) {
            at[2][1] = av[2][1]
          }
          if(at[3][0] < av[3][0]) {
            at[3][0] = av[3][0]
          }
          if(at[3][1] < av[3][1]) {
            at[3][1] = av[3][1]
          }
        }
        return at
      }
      for(ar = 0;ar < m;ar++) {
        av = aw[ar].getRect(au);
        av.right = av.width + av.x;
        av.bottom = av.height + av.y;
        if(at === z) {
          at = av
        }
        if(at.x > av.x) {
          at.x = av.x
        }
        if(at.y > av.y) {
          at.y = av.y
        }
        if(at.right < av.right) {
          at.right = av.right
        }
        if(at.bottom < av.bottom) {
          at.bottom = av.bottom
        }
      }
      at.width = at.right - at.x;
      at.height = at.bottom - at.y;
      return at
    };
    this.canvas = function(ar) {
      if(ar === z) {
        return this.idCanvas
      }
      if(this.optns.canvas.id == ar) {
        return this
      }
      var av = -1, m = 0, ax = ad.length;
      for(var au = 0;au < ax;au++) {
        var aw = ad[au].optns.id;
        if(aw == ar) {
          av = au
        }
        if(aw == this.optns.canvas.id) {
          m = au
        }
      }
      if(av < 0) {
        av = ad.length;
        P.canvas(ar)
      }
      this.optns.canvas.id = ar;
      this.optns.canvas.number = av;
      ad[m].layers.splice(this.optns.number, 1);
      var at = ad[av].layers;
      this._level = this.optns.number = at.length;
      at[this._level] = this;
      l(this.objs, this.optns.id, this._level, ar, av);
      l(this.grdntsnptrns, this.optns.id, this._level, ar, av);
      ad[av].optns.redraw = 1;
      return this
    };
    this.up = function(ar) {
      if(ar === z) {
        ar = 1
      }
      if(ar == "top") {
        this.level(ar)
      }else {
        var m = D(this).layers[this.optns.number + ar];
        if(m !== z) {
          ar = m._level + 1 - this._level
        }
        this.level(this._level + ar)
      }
      return this
    };
    this.down = function(ar) {
      if(ar == z) {
        ar = 1
      }
      if(ar == "bottom") {
        this.level(ar)
      }else {
        var m = D(this).layers[this.optns.number - ar];
        if(m !== z) {
          ar = this._level - (m._level - 1)
        }
        this.level(this._level - ar)
      }
      return this
    };
    this.level = function(at) {
      if(at == z) {
        return this._level
      }
      var ar = D(this), m = ar.optns;
      if(at == "bottom") {
        if(this.optns.number == 0) {
          at = this._level
        }else {
          at = ar.layers[0]._level - 1
        }
      }
      if(at == "top") {
        if(this.optns.number == ar.layers.length - 1) {
          at = this._level
        }else {
          at = ar.layers[ar.layers.length - 1]._level + 1
        }
      }
      this._level = at;
      m.anyLayerLevelChanged = true;
      m.redraw = 1;
      return this
    };
    this.del = function() {
      var m = D(this).optns;
      m.anyLayerDeleted = true;
      this.draw = false;
      m.redraw = 1;
      return
    };
    this.setOptns = function(m) {
      m.setTransform(1, 0, 0, 1, 0, 0);
      w.layer.prototype.setOptns.call(this, m);
      return this
    };
    this.afterDraw = function(m) {
      m.ctx.closePath();
      m.ctx.restore();
      if(this.optns.clipObject) {
        w.layer.prototype.afterDraw.call(this.optns.clipObject, m)
      }
    };
    this.clone = function(at, m) {
      var ar = P.layer(at);
      J(ar, this);
      J(ar.optns.transformMatrix, this.optns.transformMatrix);
      J(ar.optns.translateMatrix, this.optns.translateMatrix);
      J(ar.optns.scaleMatrix, this.optns.scaleMatrix);
      J(ar.optns.rotateMatrix, this.optns.rotateMatrix);
      ar.canvas(D(this).optns.id);
      if(m === z) {
        return ar
      }
      return ar.animate(m)
    };
    this.isPointIn = function(m, av, at) {
      var au = this.objs, ar;
      for(ar = 0;ar < au.length;ar++) {
        if(au[ar].isPointIn(m, av, at)) {
          return true
        }
      }
      return false
    };
    this.opacity = function(at) {
      var ar = this.objs;
      for(var m = 0;m < ar.length;m++) {
        ar[m].attr("opacity", at)
      }
      return this
    };
    this.fadeTo = function(aw, au, ax, at, ar) {
      if(au === z) {
        au = 600
      }
      var av = this.objs;
      for(var m = 0;m < av.length;m++) {
        av[m].animate({opacity:aw}, au, ax, at, ar)
      }
      return this
    };
    this.draw = function(ax) {
      var at = this.optns, av = at.buffer, m = ax.ctx;
      if(av.val) {
        m.drawImage(av.cnv, av.x, av.y);
        return this
      }
      for(var au = 0;au < this.grdntsnptrns.length;au++) {
        this.grdntsnptrns[au].create(ax)
      }
      if(at.anyObjLevelChanged) {
        T(this.objs);
        at.anyObjLevelChanged = false
      }
      if(at.anyObjDeleted) {
        W(this.objs);
        at.anyObjDeleted = false
      }
      m.globalCompositeOperation = at.gCO;
      for(au = 0;au < this.objs.length;au++) {
        var ar = this.objs[au];
        if(typeof ar.draw == "function") {
          this.setOptns(m);
          if(ar.beforeDraw(ax)) {
            if(typeof ar.draw == "function") {
              var aw = ar.optns.buffer;
              if(aw.val) {
                m.drawImage(aw.cnv, aw.x, aw.y)
              }else {
                ar.draw(m)
              }
              if(av.optns) {
                ar.afterDraw(av.optns)
              }else {
                ar.afterDraw(ax)
              }
            }
          }
        }
      }
      return this
    };
    this.objects = function(at) {
      var ar = G(), m = 0;
      while(this.objs[m] !== z) {
        ar.elements[m] = this.objs[m++]
      }
      if(at !== z) {
        return ar.find(at)
      }
      return ar
    };
    this.base = function(aw) {
      var ar = ad[X], av = ar.layers, at = ar.optns;
      w.layer.prototype.base.call(this, 0, 0, true);
      var m = av.length;
      av[m] = this;
      this.objs = [];
      this.grdntsnptrns = [];
      this._level = m ? av[m - 1]._level + 1 : 0;
      this.optns.number = m;
      this.optns.id = aw;
      var au = this.optns;
      au.anyObjDeleted = false;
      au.anyObjLevelChanged = false;
      au.gCO = at.gCO;
      au.canvas.id = at.id;
      au.canvas.number = X;
      return this
    };
    this._proto = "layer"
  };
  w.layer.prototype = new w.object;
  function aa(ar) {
    var m = new w.layer;
    return m.base(ar)
  }
  w.imageData = function() {
    this.filter = function(m, at) {
      var ar = g[m];
      ar.fn.call(this, this._width, this._height, ar.matrix, at);
      return this
    };
    this.getRect = function(ar) {
      var m = {x:this._x, y:this._y, width:this._width, height:this._height};
      return b(this, m, ar)
    };
    this.setPixel = function(ar, av, at) {
      var m, au = (ar + av * this._width) * 4;
      if(at.r !== z) {
        m = at
      }else {
        if(at[0] !== z) {
          if(!at.charAt) {
            m = {r:at[0], g:at[1], b:at[2], a:at[3]}
          }else {
            m = s(at)
          }
        }
      }
      this._data[au + 0] = m.r;
      this._data[au + 1] = m.g;
      this._data[au + 2] = m.b;
      this._data[au + 3] = m.a * 255;
      j(this);
      return this
    };
    this.getPixel = function(m, at) {
      var ar = (m + at * this._width) * 4;
      return[this._data[ar + 0], this._data[ar + 1], this._data[ar + 2], this._data[ar + 3] / 255]
    };
    this._getX = 0;
    this._getY = 0;
    this.getData = function(ar, aw, au, m) {
      this._getX = ar;
      this._getY = aw;
      this._width = au;
      this._height = m;
      var at = D(this).optns.ctx;
      try {
        this._imgData = at.getImageData(this._getX, this._getY, this._width, this._height)
      }catch(av) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
        this._imgData = at.getImageData(this._getX, this._getY, this._width, this._height)
      }
      this._data = this._imgData.data;
      j(this);
      return this
    };
    this.putData = function(m, ar) {
      if(m !== z) {
        this._x = m
      }
      if(ar !== z) {
        this._y = ar
      }
      this._putData = true;
      j(this);
      return this
    };
    this.clone = function() {
      var m = w.imageData.prototype.clone.call(this);
      m._imgData = z;
      return m
    };
    this.draw = function(m) {
      if(this._imgData === z) {
        this._imgData = m.createImageData(this._width, this._height);
        for(var ar = 0;ar < this._width * this._height * 4;ar++) {
          this._imgData.data[ar] = this._data[ar]
        }
        this._data = this._imgData.data
      }
      if(this._putData) {
        m.putImageData(this._imgData, this._x, this._y)
      }
    };
    this.base = function(av, m) {
      w.imageData.prototype.base.call(this);
      if(m === z) {
        var aw = av;
        if(aw._width !== z) {
          av = aw._width;
          m = aw._height
        }else {
          av = af(av, {width:0, height:0});
          m = av.height;
          av = av.width
        }
      }
      this._width = av;
      this._height = m;
      this._data = [];
      for(var au = 0;au < this._width;au++) {
        for(var at = 0;at < this._height;at++) {
          var ar = (au + at * this._width) * 4;
          this._data[ar + 0] = 0;
          this._data[ar + 1] = 0;
          this._data[ar + 2] = 0;
          this._data[ar + 3] = 0
        }
      }
      return this
    };
    this._putData = false;
    this._proto = "imageData"
  };
  w.imageData.prototype = new w.object;
  w.image = function() {
    this.getRect = function(ar) {
      var m = {x:this._x, y:this._y, width:this._width, height:this._height};
      return b(this, m, ar)
    };
    this.draw = function(m) {
      m.drawImage(this._img, this._sx, this._sy, this._swidth, this._sheight, this._x, this._y, this._width, this._height)
    };
    this.base = function(at, ay, av, m, az, ax, aw, au, ar) {
      if(typeof at != "object" || at.src !== z || at.nodeName !== z) {
        at = {image:at, x:ay, y:av, width:m, height:az, sx:ax, sy:aw, swidth:au, sheight:ar}
      }
      at = af(at, {width:false, height:false, sx:0, sy:0, swidth:false, sheight:false});
      if(at.width === false) {
        at.width = at.image.width;
        at.height = at.image.height
      }
      if(at.swidth === false) {
        at.swidth = at.image.width;
        at.sheight = at.image.height
      }
      w.image.prototype.base.call(this, at);
      this._img = at.image;
      this._width = at.width;
      this._height = at.height;
      this._sx = at.sx;
      this._sy = at.sy;
      this._swidth = at.swidth;
      this._sheight = at.sheight;
      return this
    };
    this._proto = "image"
  };
  w.image.prototype = new w.object;
  w.groups = function() {
    for(var m in w) {
      if(m == "group" || m == "groups") {
        continue
      }
      var at = new w[m];
      for(var ar in at) {
        if(typeof at[ar] == "function" && this[ar] === z) {
          (function(av, au) {
            av[au] = function() {
              var az = [];
              var aw = [];
              var ay = 0;
              while(arguments[ay] !== z) {
                aw[ay] = arguments[ay++]
              }
              for(ay = 0;ay < this.elements.length;ay++) {
                var ax = this.elements[ay];
                J(az, aw);
                if(typeof ax[au] == "function") {
                  ax[au].apply(ax, az)
                }
              }
              return this
            }
          })(this, ar)
        }
      }
    }
    this.reverse = function() {
      var au = this.elements;
      this.elements = this.unmatchedElements;
      this.unmatchedElements = au;
      return this
    };
    this.end = function(au) {
      if(this.previousGroup === z || au === 0) {
        return this
      }
      if(au !== z) {
        au--
      }
      return this.previousGroup.end(au)
    };
    this.find = function(au) {
      var aC = G(), aB = au.attrs, aD = au.fns || [], aw, av, ax, aE, aA, az, ay;
      aC.previousGroup = this;
      for(aw = 0;aw < this.elements.length;aw++) {
        aC.elements[aw] = this.elements[aw]
      }
      if(aB !== z) {
        for(av in aB) {
          if(aB.hasOwnProperty(av)) {
            if(typeof aB[av] != "object") {
              aB[av] = {val:aB[av], rel:"=="}
            }
            aD[aD.length] = {fn:"attr", args:[av], val:aB[av].val, rel:aB[av].rel}
          }
        }
      }
      if(aD.length) {
        for(aw = 0;aw < aC.elements.length;aw++) {
          ax = aC.elements[aw];
          for(av = 0;av < aD.length;av++) {
            aA = aD[av];
            ay = aA.val;
            aE = aA.rel;
            if(typeof ax[aA.fn] == "function") {
              az = ax[aA.fn].apply(ax, aA.args)
            }else {
              aE = "del"
            }
            switch(aE) {
              case "!=":
                if(!(az != ay)) {
                  aE = "del"
                }
                break;
              case "!==":
                if(!(az !== ay)) {
                  aE = "del"
                }
                break;
              case "==":
                if(!(az == ay)) {
                  aE = "del"
                }
                break;
              case "===":
                if(!(az === ay)) {
                  aE = "del"
                }
                break;
              case ">=":
                if(!(az >= ay)) {
                  aE = "del"
                }
                break;
              case "<=":
                if(!(az <= ay)) {
                  aE = "del"
                }
                break;
              case ">":
                if(!(az > ay)) {
                  aE = "del"
                }
                break;
              case "<":
                if(!(az < ay)) {
                  aE = "del"
                }
                break;
              case "typeof":
                if(!(typeof az == ay)) {
                  aE = "del"
                }
                break
            }
            if(aE == "del") {
              aC.unmatchedElements[aC.unmatchedElements.length] = ax;
              aC.elements.splice(aw, 1);
              aw--;
              break
            }
          }
        }
      }
      return aC
    };
    this.base = function() {
      this.elements = [];
      this.unmatchedElements = [];
      return this
    }
  };
  w.group = function() {
    this._proto = "group"
  };
  w.group.prototype = new w.groups;
  function G() {
    var m = new w.group;
    return m.base()
  }
  P.addFunction = function(ar, at, m) {
    w[m || "object"].prototype[ar] = at;
    return P
  };
  P.addObject = function(at, av, m, au) {
    w[at] = function(aw) {
      this.draw = w[aw].draw;
      this.base = w[aw].base;
      this._proto = aw
    };
    var ar = w[at];
    if(au === z) {
      au = "shape"
    }
    ar.prototype = new w[au];
    ar.draw = m;
    ar.base = function(ax, aA, aw) {
      ar.prototype.base.call(this, aA);
      var az = 0;
      for(var ay in aA) {
        this["_" + ay] = aw[az] || aA[ay];
        if(ay == "color") {
          this.color(aw[az] || aA[ay])
        }
        az++
      }
      return this
    };
    (function(aw, ax) {
      P[aw] = function() {
        var ay = new w[aw](aw);
        return ay.base(aw, ax, arguments)
      }
    })(at, av);
    return P
  };
  P.addAnimateFunction = function(m, ar) {
    h[m] = ar;
    return P
  };
  P.addImageDataFilter = function(m, ar) {
    if(g[m] === z) {
      g[m] = {}
    }
    if(ar.fn !== z) {
      g[m].fn = ar.fn
    }
    if(ar.matrix !== z && ar.type === z) {
      g[m].matrix = ar.matrix
    }
    if(ar.type !== z) {
      g[m].matrix[type] = ar.matrix
    }
    return P
  };
  P.clear = function(m) {
    if(ad[0] === z) {
      return P
    }
    if(m === z) {
      ad[0].clear();
      return P
    }
    P.canvas(m).clear();
    return P
  };
  P.pause = function(m) {
    if(m === z) {
      ad[0].pause();
      return P
    }
    P.canvas(m).pause();
    return P
  };
  P.start = function(m, ar) {
    P.canvas(m).start(ar);
    return P
  };
  P.pattern = function(m, ar) {
    var at = new w.pattern;
    return at.base(m, ar)
  };
  P.lGradient = function(at, av, ar, au, m) {
    var aw = new w.lGradient;
    return aw.base(at, av, ar, au, m)
  };
  P.rGradient = function(av, ax, au, at, aw, ar, m) {
    var ay = new w.rGradient;
    return ay.base(av, ax, au, at, aw, ar, m)
  };
  P.line = function(at, ar, au) {
    var m = new w.line;
    return m.base(at, ar, au)
  };
  P.qCurve = function(at, m, au) {
    var ar = new w.qCurve;
    return ar.base(at, m, au)
  };
  P.bCurve = function(ar, m, au) {
    var at = new w.bCurve;
    return at.base(ar, m, au)
  };
  P.imageData = function(ar, m) {
    var at = new w.imageData;
    return at.base(ar, m)
  };
  P.image = function(av, az, aw, m, aA, ay, ax, au, ar) {
    var at = new w.image;
    return at.base(av, az, aw, m, aA, ay, ax, au, ar)
  };
  P.circle = function(ar, aw, m, at, av) {
    var au = new w.circle;
    return au.base(ar, aw, m, at, av)
  };
  P.rect = function(ar, ax, au, m, at, aw) {
    var av = new w.rect;
    return av.base(ar, ax, au, m, at, aw)
  };
  P.arc = function(ay, ax, av, aw, ar, at, au, az) {
    var m = new w.arc;
    return m.base(ay, ax, av, aw, ar, at, au, az)
  };
  P.text = function(at, m, ax, au, ar, av) {
    var aw = new w.text;
    return aw.base(at, m, ax, au, ar, av)
  };
  P.canvas = function(ar) {
    if(ar === z) {
      return ad[0]
    }
    var m = ad.length;
    for(var au = 0;au < m;au++) {
      if(ad[au].optns) {
        if(ad[au].optns.id == ar) {
          return ad[au]
        }
      }
    }
    var at = {id:function(av) {
      if(av === z) {
        return this.optns.id
      }
      this.optns.id = av;
      return this
    }};
    ad[m] = at;
    X = m;
    at.cnv = document.getElementById(ar);
    if("\v" == "v") {
      if(typeof G_vmlCanvasManager !== "undefined") {
        G_vmlCanvasManager.initElement(at.cnv)
      }
      if(typeof FlashCanvas !== "undefined") {
        FlashCanvas.initElement(at.cnv)
      }
    }
    at.width = function(av) {
      if(av === z) {
        return this.cnv.width
      }
      this.optns.width = this.cnv.width = av;
      this.cnv.style.width = av + "px";
      this.optns.redraw = 1;
      return this
    };
    at.height = function(av) {
      if(av === z) {
        return this.cnv.height
      }
      this.optns.heigth = this.cnv.height = av;
      this.cnv.style.height = av + "px";
      this.optns.redraw = 1;
      return this
    };
    at.optns = {id:ar, number:X, ctx:at.cnv.getContext("2d"), width:at.cnv.offsetWidth || at.cnv.width, height:at.cnv.offsetHeight || at.cnv.height, anyLayerDeleted:false, anyLayerLevelChanged:false, keyDown:{val:false, code:false}, keyUp:{val:false, code:false}, keyPress:{val:false, code:false}, mousemove:{val:false, x:false, y:false, object:false}, click:{val:false, x:false, y:false, objects:[]}, dblclick:{val:false, x:false, y:false, objects:[]}, mouseup:{val:false, x:false, y:false, objects:[]}, 
    mousedown:{val:false, x:false, y:false, objects:[]}, drag:{object:false, x:0, y:0}, gCO:"source-over", redraw:1};
    at.toDataURL = function() {
      return at.cnv.toDataURL.apply(at.cnv, arguments)
    };
    at.layers = [];
    at.interval = 0;
    P.layer(ar + "Layer_0").canvas(ar);
    at.start = function(ax) {
      X = this.optns.number;
      if(ax) {
        if(this.interval) {
          return this
        }
        this.isAnimated = ax;
        var ay = C(this.cnv);
        this.optns.x = ay.left + (parseInt(this.cnv.style.borderTopWidth) || 0);
        this.optns.y = ay.top + (parseInt(this.cnv.style.borderLeftWidth) || 0);
        var aw = ad[this.optns.number], av = aw.optns;
        this.cnv.onclick = function(az) {
          u(az, "click", av)
        };
        this.cnv.ondblclick = function(aA) {
          u(aA, "dblclick", av);
          var az = av.mousemove.val;
          av.mousemove.val = true;
          setTimeout(function() {
            av.mousemove.val = az
          }, 3E3)
        };
        this.cnv.onmousedown = function(az) {
          u(az, "mousedown", av)
        };
        this.cnv.onmouseup = function(az) {
          u(az, "mouseup", av)
        };
        this.cnv.onkeyup = function(az) {
          ag(az, "keyUp", av)
        };
        this.cnv.onkeydown = function(az) {
          ag(az, "keyDown", av)
        };
        this.cnv.onkeypress = function(az) {
          ag(az, "keyPress", av)
        };
        this.cnv.onmouseout = this.cnv.onmousemove = function(az) {
          u(az, "mousemove", av)
        };
        av.timeLast = new Date;
        this.interval = c(function(az) {
          aw.interval = aw.interval || 1;
          aw.frame(az)
        }, this.cnv)
      }else {
        return this.frame()
      }
      return this
    };
    at.pause = function() {
      I(this.interval);
      this.interval = 0;
      return this
    };
    at.restart = function() {
      return this.pause().start(true)
    };
    at.del = function() {
      I(this.interval);
      this.layers = [];
      ad.splice(this.optns.number, 1);
      for(var ay = 0;ay < ad.length;ay++) {
        var aw = ad[ay], az = aw.layers, aA = az.length;
        aw.optns.number = ay;
        for(var av = 0;av < aA;av++) {
          var ax = az[av];
          ax.optns.canvas.number = ay;
          l(ax.objs, ax.optns.id, ax.optns.number, aw.optns.id, aw.optns.number);
          l(ax.grdntsnptrns, ax.optns.id, ax.optns.number, aw.optns.id, aw.optns.number)
        }
      }
      if(this.cnv.parentNode) {
        this.cnv.parentNode.removeChild(this.cnv)
      }
      X = 0;
      return false
    };
    at.clear = function() {
      I(this.interval);
      this.interval = 0;
      this.layers = [];
      P.layer(this.optns.id + "Layer_0").canvas(this.optns.id);
      this.optns.ctx.clearRect(0, 0, this.optns.width, this.optns.height);
      this.optns.redraw++;
      return this
    };
    at.frame = function(az) {
      var aA = this.optns, aw = this;
      az = az || new Date;
      aA.timeDiff = az - aA.timeLast;
      aA.timeLast = az;
      if(this.interval) {
        this.interval = c(function(aW) {
          aw.frame(aW)
        }, aw.cnv);
        this.interval = this.interval || 1
      }
      if(!aA.redraw) {
        return this
      }
      aA.redraw--;
      aA.ctx.clearRect(0, 0, aA.width, aA.height);
      if(this.layers.length == 0) {
        return this
      }
      m = this.layers.length;
      if(aA.anyLayerLevelChanged) {
        m = T(this.layers)
      }
      if(aA.anyLayerDeleted) {
        m = W(this.layers)
      }
      if(aA.anyLayerLevelChanged || aA.anyLayerDeleted) {
        aA.anyLayerLevelChanged = aA.anyLayerDeleted = false;
        for(var aJ = 0;aJ < m;aJ++) {
          var aU = this.layers[aJ], aB = aU.optns;
          l(aU.objs, aB.id, aB.number, this.optns.id, this.optns.number);
          l(aU.grdntsnptrns, aB.id, aB.number, ar, this.optns.number)
        }
      }
      for(aJ = 0;aJ < m;aJ++) {
        var aV = this.layers[aJ];
        if(typeof aV.draw == "function") {
          if(aV.beforeDraw(aA)) {
            if(typeof aV.draw == "function") {
              aV.draw(aA);
              aV.afterDraw(aA)
            }
          }
        }
      }
      var aM = aA.mousemove;
      var aS = aA.mousedown;
      var aP = aA.mouseup;
      var aD = this.optns.click;
      var aK = this.optns.dblclick;
      if(aM.x != false) {
        if(aA.drag.object != false) {
          var aL = aA.drag, av = aL.object;
          av.translate(aM.x - aL.x, aM.y - aL.y);
          aL.x = aM.x;
          aL.y = aM.y;
          if(aL.drag) {
            aL.drag.call(av, {x:aM.x, y:aM.y})
          }
        }
        var aF = this.optns.point || {};
        aF.event = aM.event;
        if(aM.object != false) {
          var aN = aM.object, aC = aj(aN);
          if(N === aN) {
            if(typeof aN.onmousemove === "function") {
              aN.onmousemove(aF)
            }
            if(aC === ae) {
              if(typeof aC.onmousemove === "function") {
                aC.onmousemove(aF)
              }
            }else {
              if(ae) {
                if(typeof ae.onmouseout === "function") {
                  ae.onmouseout(aF)
                }
              }
              if(typeof aC.onmouseover === "function") {
                aC.onmouseover(aF)
              }
              ae = aC
            }
          }else {
            if(N) {
              if(typeof N.onmouseout === "function") {
                N.onmouseout(aF)
              }
            }
            if(typeof aN.onmouseover === "function") {
              aN.onmouseover(aF)
            }
            N = aN
          }
        }else {
          if(N) {
            if(typeof N.onmouseout == "function") {
              N.onmouseout(aF)
            }
            N = false
          }
          if(ae) {
            if(typeof ae.onmouseout == "function") {
              ae.onmouseout(aF)
            }
            ae = false
          }
        }
        aA.mousemove.object = false
      }
      if(aS.objects.length) {
        var aQ = aS.objects.length - 1;
        mdCicle:for(aJ = aQ;aJ > -1;aJ--) {
          var aT = [aS.objects[aJ], aj(aS.objects[aJ])], aR;
          for(var aH = 0;aH < 2;aH++) {
            aR = aT[aH];
            if(aR.optns.drag.val == true && aR.optns.drag.disabled == false && aJ == aQ) {
              aL = aA.drag;
              av = aL.object = aR.optns.drag.object.visible(true);
              aL.drag = aR.optns.drag.drag;
              aL.init = aR;
              var aI = aL.init.optns;
              if(aI.drag.params !== z) {
                av.animate(aI.drag.params)
              }
              aL.x = aL.startX = aS.x;
              aL.y = aL.startY = aS.y;
              if(av != aL.init && aI.drag.type != "clone") {
                aF = ac(aS.x, aS.y, av.matrix());
                av.translate(aF.x - av._x, aF.y - av._y)
              }
              av.translate(aI.drag.shiftX, aI.drag.shiftY);
              if(typeof aI.drag.start == "function") {
                aI.drag.start.call(av, {x:aS.x, y:aS.y})
              }
            }
            if(typeof aR.onmousedown == "function") {
              if(aR.onmousedown({x:aS.x, y:aS.y, event:aS.event}) === false) {
                break mdCicle
              }
            }
          }
        }
        aS.objects = []
      }
      if(aP.objects.length) {
        muCicle:for(aJ = aP.objects.length - 1;aJ > -1;aJ--) {
          var aE = [aP.objects[aJ], aj(aP.objects[aJ])], ay;
          for(aH = 0;aH < 2;aH++) {
            ay = aE[aH];
            if(an(ay, aP, aA)) {
              aD.objects = []
            }
            if(typeof ay.onmouseup == "function") {
              if(ay.onmouseup({x:aP.x, y:aP.y, event:aP.event}) === false) {
                break muCicle
              }
            }
          }
        }
        this.optns.drag = {object:false, x:0, y:0};
        aP.objects = []
      }
      if(aD.objects.length) {
        cCicle:for(aJ = aD.objects.length - 1;aJ > -1;aJ--) {
          var aG = [aD.objects[aJ], aj(aD.objects[aJ])], ax;
          for(aH = 0;aH < 2;aH++) {
            ax = aG[aH];
            an(ax, aD, aA);
            if(typeof ax.onclick == "function") {
              if(ax.onclick({x:aD.x, y:aD.y, event:aD.event}) === false) {
                break cCicle
              }
            }
          }
        }
        this.optns.drag = {object:false, x:0, y:0};
        aD.objects = []
      }
      if(aK.objects.length) {
        dcCicle:for(aJ = aK.objects.length - 1;aJ > -1;aJ--) {
          var aO = [aK.objects[aJ], aj(aK.objects[aJ])];
          for(aH = 0;aH < 2;aH++) {
            if(typeof aO[aH].ondblclick == "function") {
              if(aO[aH].ondblclick({x:aK.x, y:aK.y, event:aK.event}) === false) {
                break dcCicle
              }
            }
          }
        }
        aK.objects = []
      }
      aA.keyUp.val = aA.keyDown.val = aA.keyPress.val = aD.x = aK.x = aP.x = aS.x = aM.x = false;
      return this
    };
    return at
  };
  function an(ar, au, m) {
    var at = m.drag;
    if(m.drag.init && m.drag.object) {
      if(ar.optns.drop.val == true) {
        if(at.init == at.object) {
          at.init.visible(true)
        }
        if(typeof ar.optns.drop.fn == "function") {
          ar.optns.drop.fn.call(ar, at.init)
        }
      }else {
        at.object.visible(false);
        at.init.visible(true);
        at.init.optns.translateMatrix[0][2] = at.object.optns.translateMatrix[0][2];
        at.init.optns.translateMatrix[1][2] = at.object.optns.translateMatrix[1][2];
        k(at.init);
        if(at.object != at.init) {
          at.object.visible(false)
        }
        if(typeof at.init.optns.drag.stop == "function") {
          at.init.optns.drag.stop.call(at.init, {x:au.x, y:au.y})
        }
      }
      return at.x != at.startX || at.y !== at.startY
    }
    return false
  }
  P.layer = function(au) {
    if(au === z) {
      return ad[0].layers[0]
    }
    for(var at = 0;at < ad.length;at++) {
      var ar = ad[at].layers;
      for(var m = 0;m < ar.length;m++) {
        if(ar[m].optns.id == au) {
          return ar[m]
        }
      }
    }
    return aa(au)
  };
  ab.jCanvaScript = ab.jc = P
})(window, undefined);
goog.provide("client.scene");
goog.require("cljs.core");
goog.require("goog.dom");
goog.require("client.const$");
goog.require("jc");
client.scene.buildKey = function buildKey(lat, lng) {
  return cljs.core.symbol.call(null, lat + "#" + lng)
};
client.scene.Scene = function(registry) {
  this.registry = registry
};
client.scene.Scene.cljs$lang$type = true;
client.scene.Scene.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.call(null, "client.scene/Scene")
};
client.scene.Scene.prototype.update = function(lat, lng, size) {
  var this__6129 = this;
  var ___6130 = this;
  var key__6131 = client.scene.buildKey.call(null, lat, lng);
  if(!cljs.core.contains_QMARK_.call(null, this__6129.registry, key__6131)) {
    cljs.core.conj.call(null, this__6129.registry, cljs.core.PersistentVector.fromArray([key__6131, jc.circle.call(null, lat, lng, 1, "#ff0000", true)], true))
  }else {
  }
  return this__6129.registry.call(null, key__6131).draw(size)
};
client.scene.Scene.prototype.remove = function(lat, lng) {
  var this__6132 = this;
  var ___6133 = this;
  var key__6134 = client.scene.buildKey.call(null, lat, lng);
  if(cljs.core.contains_QMARK_.call(null, this__6132.registry, key__6134)) {
    this__6132.registry.call(null, key__6134).del();
    return cljs.core.dissoc.call(null, this__6132.registry, key__6134)
  }else {
    return null
  }
};
client.scene.Scene;
client.scene.$ = new client.scene.Scene(cljs.core.ObjMap.EMPTY);
client.scene.testAnimation = function testAnimation() {
  var viewPortSize__6145 = goog.dom.getViewportSize();
  var maxW__6146 = viewPortSize__6145.width;
  var maxH__6147 = viewPortSize__6145.height;
  var r__6148 = Math.floor(Math.random() * 254);
  var g__6149 = Math.floor(Math.random() * 254);
  var b__6150 = Math.floor(Math.random() * 254);
  var x__6151 = Math.floor(Math.random() * maxW__6146);
  var y__6152 = Math.floor(Math.random() * maxH__6147);
  var color__6153 = "rgba(" + r__6148 + "," + g__6149 + "," + b__6150 + ",1)";
  jc.circle.call(null, x__6151, y__6152, 1, color__6153, true).animate({"radius":100, "opacity":0}, 500, function() {
    var self__6154 = this;
    return self__6154.del()
  });
  return null
};
client.scene.init = function init(parent) {
  var canvas_name__6159 = client.const$.maps.call(null, "\ufdd0'overlay_id");
  var attr__6160 = {"class":canvas_name__6159, "id":canvas_name__6159};
  var viewPortSize__6161 = goog.dom.getViewportSize();
  var canvas__6162 = goog.dom.createDom("canvas", attr__6160, null);
  goog.dom.insertSiblingBefore(canvas__6162, parent);
  canvas__6162.width = viewPortSize__6161.width;
  canvas__6162.height = viewPortSize__6161.height;
  jc.start.call(null, canvas_name__6159, true);
  setInterval(client.scene.testAnimation);
  return null
};
goog.provide("vertx");
var vertx = vertx || {};
vertx.EventBus = function(url, options) {
  var that = this;
  var sockJSConn = new SockJS(url, options);
  var handlerMap = {};
  var replyHandlers = {};
  var state = vertx.EventBus.CONNECTING;
  that.onopen = null;
  that.onclose = null;
  that.send = function(address, message, replyHandler) {
    sendOrPub("send", address, message, replyHandler)
  };
  that.publish = function(address, message, replyHandler) {
    sendOrPub("publish", address, message, replyHandler)
  };
  that.registerHandler = function(address, handler) {
    checkSpecified("address", "string", address);
    checkSpecified("handler", "function", handler);
    checkOpen();
    var handlers = handlerMap[address];
    if(!handlers) {
      handlers = [handler];
      handlerMap[address] = handlers;
      var msg = {type:"register", address:address};
      sockJSConn.send(JSON.stringify(msg))
    }else {
      handlers[handlers.length] = handler
    }
  };
  that.unregisterHandler = function(address, handler) {
    checkSpecified("address", "string", address);
    checkSpecified("handler", "function", handler);
    checkOpen();
    var handlers = handlerMap[address];
    if(handlers) {
      var idx = handlers.indexOf(handler);
      if(idx != -1) {
        handlers.splice(idx, 1)
      }
      if(handlers.length == 0) {
        var msg = {type:"unregister", address:address};
        sockJSConn.send(JSON.stringify(msg));
        delete handlerMap[address]
      }
    }
  };
  that.close = function() {
    checkOpen();
    state = vertx.EventBus.CLOSING;
    sockJSConn.close()
  };
  that.readyState = function() {
    return state
  };
  sockJSConn.onopen = function() {
    state = vertx.EventBus.OPEN;
    if(that.onopen) {
      that.onopen()
    }
  };
  sockJSConn.onclose = function() {
    state = vertx.EventBus.CLOSED;
    if(that.onclose) {
      that.onclose()
    }
  };
  sockJSConn.onmessage = function(e) {
    var msg = e.data;
    var json = JSON.parse(msg);
    var body = json.body;
    var replyAddress = json.replyAddress;
    var address = json.address;
    var replyHandler;
    if(replyAddress) {
      replyHandler = function(reply, replyHandler) {
        that.send(replyAddress, reply, replyHandler)
      }
    }
    var handlers = handlerMap[address];
    if(handlers) {
      var copy = handlers.slice(0);
      for(var i = 0;i < copy.length;i++) {
        copy[i](body, replyHandler)
      }
    }else {
      var handler = replyHandlers[address];
      if(handler) {
        delete replyHandlers[replyAddress];
        handler(body, replyHandler)
      }
    }
  };
  function sendOrPub(sendOrPub, address, message, replyHandler) {
    checkSpecified("address", "string", address);
    checkSpecified("message", "object", message);
    checkSpecified("replyHandler", "function", replyHandler, true);
    checkOpen();
    var envelope = {type:sendOrPub, address:address, body:message};
    if(replyHandler) {
      var replyAddress = makeUUID();
      envelope.replyAddress = replyAddress;
      replyHandlers[replyAddress] = replyHandler
    }
    var str = JSON.stringify(envelope);
    sockJSConn.send(str)
  }
  function checkOpen() {
    if(state != vertx.EventBus.OPEN) {
      throw new Error("INVALID_STATE_ERR");
    }
  }
  function checkSpecified(paramName, paramType, param, optional) {
    if(!optional && !param) {
      throw new Error("Parameter " + paramName + " must be specified");
    }
    if(param && typeof param != paramType) {
      throw new Error("Parameter " + paramName + " must be of type " + paramType);
    }
  }
  function isFunction(obj) {
    return!!(obj && obj.constructor && obj.call && obj.apply)
  }
  function makeUUID() {
    return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(a, b) {
      return b = Math.random() * 16, (a == "y" ? b & 3 | 8 : b | 0).toString(16)
    })
  }
};
vertx.EventBus.CONNECTING = 0;
vertx.EventBus.OPEN = 1;
vertx.EventBus.CLOSING = 2;
vertx.EventBus.CLOSED = 3;
goog.provide("google.maps");
window.google = window.google || {};
google.maps = google.maps || {};
(function() {
  function getScript(src) {
    document.write("<" + 'script src="' + src + '"' + ' type="text/javascript"><' + "/script>")
  }
  var modules = google.maps.modules = {};
  google.maps.__gjsload__ = function(name, text) {
    modules[name] = text
  };
  google.maps.Load = function(apiLoad) {
    delete google.maps.Load;
    apiLoad([null, [[["http://mt0.googleapis.com/vt?lyrs=m@182000000&src=api&hl=en-US&", "http://mt1.googleapis.com/vt?lyrs=m@182000000&src=api&hl=en-US&"], null, null, null, null, "m@182000000"], [["http://khm0.googleapis.com/kh?v=115&hl=en-US&", "http://khm1.googleapis.com/kh?v=115&hl=en-US&"], null, null, null, 1, "115"], [["http://mt0.googleapis.com/vt?lyrs=h@182000000&src=api&hl=en-US&", "http://mt1.googleapis.com/vt?lyrs=h@182000000&src=api&hl=en-US&"], null, null, "imgtp=png32&", null, "h@182000000"], 
    [["http://mt0.googleapis.com/vt?lyrs=t@129,r@182000000&src=api&hl=en-US&", "http://mt1.googleapis.com/vt?lyrs=t@129,r@182000000&src=api&hl=en-US&"], null, null, null, null, "t@129,r@182000000"], null, [[null, 0, 7, 7, [[[33E7, 124605E4], [3862E5, 12936E5]], [[3665E5, 1297E6], [3862E5, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&"]], [null, 0, 8, 8, [[[33E7, 124605E4], [3862E5, 12796E5]], [[345E6, 12796E5], [3862E5, 12867E5]], 
    [[35469E4, 12867E5], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&"]], [null, 0, 9, 9, [[[33E7, 124605E4], [3862E5, 12796E5]], [[34E7, 12796E5], [3862E5, 12867E5]], [[3489E5, 12867E5], [3862E5, 1302E6]], [[3683E5, 1302E6], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&"]], [null, 0, 10, 19, [[[329890840, 1246055600], [386930130, 1284960940]], 
    [[344646740, 1284960940], [386930130, 1288476560]], [[350277470, 1288476560], [386930130, 1310531620]], [[370277730, 1310531620], [386930130, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.17&hl=en-US&"]], [null, 3, 7, 7, [[[33E7, 124605E4], [3862E5, 12936E5]], [[3665E5, 1297E6], [3862E5, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&"]], [null, 3, 8, 8, [[[33E7, 
    124605E4], [3862E5, 12796E5]], [[345E6, 12796E5], [3862E5, 12867E5]], [[35469E4, 12867E5], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&"]], [null, 3, 9, 9, [[[33E7, 124605E4], [3862E5, 12796E5]], [[34E7, 12796E5], [3862E5, 12867E5]], [[3489E5, 12867E5], [3862E5, 1302E6]], [[3683E5, 1302E6], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&"]], 
    [null, 3, 10, null, [[[329890840, 1246055600], [386930130, 1284960940]], [[344646740, 1284960940], [386930130, 1288476560]], [[350277470, 1288476560], [386930130, 1310531620]], [[370277730, 1310531620], [386930130, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.17&hl=en-US&"]]], [["http://cbk0.googleapis.com/cbk?", "http://cbk1.googleapis.com/cbk?"]], [["http://khm0.googleapis.com/kh?v=60&hl=en-US&", "http://khm1.googleapis.com/kh?v=60&hl=en-US&"], 
    null, null, null, null, "60"], [["http://mt0.googleapis.com/mapslt?hl=en-US&", "http://mt1.googleapis.com/mapslt?hl=en-US&"]], [["http://mt0.googleapis.com/mapslt/ft?hl=en-US&", "http://mt1.googleapis.com/mapslt/ft?hl=en-US&"]], [["http://mt0.googleapis.com/vt?hl=en-US&", "http://mt1.googleapis.com/vt?hl=en-US&"]]], ["en-US", "US", null, 0, null, null, "http://maps.gstatic.com/mapfiles/", "http://csi.gstatic.com", "https://maps.googleapis.com", "http://maps.googleapis.com"], ["http://maps.gstatic.com/intl/en_us/mapfiles/api-3/9/13b", 
    "3.9.13b"], [1241398219], 1, null, null, null, null, 0, "", null, null, 0, "http://khm.googleapis.com/mz?v=115&", "AIzaSyAwWbI4MbAIUbykt_X3YhoRvHyUTkv-E9I", "https://earthbuilder.google.com", "https://earthbuilder.googleapis.com"], loadScriptTime)
  };
  var loadScriptTime = (new Date).getTime();
  getScript("http://maps.gstatic.com/intl/en_us/mapfiles/api-3/9/13b/main.js")
})();
goog.provide("client.maps");
goog.require("cljs.core");
goog.require("google.maps");
goog.require("goog.dom");
goog.require("client.scene");
goog.require("client.const$");
goog.require("vertx");
client.maps.getBoundsFromResults = function getBoundsFromResults(results) {
  return cljs.core.nth.call(null, results, 0).geometry.bounds
};
client.maps.init = function init() {
  var mapContainer__6162 = goog.dom.getElement(client.const$.maps.call(null, "\ufdd0'map_id"));
  var mapConfig__6163 = {"mapTypeId":google.maps.MapTypeId.ROADMAP, "disableDefaultUI":true};
  var geocoderConfig__6164 = {"address":client.const$.maps.call(null, "\ufdd0'country")};
  var geocoder__6165 = new google.maps.Geocoder;
  var map__6166 = new google.maps.Map(mapContainer__6162, mapConfig__6163);
  geocoder__6165.geocode(geocoderConfig__6164, function(results, status) {
    if(cljs.core._EQ_.call(null, status, google.maps.GeocoderStatus.OK)) {
      map__6166.fitBounds(client.maps.getBoundsFromResults.call(null, results));
      return client.scene.init.call(null, mapContainer__6162)
    }else {
      return null
    }
  });
  return null
};
goog.provide("client.core");
goog.require("cljs.core");
goog.require("client.maps");
goog.require("client.scene");
goog.require("client.const$");
goog.require("client.utils");
goog.require("vertx");
client.core.serverPushHandler = function serverPushHandler(event) {
  client.utils.log_obj.call(null, event);
  client.scene.$.update(event, cljs.core.PersistentVector.fromArray([0], true), event, cljs.core.PersistentVector.fromArray([1], true), event, cljs.core.PersistentVector.fromArray([2], true));
  return null
};
client.core.main = function main() {
  var eb__6174 = new vertx.EventBus(client.const$.push.call(null, "\ufdd0'server_address"));
  eb__6174.onopen = function() {
    return client.maps.init.call(null)
  };
  return null
};
goog.exportSymbol("client.core.main", client.core.main);
