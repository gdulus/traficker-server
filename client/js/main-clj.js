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
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
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
  var x__6136 = x == null ? null : x;
  if(p[goog.typeOf(x__6136)]) {
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
    var G__6137__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6137 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6137__delegate.call(this, array, i, idxs)
    };
    G__6137.cljs$lang$maxFixedArity = 2;
    G__6137.cljs$lang$applyTo = function(arglist__6138) {
      var array = cljs.core.first(arglist__6138);
      var i = cljs.core.first(cljs.core.next(arglist__6138));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6138));
      return G__6137__delegate(array, i, idxs)
    };
    G__6137.cljs$lang$arity$variadic = G__6137__delegate;
    return G__6137
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
      var and__3822__auto____6223 = this$;
      if(and__3822__auto____6223) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6223
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2391__auto____6224 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6225 = cljs.core._invoke[goog.typeOf(x__2391__auto____6224)];
        if(or__3824__auto____6225) {
          return or__3824__auto____6225
        }else {
          var or__3824__auto____6226 = cljs.core._invoke["_"];
          if(or__3824__auto____6226) {
            return or__3824__auto____6226
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6227 = this$;
      if(and__3822__auto____6227) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6227
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2391__auto____6228 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6229 = cljs.core._invoke[goog.typeOf(x__2391__auto____6228)];
        if(or__3824__auto____6229) {
          return or__3824__auto____6229
        }else {
          var or__3824__auto____6230 = cljs.core._invoke["_"];
          if(or__3824__auto____6230) {
            return or__3824__auto____6230
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6231 = this$;
      if(and__3822__auto____6231) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6231
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2391__auto____6232 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6233 = cljs.core._invoke[goog.typeOf(x__2391__auto____6232)];
        if(or__3824__auto____6233) {
          return or__3824__auto____6233
        }else {
          var or__3824__auto____6234 = cljs.core._invoke["_"];
          if(or__3824__auto____6234) {
            return or__3824__auto____6234
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6235 = this$;
      if(and__3822__auto____6235) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6235
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2391__auto____6236 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6237 = cljs.core._invoke[goog.typeOf(x__2391__auto____6236)];
        if(or__3824__auto____6237) {
          return or__3824__auto____6237
        }else {
          var or__3824__auto____6238 = cljs.core._invoke["_"];
          if(or__3824__auto____6238) {
            return or__3824__auto____6238
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6239 = this$;
      if(and__3822__auto____6239) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6239
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2391__auto____6240 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6241 = cljs.core._invoke[goog.typeOf(x__2391__auto____6240)];
        if(or__3824__auto____6241) {
          return or__3824__auto____6241
        }else {
          var or__3824__auto____6242 = cljs.core._invoke["_"];
          if(or__3824__auto____6242) {
            return or__3824__auto____6242
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6243 = this$;
      if(and__3822__auto____6243) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6243
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2391__auto____6244 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6245 = cljs.core._invoke[goog.typeOf(x__2391__auto____6244)];
        if(or__3824__auto____6245) {
          return or__3824__auto____6245
        }else {
          var or__3824__auto____6246 = cljs.core._invoke["_"];
          if(or__3824__auto____6246) {
            return or__3824__auto____6246
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6247 = this$;
      if(and__3822__auto____6247) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6247
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2391__auto____6248 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6249 = cljs.core._invoke[goog.typeOf(x__2391__auto____6248)];
        if(or__3824__auto____6249) {
          return or__3824__auto____6249
        }else {
          var or__3824__auto____6250 = cljs.core._invoke["_"];
          if(or__3824__auto____6250) {
            return or__3824__auto____6250
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6251 = this$;
      if(and__3822__auto____6251) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6251
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2391__auto____6252 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6253 = cljs.core._invoke[goog.typeOf(x__2391__auto____6252)];
        if(or__3824__auto____6253) {
          return or__3824__auto____6253
        }else {
          var or__3824__auto____6254 = cljs.core._invoke["_"];
          if(or__3824__auto____6254) {
            return or__3824__auto____6254
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6255 = this$;
      if(and__3822__auto____6255) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6255
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2391__auto____6256 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6257 = cljs.core._invoke[goog.typeOf(x__2391__auto____6256)];
        if(or__3824__auto____6257) {
          return or__3824__auto____6257
        }else {
          var or__3824__auto____6258 = cljs.core._invoke["_"];
          if(or__3824__auto____6258) {
            return or__3824__auto____6258
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6259 = this$;
      if(and__3822__auto____6259) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6259
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2391__auto____6260 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6261 = cljs.core._invoke[goog.typeOf(x__2391__auto____6260)];
        if(or__3824__auto____6261) {
          return or__3824__auto____6261
        }else {
          var or__3824__auto____6262 = cljs.core._invoke["_"];
          if(or__3824__auto____6262) {
            return or__3824__auto____6262
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6263 = this$;
      if(and__3822__auto____6263) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6263
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2391__auto____6264 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6265 = cljs.core._invoke[goog.typeOf(x__2391__auto____6264)];
        if(or__3824__auto____6265) {
          return or__3824__auto____6265
        }else {
          var or__3824__auto____6266 = cljs.core._invoke["_"];
          if(or__3824__auto____6266) {
            return or__3824__auto____6266
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6267 = this$;
      if(and__3822__auto____6267) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6267
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2391__auto____6268 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6269 = cljs.core._invoke[goog.typeOf(x__2391__auto____6268)];
        if(or__3824__auto____6269) {
          return or__3824__auto____6269
        }else {
          var or__3824__auto____6270 = cljs.core._invoke["_"];
          if(or__3824__auto____6270) {
            return or__3824__auto____6270
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6271 = this$;
      if(and__3822__auto____6271) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6271
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2391__auto____6272 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6273 = cljs.core._invoke[goog.typeOf(x__2391__auto____6272)];
        if(or__3824__auto____6273) {
          return or__3824__auto____6273
        }else {
          var or__3824__auto____6274 = cljs.core._invoke["_"];
          if(or__3824__auto____6274) {
            return or__3824__auto____6274
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6275 = this$;
      if(and__3822__auto____6275) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6275
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2391__auto____6276 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6277 = cljs.core._invoke[goog.typeOf(x__2391__auto____6276)];
        if(or__3824__auto____6277) {
          return or__3824__auto____6277
        }else {
          var or__3824__auto____6278 = cljs.core._invoke["_"];
          if(or__3824__auto____6278) {
            return or__3824__auto____6278
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6279 = this$;
      if(and__3822__auto____6279) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6279
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2391__auto____6280 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6281 = cljs.core._invoke[goog.typeOf(x__2391__auto____6280)];
        if(or__3824__auto____6281) {
          return or__3824__auto____6281
        }else {
          var or__3824__auto____6282 = cljs.core._invoke["_"];
          if(or__3824__auto____6282) {
            return or__3824__auto____6282
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6283 = this$;
      if(and__3822__auto____6283) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6283
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2391__auto____6284 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6285 = cljs.core._invoke[goog.typeOf(x__2391__auto____6284)];
        if(or__3824__auto____6285) {
          return or__3824__auto____6285
        }else {
          var or__3824__auto____6286 = cljs.core._invoke["_"];
          if(or__3824__auto____6286) {
            return or__3824__auto____6286
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6287 = this$;
      if(and__3822__auto____6287) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6287
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2391__auto____6288 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6289 = cljs.core._invoke[goog.typeOf(x__2391__auto____6288)];
        if(or__3824__auto____6289) {
          return or__3824__auto____6289
        }else {
          var or__3824__auto____6290 = cljs.core._invoke["_"];
          if(or__3824__auto____6290) {
            return or__3824__auto____6290
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6291 = this$;
      if(and__3822__auto____6291) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6291
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2391__auto____6292 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6293 = cljs.core._invoke[goog.typeOf(x__2391__auto____6292)];
        if(or__3824__auto____6293) {
          return or__3824__auto____6293
        }else {
          var or__3824__auto____6294 = cljs.core._invoke["_"];
          if(or__3824__auto____6294) {
            return or__3824__auto____6294
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6295 = this$;
      if(and__3822__auto____6295) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6295
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2391__auto____6296 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6297 = cljs.core._invoke[goog.typeOf(x__2391__auto____6296)];
        if(or__3824__auto____6297) {
          return or__3824__auto____6297
        }else {
          var or__3824__auto____6298 = cljs.core._invoke["_"];
          if(or__3824__auto____6298) {
            return or__3824__auto____6298
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6299 = this$;
      if(and__3822__auto____6299) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6299
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2391__auto____6300 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6301 = cljs.core._invoke[goog.typeOf(x__2391__auto____6300)];
        if(or__3824__auto____6301) {
          return or__3824__auto____6301
        }else {
          var or__3824__auto____6302 = cljs.core._invoke["_"];
          if(or__3824__auto____6302) {
            return or__3824__auto____6302
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6303 = this$;
      if(and__3822__auto____6303) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6303
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2391__auto____6304 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6305 = cljs.core._invoke[goog.typeOf(x__2391__auto____6304)];
        if(or__3824__auto____6305) {
          return or__3824__auto____6305
        }else {
          var or__3824__auto____6306 = cljs.core._invoke["_"];
          if(or__3824__auto____6306) {
            return or__3824__auto____6306
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
    var and__3822__auto____6311 = coll;
    if(and__3822__auto____6311) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6311
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2391__auto____6312 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6313 = cljs.core._count[goog.typeOf(x__2391__auto____6312)];
      if(or__3824__auto____6313) {
        return or__3824__auto____6313
      }else {
        var or__3824__auto____6314 = cljs.core._count["_"];
        if(or__3824__auto____6314) {
          return or__3824__auto____6314
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
    var and__3822__auto____6319 = coll;
    if(and__3822__auto____6319) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6319
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2391__auto____6320 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6321 = cljs.core._empty[goog.typeOf(x__2391__auto____6320)];
      if(or__3824__auto____6321) {
        return or__3824__auto____6321
      }else {
        var or__3824__auto____6322 = cljs.core._empty["_"];
        if(or__3824__auto____6322) {
          return or__3824__auto____6322
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
    var and__3822__auto____6327 = coll;
    if(and__3822__auto____6327) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6327
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2391__auto____6328 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6329 = cljs.core._conj[goog.typeOf(x__2391__auto____6328)];
      if(or__3824__auto____6329) {
        return or__3824__auto____6329
      }else {
        var or__3824__auto____6330 = cljs.core._conj["_"];
        if(or__3824__auto____6330) {
          return or__3824__auto____6330
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
      var and__3822__auto____6339 = coll;
      if(and__3822__auto____6339) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6339
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2391__auto____6340 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6341 = cljs.core._nth[goog.typeOf(x__2391__auto____6340)];
        if(or__3824__auto____6341) {
          return or__3824__auto____6341
        }else {
          var or__3824__auto____6342 = cljs.core._nth["_"];
          if(or__3824__auto____6342) {
            return or__3824__auto____6342
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6343 = coll;
      if(and__3822__auto____6343) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6343
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2391__auto____6344 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6345 = cljs.core._nth[goog.typeOf(x__2391__auto____6344)];
        if(or__3824__auto____6345) {
          return or__3824__auto____6345
        }else {
          var or__3824__auto____6346 = cljs.core._nth["_"];
          if(or__3824__auto____6346) {
            return or__3824__auto____6346
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
    var and__3822__auto____6351 = coll;
    if(and__3822__auto____6351) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6351
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2391__auto____6352 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6353 = cljs.core._first[goog.typeOf(x__2391__auto____6352)];
      if(or__3824__auto____6353) {
        return or__3824__auto____6353
      }else {
        var or__3824__auto____6354 = cljs.core._first["_"];
        if(or__3824__auto____6354) {
          return or__3824__auto____6354
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6359 = coll;
    if(and__3822__auto____6359) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6359
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2391__auto____6360 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6361 = cljs.core._rest[goog.typeOf(x__2391__auto____6360)];
      if(or__3824__auto____6361) {
        return or__3824__auto____6361
      }else {
        var or__3824__auto____6362 = cljs.core._rest["_"];
        if(or__3824__auto____6362) {
          return or__3824__auto____6362
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
    var and__3822__auto____6367 = coll;
    if(and__3822__auto____6367) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6367
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2391__auto____6368 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6369 = cljs.core._next[goog.typeOf(x__2391__auto____6368)];
      if(or__3824__auto____6369) {
        return or__3824__auto____6369
      }else {
        var or__3824__auto____6370 = cljs.core._next["_"];
        if(or__3824__auto____6370) {
          return or__3824__auto____6370
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
      var and__3822__auto____6379 = o;
      if(and__3822__auto____6379) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6379
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2391__auto____6380 = o == null ? null : o;
      return function() {
        var or__3824__auto____6381 = cljs.core._lookup[goog.typeOf(x__2391__auto____6380)];
        if(or__3824__auto____6381) {
          return or__3824__auto____6381
        }else {
          var or__3824__auto____6382 = cljs.core._lookup["_"];
          if(or__3824__auto____6382) {
            return or__3824__auto____6382
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6383 = o;
      if(and__3822__auto____6383) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6383
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2391__auto____6384 = o == null ? null : o;
      return function() {
        var or__3824__auto____6385 = cljs.core._lookup[goog.typeOf(x__2391__auto____6384)];
        if(or__3824__auto____6385) {
          return or__3824__auto____6385
        }else {
          var or__3824__auto____6386 = cljs.core._lookup["_"];
          if(or__3824__auto____6386) {
            return or__3824__auto____6386
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
    var and__3822__auto____6391 = coll;
    if(and__3822__auto____6391) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6391
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2391__auto____6392 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6393 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2391__auto____6392)];
      if(or__3824__auto____6393) {
        return or__3824__auto____6393
      }else {
        var or__3824__auto____6394 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6394) {
          return or__3824__auto____6394
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6399 = coll;
    if(and__3822__auto____6399) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6399
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2391__auto____6400 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6401 = cljs.core._assoc[goog.typeOf(x__2391__auto____6400)];
      if(or__3824__auto____6401) {
        return or__3824__auto____6401
      }else {
        var or__3824__auto____6402 = cljs.core._assoc["_"];
        if(or__3824__auto____6402) {
          return or__3824__auto____6402
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
    var and__3822__auto____6407 = coll;
    if(and__3822__auto____6407) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6407
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2391__auto____6408 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6409 = cljs.core._dissoc[goog.typeOf(x__2391__auto____6408)];
      if(or__3824__auto____6409) {
        return or__3824__auto____6409
      }else {
        var or__3824__auto____6410 = cljs.core._dissoc["_"];
        if(or__3824__auto____6410) {
          return or__3824__auto____6410
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
    var and__3822__auto____6415 = coll;
    if(and__3822__auto____6415) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6415
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2391__auto____6416 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6417 = cljs.core._key[goog.typeOf(x__2391__auto____6416)];
      if(or__3824__auto____6417) {
        return or__3824__auto____6417
      }else {
        var or__3824__auto____6418 = cljs.core._key["_"];
        if(or__3824__auto____6418) {
          return or__3824__auto____6418
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6423 = coll;
    if(and__3822__auto____6423) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6423
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2391__auto____6424 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6425 = cljs.core._val[goog.typeOf(x__2391__auto____6424)];
      if(or__3824__auto____6425) {
        return or__3824__auto____6425
      }else {
        var or__3824__auto____6426 = cljs.core._val["_"];
        if(or__3824__auto____6426) {
          return or__3824__auto____6426
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
    var and__3822__auto____6431 = coll;
    if(and__3822__auto____6431) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6431
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2391__auto____6432 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6433 = cljs.core._disjoin[goog.typeOf(x__2391__auto____6432)];
      if(or__3824__auto____6433) {
        return or__3824__auto____6433
      }else {
        var or__3824__auto____6434 = cljs.core._disjoin["_"];
        if(or__3824__auto____6434) {
          return or__3824__auto____6434
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
    var and__3822__auto____6439 = coll;
    if(and__3822__auto____6439) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6439
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2391__auto____6440 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6441 = cljs.core._peek[goog.typeOf(x__2391__auto____6440)];
      if(or__3824__auto____6441) {
        return or__3824__auto____6441
      }else {
        var or__3824__auto____6442 = cljs.core._peek["_"];
        if(or__3824__auto____6442) {
          return or__3824__auto____6442
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6447 = coll;
    if(and__3822__auto____6447) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6447
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2391__auto____6448 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6449 = cljs.core._pop[goog.typeOf(x__2391__auto____6448)];
      if(or__3824__auto____6449) {
        return or__3824__auto____6449
      }else {
        var or__3824__auto____6450 = cljs.core._pop["_"];
        if(or__3824__auto____6450) {
          return or__3824__auto____6450
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
    var and__3822__auto____6455 = coll;
    if(and__3822__auto____6455) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6455
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2391__auto____6456 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6457 = cljs.core._assoc_n[goog.typeOf(x__2391__auto____6456)];
      if(or__3824__auto____6457) {
        return or__3824__auto____6457
      }else {
        var or__3824__auto____6458 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6458) {
          return or__3824__auto____6458
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
    var and__3822__auto____6463 = o;
    if(and__3822__auto____6463) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6463
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2391__auto____6464 = o == null ? null : o;
    return function() {
      var or__3824__auto____6465 = cljs.core._deref[goog.typeOf(x__2391__auto____6464)];
      if(or__3824__auto____6465) {
        return or__3824__auto____6465
      }else {
        var or__3824__auto____6466 = cljs.core._deref["_"];
        if(or__3824__auto____6466) {
          return or__3824__auto____6466
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
    var and__3822__auto____6471 = o;
    if(and__3822__auto____6471) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6471
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2391__auto____6472 = o == null ? null : o;
    return function() {
      var or__3824__auto____6473 = cljs.core._deref_with_timeout[goog.typeOf(x__2391__auto____6472)];
      if(or__3824__auto____6473) {
        return or__3824__auto____6473
      }else {
        var or__3824__auto____6474 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6474) {
          return or__3824__auto____6474
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
    var and__3822__auto____6479 = o;
    if(and__3822__auto____6479) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6479
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2391__auto____6480 = o == null ? null : o;
    return function() {
      var or__3824__auto____6481 = cljs.core._meta[goog.typeOf(x__2391__auto____6480)];
      if(or__3824__auto____6481) {
        return or__3824__auto____6481
      }else {
        var or__3824__auto____6482 = cljs.core._meta["_"];
        if(or__3824__auto____6482) {
          return or__3824__auto____6482
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
    var and__3822__auto____6487 = o;
    if(and__3822__auto____6487) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6487
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2391__auto____6488 = o == null ? null : o;
    return function() {
      var or__3824__auto____6489 = cljs.core._with_meta[goog.typeOf(x__2391__auto____6488)];
      if(or__3824__auto____6489) {
        return or__3824__auto____6489
      }else {
        var or__3824__auto____6490 = cljs.core._with_meta["_"];
        if(or__3824__auto____6490) {
          return or__3824__auto____6490
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
      var and__3822__auto____6499 = coll;
      if(and__3822__auto____6499) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6499
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2391__auto____6500 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6501 = cljs.core._reduce[goog.typeOf(x__2391__auto____6500)];
        if(or__3824__auto____6501) {
          return or__3824__auto____6501
        }else {
          var or__3824__auto____6502 = cljs.core._reduce["_"];
          if(or__3824__auto____6502) {
            return or__3824__auto____6502
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6503 = coll;
      if(and__3822__auto____6503) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6503
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2391__auto____6504 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6505 = cljs.core._reduce[goog.typeOf(x__2391__auto____6504)];
        if(or__3824__auto____6505) {
          return or__3824__auto____6505
        }else {
          var or__3824__auto____6506 = cljs.core._reduce["_"];
          if(or__3824__auto____6506) {
            return or__3824__auto____6506
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
    var and__3822__auto____6511 = coll;
    if(and__3822__auto____6511) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6511
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2391__auto____6512 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6513 = cljs.core._kv_reduce[goog.typeOf(x__2391__auto____6512)];
      if(or__3824__auto____6513) {
        return or__3824__auto____6513
      }else {
        var or__3824__auto____6514 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6514) {
          return or__3824__auto____6514
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
    var and__3822__auto____6519 = o;
    if(and__3822__auto____6519) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6519
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2391__auto____6520 = o == null ? null : o;
    return function() {
      var or__3824__auto____6521 = cljs.core._equiv[goog.typeOf(x__2391__auto____6520)];
      if(or__3824__auto____6521) {
        return or__3824__auto____6521
      }else {
        var or__3824__auto____6522 = cljs.core._equiv["_"];
        if(or__3824__auto____6522) {
          return or__3824__auto____6522
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
    var and__3822__auto____6527 = o;
    if(and__3822__auto____6527) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6527
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2391__auto____6528 = o == null ? null : o;
    return function() {
      var or__3824__auto____6529 = cljs.core._hash[goog.typeOf(x__2391__auto____6528)];
      if(or__3824__auto____6529) {
        return or__3824__auto____6529
      }else {
        var or__3824__auto____6530 = cljs.core._hash["_"];
        if(or__3824__auto____6530) {
          return or__3824__auto____6530
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
    var and__3822__auto____6535 = o;
    if(and__3822__auto____6535) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6535
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2391__auto____6536 = o == null ? null : o;
    return function() {
      var or__3824__auto____6537 = cljs.core._seq[goog.typeOf(x__2391__auto____6536)];
      if(or__3824__auto____6537) {
        return or__3824__auto____6537
      }else {
        var or__3824__auto____6538 = cljs.core._seq["_"];
        if(or__3824__auto____6538) {
          return or__3824__auto____6538
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
    var and__3822__auto____6543 = coll;
    if(and__3822__auto____6543) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6543
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2391__auto____6544 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6545 = cljs.core._rseq[goog.typeOf(x__2391__auto____6544)];
      if(or__3824__auto____6545) {
        return or__3824__auto____6545
      }else {
        var or__3824__auto____6546 = cljs.core._rseq["_"];
        if(or__3824__auto____6546) {
          return or__3824__auto____6546
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
    var and__3822__auto____6551 = coll;
    if(and__3822__auto____6551) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6551
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2391__auto____6552 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6553 = cljs.core._sorted_seq[goog.typeOf(x__2391__auto____6552)];
      if(or__3824__auto____6553) {
        return or__3824__auto____6553
      }else {
        var or__3824__auto____6554 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6554) {
          return or__3824__auto____6554
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6559 = coll;
    if(and__3822__auto____6559) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6559
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2391__auto____6560 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6561 = cljs.core._sorted_seq_from[goog.typeOf(x__2391__auto____6560)];
      if(or__3824__auto____6561) {
        return or__3824__auto____6561
      }else {
        var or__3824__auto____6562 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6562) {
          return or__3824__auto____6562
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6567 = coll;
    if(and__3822__auto____6567) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6567
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2391__auto____6568 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6569 = cljs.core._entry_key[goog.typeOf(x__2391__auto____6568)];
      if(or__3824__auto____6569) {
        return or__3824__auto____6569
      }else {
        var or__3824__auto____6570 = cljs.core._entry_key["_"];
        if(or__3824__auto____6570) {
          return or__3824__auto____6570
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6575 = coll;
    if(and__3822__auto____6575) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6575
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2391__auto____6576 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6577 = cljs.core._comparator[goog.typeOf(x__2391__auto____6576)];
      if(or__3824__auto____6577) {
        return or__3824__auto____6577
      }else {
        var or__3824__auto____6578 = cljs.core._comparator["_"];
        if(or__3824__auto____6578) {
          return or__3824__auto____6578
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
    var and__3822__auto____6583 = o;
    if(and__3822__auto____6583) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6583
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2391__auto____6584 = o == null ? null : o;
    return function() {
      var or__3824__auto____6585 = cljs.core._pr_seq[goog.typeOf(x__2391__auto____6584)];
      if(or__3824__auto____6585) {
        return or__3824__auto____6585
      }else {
        var or__3824__auto____6586 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6586) {
          return or__3824__auto____6586
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
    var and__3822__auto____6591 = d;
    if(and__3822__auto____6591) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6591
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2391__auto____6592 = d == null ? null : d;
    return function() {
      var or__3824__auto____6593 = cljs.core._realized_QMARK_[goog.typeOf(x__2391__auto____6592)];
      if(or__3824__auto____6593) {
        return or__3824__auto____6593
      }else {
        var or__3824__auto____6594 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6594) {
          return or__3824__auto____6594
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
    var and__3822__auto____6599 = this$;
    if(and__3822__auto____6599) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6599
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2391__auto____6600 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6601 = cljs.core._notify_watches[goog.typeOf(x__2391__auto____6600)];
      if(or__3824__auto____6601) {
        return or__3824__auto____6601
      }else {
        var or__3824__auto____6602 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6602) {
          return or__3824__auto____6602
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6607 = this$;
    if(and__3822__auto____6607) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6607
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2391__auto____6608 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6609 = cljs.core._add_watch[goog.typeOf(x__2391__auto____6608)];
      if(or__3824__auto____6609) {
        return or__3824__auto____6609
      }else {
        var or__3824__auto____6610 = cljs.core._add_watch["_"];
        if(or__3824__auto____6610) {
          return or__3824__auto____6610
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6615 = this$;
    if(and__3822__auto____6615) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6615
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2391__auto____6616 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6617 = cljs.core._remove_watch[goog.typeOf(x__2391__auto____6616)];
      if(or__3824__auto____6617) {
        return or__3824__auto____6617
      }else {
        var or__3824__auto____6618 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6618) {
          return or__3824__auto____6618
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
    var and__3822__auto____6623 = coll;
    if(and__3822__auto____6623) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6623
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2391__auto____6624 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6625 = cljs.core._as_transient[goog.typeOf(x__2391__auto____6624)];
      if(or__3824__auto____6625) {
        return or__3824__auto____6625
      }else {
        var or__3824__auto____6626 = cljs.core._as_transient["_"];
        if(or__3824__auto____6626) {
          return or__3824__auto____6626
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
    var and__3822__auto____6631 = tcoll;
    if(and__3822__auto____6631) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6631
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2391__auto____6632 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6633 = cljs.core._conj_BANG_[goog.typeOf(x__2391__auto____6632)];
      if(or__3824__auto____6633) {
        return or__3824__auto____6633
      }else {
        var or__3824__auto____6634 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6634) {
          return or__3824__auto____6634
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6639 = tcoll;
    if(and__3822__auto____6639) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6639
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6640 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6641 = cljs.core._persistent_BANG_[goog.typeOf(x__2391__auto____6640)];
      if(or__3824__auto____6641) {
        return or__3824__auto____6641
      }else {
        var or__3824__auto____6642 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6642) {
          return or__3824__auto____6642
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
    var and__3822__auto____6647 = tcoll;
    if(and__3822__auto____6647) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6647
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2391__auto____6648 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6649 = cljs.core._assoc_BANG_[goog.typeOf(x__2391__auto____6648)];
      if(or__3824__auto____6649) {
        return or__3824__auto____6649
      }else {
        var or__3824__auto____6650 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6650) {
          return or__3824__auto____6650
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
    var and__3822__auto____6655 = tcoll;
    if(and__3822__auto____6655) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6655
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2391__auto____6656 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6657 = cljs.core._dissoc_BANG_[goog.typeOf(x__2391__auto____6656)];
      if(or__3824__auto____6657) {
        return or__3824__auto____6657
      }else {
        var or__3824__auto____6658 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6658) {
          return or__3824__auto____6658
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
    var and__3822__auto____6663 = tcoll;
    if(and__3822__auto____6663) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6663
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2391__auto____6664 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6665 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2391__auto____6664)];
      if(or__3824__auto____6665) {
        return or__3824__auto____6665
      }else {
        var or__3824__auto____6666 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6666) {
          return or__3824__auto____6666
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6671 = tcoll;
    if(and__3822__auto____6671) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6671
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6672 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6673 = cljs.core._pop_BANG_[goog.typeOf(x__2391__auto____6672)];
      if(or__3824__auto____6673) {
        return or__3824__auto____6673
      }else {
        var or__3824__auto____6674 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6674) {
          return or__3824__auto____6674
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
    var and__3822__auto____6679 = tcoll;
    if(and__3822__auto____6679) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6679
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2391__auto____6680 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6681 = cljs.core._disjoin_BANG_[goog.typeOf(x__2391__auto____6680)];
      if(or__3824__auto____6681) {
        return or__3824__auto____6681
      }else {
        var or__3824__auto____6682 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6682) {
          return or__3824__auto____6682
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
    var and__3822__auto____6687 = x;
    if(and__3822__auto____6687) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6687
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2391__auto____6688 = x == null ? null : x;
    return function() {
      var or__3824__auto____6689 = cljs.core._compare[goog.typeOf(x__2391__auto____6688)];
      if(or__3824__auto____6689) {
        return or__3824__auto____6689
      }else {
        var or__3824__auto____6690 = cljs.core._compare["_"];
        if(or__3824__auto____6690) {
          return or__3824__auto____6690
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
    var and__3822__auto____6695 = coll;
    if(and__3822__auto____6695) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6695
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2391__auto____6696 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6697 = cljs.core._drop_first[goog.typeOf(x__2391__auto____6696)];
      if(or__3824__auto____6697) {
        return or__3824__auto____6697
      }else {
        var or__3824__auto____6698 = cljs.core._drop_first["_"];
        if(or__3824__auto____6698) {
          return or__3824__auto____6698
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
    var and__3822__auto____6703 = coll;
    if(and__3822__auto____6703) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6703
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2391__auto____6704 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6705 = cljs.core._chunked_first[goog.typeOf(x__2391__auto____6704)];
      if(or__3824__auto____6705) {
        return or__3824__auto____6705
      }else {
        var or__3824__auto____6706 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6706) {
          return or__3824__auto____6706
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6711 = coll;
    if(and__3822__auto____6711) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6711
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2391__auto____6712 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6713 = cljs.core._chunked_rest[goog.typeOf(x__2391__auto____6712)];
      if(or__3824__auto____6713) {
        return or__3824__auto____6713
      }else {
        var or__3824__auto____6714 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6714) {
          return or__3824__auto____6714
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
    var and__3822__auto____6719 = coll;
    if(and__3822__auto____6719) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6719
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2391__auto____6720 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6721 = cljs.core._chunked_next[goog.typeOf(x__2391__auto____6720)];
      if(or__3824__auto____6721) {
        return or__3824__auto____6721
      }else {
        var or__3824__auto____6722 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6722) {
          return or__3824__auto____6722
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
    var or__3824__auto____6724 = x === y;
    if(or__3824__auto____6724) {
      return or__3824__auto____6724
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6725__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6726 = y;
            var G__6727 = cljs.core.first.call(null, more);
            var G__6728 = cljs.core.next.call(null, more);
            x = G__6726;
            y = G__6727;
            more = G__6728;
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
    var G__6725 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6725__delegate.call(this, x, y, more)
    };
    G__6725.cljs$lang$maxFixedArity = 2;
    G__6725.cljs$lang$applyTo = function(arglist__6729) {
      var x = cljs.core.first(arglist__6729);
      var y = cljs.core.first(cljs.core.next(arglist__6729));
      var more = cljs.core.rest(cljs.core.next(arglist__6729));
      return G__6725__delegate(x, y, more)
    };
    G__6725.cljs$lang$arity$variadic = G__6725__delegate;
    return G__6725
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
  var G__6730 = null;
  var G__6730__2 = function(o, k) {
    return null
  };
  var G__6730__3 = function(o, k, not_found) {
    return not_found
  };
  G__6730 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6730__2.call(this, o, k);
      case 3:
        return G__6730__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6730
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
  var G__6731 = null;
  var G__6731__2 = function(_, f) {
    return f.call(null)
  };
  var G__6731__3 = function(_, f, start) {
    return start
  };
  G__6731 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6731__2.call(this, _, f);
      case 3:
        return G__6731__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6731
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
  var G__6732 = null;
  var G__6732__2 = function(_, n) {
    return null
  };
  var G__6732__3 = function(_, n, not_found) {
    return not_found
  };
  G__6732 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6732__2.call(this, _, n);
      case 3:
        return G__6732__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6732
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
  var and__3822__auto____6733 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____6733) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6733
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
    var cnt__6746 = cljs.core._count.call(null, cicoll);
    if(cnt__6746 === 0) {
      return f.call(null)
    }else {
      var val__6747 = cljs.core._nth.call(null, cicoll, 0);
      var n__6748 = 1;
      while(true) {
        if(n__6748 < cnt__6746) {
          var nval__6749 = f.call(null, val__6747, cljs.core._nth.call(null, cicoll, n__6748));
          if(cljs.core.reduced_QMARK_.call(null, nval__6749)) {
            return cljs.core.deref.call(null, nval__6749)
          }else {
            var G__6758 = nval__6749;
            var G__6759 = n__6748 + 1;
            val__6747 = G__6758;
            n__6748 = G__6759;
            continue
          }
        }else {
          return val__6747
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6750 = cljs.core._count.call(null, cicoll);
    var val__6751 = val;
    var n__6752 = 0;
    while(true) {
      if(n__6752 < cnt__6750) {
        var nval__6753 = f.call(null, val__6751, cljs.core._nth.call(null, cicoll, n__6752));
        if(cljs.core.reduced_QMARK_.call(null, nval__6753)) {
          return cljs.core.deref.call(null, nval__6753)
        }else {
          var G__6760 = nval__6753;
          var G__6761 = n__6752 + 1;
          val__6751 = G__6760;
          n__6752 = G__6761;
          continue
        }
      }else {
        return val__6751
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6754 = cljs.core._count.call(null, cicoll);
    var val__6755 = val;
    var n__6756 = idx;
    while(true) {
      if(n__6756 < cnt__6754) {
        var nval__6757 = f.call(null, val__6755, cljs.core._nth.call(null, cicoll, n__6756));
        if(cljs.core.reduced_QMARK_.call(null, nval__6757)) {
          return cljs.core.deref.call(null, nval__6757)
        }else {
          var G__6762 = nval__6757;
          var G__6763 = n__6756 + 1;
          val__6755 = G__6762;
          n__6756 = G__6763;
          continue
        }
      }else {
        return val__6755
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
    var cnt__6776 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6777 = arr[0];
      var n__6778 = 1;
      while(true) {
        if(n__6778 < cnt__6776) {
          var nval__6779 = f.call(null, val__6777, arr[n__6778]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6779)) {
            return cljs.core.deref.call(null, nval__6779)
          }else {
            var G__6788 = nval__6779;
            var G__6789 = n__6778 + 1;
            val__6777 = G__6788;
            n__6778 = G__6789;
            continue
          }
        }else {
          return val__6777
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6780 = arr.length;
    var val__6781 = val;
    var n__6782 = 0;
    while(true) {
      if(n__6782 < cnt__6780) {
        var nval__6783 = f.call(null, val__6781, arr[n__6782]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6783)) {
          return cljs.core.deref.call(null, nval__6783)
        }else {
          var G__6790 = nval__6783;
          var G__6791 = n__6782 + 1;
          val__6781 = G__6790;
          n__6782 = G__6791;
          continue
        }
      }else {
        return val__6781
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6784 = arr.length;
    var val__6785 = val;
    var n__6786 = idx;
    while(true) {
      if(n__6786 < cnt__6784) {
        var nval__6787 = f.call(null, val__6785, arr[n__6786]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6787)) {
          return cljs.core.deref.call(null, nval__6787)
        }else {
          var G__6792 = nval__6787;
          var G__6793 = n__6786 + 1;
          val__6785 = G__6792;
          n__6786 = G__6793;
          continue
        }
      }else {
        return val__6785
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
  var this__6794 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6795 = this;
  if(this__6795.i + 1 < this__6795.a.length) {
    return new cljs.core.IndexedSeq(this__6795.a, this__6795.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6796 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6797 = this;
  var c__6798 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6798 > 0) {
    return new cljs.core.RSeq(coll, c__6798 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6799 = this;
  var this__6800 = this;
  return cljs.core.pr_str.call(null, this__6800)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6801 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6801.a)) {
    return cljs.core.ci_reduce.call(null, this__6801.a, f, this__6801.a[this__6801.i], this__6801.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6801.a[this__6801.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6802 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6802.a)) {
    return cljs.core.ci_reduce.call(null, this__6802.a, f, start, this__6802.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6803 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6804 = this;
  return this__6804.a.length - this__6804.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6805 = this;
  return this__6805.a[this__6805.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6806 = this;
  if(this__6806.i + 1 < this__6806.a.length) {
    return new cljs.core.IndexedSeq(this__6806.a, this__6806.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6807 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6808 = this;
  var i__6809 = n + this__6808.i;
  if(i__6809 < this__6808.a.length) {
    return this__6808.a[i__6809]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6810 = this;
  var i__6811 = n + this__6810.i;
  if(i__6811 < this__6810.a.length) {
    return this__6810.a[i__6811]
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
  var G__6812 = null;
  var G__6812__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6812__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6812 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6812__2.call(this, array, f);
      case 3:
        return G__6812__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6812
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6813 = null;
  var G__6813__2 = function(array, k) {
    return array[k]
  };
  var G__6813__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6813 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6813__2.call(this, array, k);
      case 3:
        return G__6813__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6813
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6814 = null;
  var G__6814__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6814__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6814 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6814__2.call(this, array, n);
      case 3:
        return G__6814__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6814
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
  var this__6815 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6816 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6817 = this;
  var this__6818 = this;
  return cljs.core.pr_str.call(null, this__6818)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6819 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6820 = this;
  return this__6820.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6821 = this;
  return cljs.core._nth.call(null, this__6821.ci, this__6821.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6822 = this;
  if(this__6822.i > 0) {
    return new cljs.core.RSeq(this__6822.ci, this__6822.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6823 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6824 = this;
  return new cljs.core.RSeq(this__6824.ci, this__6824.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6825 = this;
  return this__6825.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6829__6830 = coll;
      if(G__6829__6830) {
        if(function() {
          var or__3824__auto____6831 = G__6829__6830.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6831) {
            return or__3824__auto____6831
          }else {
            return G__6829__6830.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6829__6830.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6829__6830)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6829__6830)
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
      var G__6836__6837 = coll;
      if(G__6836__6837) {
        if(function() {
          var or__3824__auto____6838 = G__6836__6837.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6838) {
            return or__3824__auto____6838
          }else {
            return G__6836__6837.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6836__6837.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6836__6837)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6836__6837)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6839 = cljs.core.seq.call(null, coll);
      if(s__6839 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6839)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6844__6845 = coll;
      if(G__6844__6845) {
        if(function() {
          var or__3824__auto____6846 = G__6844__6845.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6846) {
            return or__3824__auto____6846
          }else {
            return G__6844__6845.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6844__6845.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6844__6845)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6844__6845)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6847 = cljs.core.seq.call(null, coll);
      if(!(s__6847 == null)) {
        return cljs.core._rest.call(null, s__6847)
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
      var G__6851__6852 = coll;
      if(G__6851__6852) {
        if(function() {
          var or__3824__auto____6853 = G__6851__6852.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6853) {
            return or__3824__auto____6853
          }else {
            return G__6851__6852.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6851__6852.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6851__6852)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6851__6852)
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
    var sn__6855 = cljs.core.next.call(null, s);
    if(!(sn__6855 == null)) {
      var G__6856 = sn__6855;
      s = G__6856;
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
    var G__6857__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6858 = conj.call(null, coll, x);
          var G__6859 = cljs.core.first.call(null, xs);
          var G__6860 = cljs.core.next.call(null, xs);
          coll = G__6858;
          x = G__6859;
          xs = G__6860;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6857 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6857__delegate.call(this, coll, x, xs)
    };
    G__6857.cljs$lang$maxFixedArity = 2;
    G__6857.cljs$lang$applyTo = function(arglist__6861) {
      var coll = cljs.core.first(arglist__6861);
      var x = cljs.core.first(cljs.core.next(arglist__6861));
      var xs = cljs.core.rest(cljs.core.next(arglist__6861));
      return G__6857__delegate(coll, x, xs)
    };
    G__6857.cljs$lang$arity$variadic = G__6857__delegate;
    return G__6857
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
  var s__6864 = cljs.core.seq.call(null, coll);
  var acc__6865 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6864)) {
      return acc__6865 + cljs.core._count.call(null, s__6864)
    }else {
      var G__6866 = cljs.core.next.call(null, s__6864);
      var G__6867 = acc__6865 + 1;
      s__6864 = G__6866;
      acc__6865 = G__6867;
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
        var G__6874__6875 = coll;
        if(G__6874__6875) {
          if(function() {
            var or__3824__auto____6876 = G__6874__6875.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6876) {
              return or__3824__auto____6876
            }else {
              return G__6874__6875.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6874__6875.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6874__6875)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6874__6875)
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
        var G__6877__6878 = coll;
        if(G__6877__6878) {
          if(function() {
            var or__3824__auto____6879 = G__6877__6878.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6879) {
              return or__3824__auto____6879
            }else {
              return G__6877__6878.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6877__6878.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6877__6878)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6877__6878)
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
    var G__6882__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6881 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6883 = ret__6881;
          var G__6884 = cljs.core.first.call(null, kvs);
          var G__6885 = cljs.core.second.call(null, kvs);
          var G__6886 = cljs.core.nnext.call(null, kvs);
          coll = G__6883;
          k = G__6884;
          v = G__6885;
          kvs = G__6886;
          continue
        }else {
          return ret__6881
        }
        break
      }
    };
    var G__6882 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6882__delegate.call(this, coll, k, v, kvs)
    };
    G__6882.cljs$lang$maxFixedArity = 3;
    G__6882.cljs$lang$applyTo = function(arglist__6887) {
      var coll = cljs.core.first(arglist__6887);
      var k = cljs.core.first(cljs.core.next(arglist__6887));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6887)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6887)));
      return G__6882__delegate(coll, k, v, kvs)
    };
    G__6882.cljs$lang$arity$variadic = G__6882__delegate;
    return G__6882
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
    var G__6890__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6889 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6891 = ret__6889;
          var G__6892 = cljs.core.first.call(null, ks);
          var G__6893 = cljs.core.next.call(null, ks);
          coll = G__6891;
          k = G__6892;
          ks = G__6893;
          continue
        }else {
          return ret__6889
        }
        break
      }
    };
    var G__6890 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6890__delegate.call(this, coll, k, ks)
    };
    G__6890.cljs$lang$maxFixedArity = 2;
    G__6890.cljs$lang$applyTo = function(arglist__6894) {
      var coll = cljs.core.first(arglist__6894);
      var k = cljs.core.first(cljs.core.next(arglist__6894));
      var ks = cljs.core.rest(cljs.core.next(arglist__6894));
      return G__6890__delegate(coll, k, ks)
    };
    G__6890.cljs$lang$arity$variadic = G__6890__delegate;
    return G__6890
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
    var G__6898__6899 = o;
    if(G__6898__6899) {
      if(function() {
        var or__3824__auto____6900 = G__6898__6899.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6900) {
          return or__3824__auto____6900
        }else {
          return G__6898__6899.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6898__6899.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6898__6899)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6898__6899)
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
    var G__6903__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6902 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6904 = ret__6902;
          var G__6905 = cljs.core.first.call(null, ks);
          var G__6906 = cljs.core.next.call(null, ks);
          coll = G__6904;
          k = G__6905;
          ks = G__6906;
          continue
        }else {
          return ret__6902
        }
        break
      }
    };
    var G__6903 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6903__delegate.call(this, coll, k, ks)
    };
    G__6903.cljs$lang$maxFixedArity = 2;
    G__6903.cljs$lang$applyTo = function(arglist__6907) {
      var coll = cljs.core.first(arglist__6907);
      var k = cljs.core.first(cljs.core.next(arglist__6907));
      var ks = cljs.core.rest(cljs.core.next(arglist__6907));
      return G__6903__delegate(coll, k, ks)
    };
    G__6903.cljs$lang$arity$variadic = G__6903__delegate;
    return G__6903
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
  var h__6909 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6909;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6909
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6911 = cljs.core.string_hash_cache[k];
  if(!(h__6911 == null)) {
    return h__6911
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
      var and__3822__auto____6913 = goog.isString(o);
      if(and__3822__auto____6913) {
        return check_cache
      }else {
        return and__3822__auto____6913
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
    var G__6917__6918 = x;
    if(G__6917__6918) {
      if(function() {
        var or__3824__auto____6919 = G__6917__6918.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6919) {
          return or__3824__auto____6919
        }else {
          return G__6917__6918.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6917__6918.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6917__6918)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6917__6918)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6923__6924 = x;
    if(G__6923__6924) {
      if(function() {
        var or__3824__auto____6925 = G__6923__6924.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6925) {
          return or__3824__auto____6925
        }else {
          return G__6923__6924.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6923__6924.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6923__6924)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6923__6924)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6929__6930 = x;
  if(G__6929__6930) {
    if(function() {
      var or__3824__auto____6931 = G__6929__6930.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6931) {
        return or__3824__auto____6931
      }else {
        return G__6929__6930.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6929__6930.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6929__6930)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6929__6930)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6935__6936 = x;
  if(G__6935__6936) {
    if(function() {
      var or__3824__auto____6937 = G__6935__6936.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6937) {
        return or__3824__auto____6937
      }else {
        return G__6935__6936.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6935__6936.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6935__6936)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6935__6936)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6941__6942 = x;
  if(G__6941__6942) {
    if(function() {
      var or__3824__auto____6943 = G__6941__6942.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6943) {
        return or__3824__auto____6943
      }else {
        return G__6941__6942.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6941__6942.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6941__6942)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6941__6942)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6947__6948 = x;
  if(G__6947__6948) {
    if(function() {
      var or__3824__auto____6949 = G__6947__6948.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6949) {
        return or__3824__auto____6949
      }else {
        return G__6947__6948.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6947__6948.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6947__6948)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6947__6948)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6953__6954 = x;
  if(G__6953__6954) {
    if(function() {
      var or__3824__auto____6955 = G__6953__6954.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____6955) {
        return or__3824__auto____6955
      }else {
        return G__6953__6954.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6953__6954.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6953__6954)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6953__6954)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6959__6960 = x;
    if(G__6959__6960) {
      if(function() {
        var or__3824__auto____6961 = G__6959__6960.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____6961) {
          return or__3824__auto____6961
        }else {
          return G__6959__6960.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6959__6960.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6959__6960)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6959__6960)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6965__6966 = x;
  if(G__6965__6966) {
    if(function() {
      var or__3824__auto____6967 = G__6965__6966.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____6967) {
        return or__3824__auto____6967
      }else {
        return G__6965__6966.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6965__6966.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6965__6966)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6965__6966)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6971__6972 = x;
  if(G__6971__6972) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____6973 = null;
      if(cljs.core.truth_(or__3824__auto____6973)) {
        return or__3824__auto____6973
      }else {
        return G__6971__6972.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6971__6972.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6971__6972)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6971__6972)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6974__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6974 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6974__delegate.call(this, keyvals)
    };
    G__6974.cljs$lang$maxFixedArity = 0;
    G__6974.cljs$lang$applyTo = function(arglist__6975) {
      var keyvals = cljs.core.seq(arglist__6975);
      return G__6974__delegate(keyvals)
    };
    G__6974.cljs$lang$arity$variadic = G__6974__delegate;
    return G__6974
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
  var keys__6977 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6977.push(key)
  });
  return keys__6977
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6981 = i;
  var j__6982 = j;
  var len__6983 = len;
  while(true) {
    if(len__6983 === 0) {
      return to
    }else {
      to[j__6982] = from[i__6981];
      var G__6984 = i__6981 + 1;
      var G__6985 = j__6982 + 1;
      var G__6986 = len__6983 - 1;
      i__6981 = G__6984;
      j__6982 = G__6985;
      len__6983 = G__6986;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6990 = i + (len - 1);
  var j__6991 = j + (len - 1);
  var len__6992 = len;
  while(true) {
    if(len__6992 === 0) {
      return to
    }else {
      to[j__6991] = from[i__6990];
      var G__6993 = i__6990 - 1;
      var G__6994 = j__6991 - 1;
      var G__6995 = len__6992 - 1;
      i__6990 = G__6993;
      j__6991 = G__6994;
      len__6992 = G__6995;
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
    var G__6999__7000 = s;
    if(G__6999__7000) {
      if(function() {
        var or__3824__auto____7001 = G__6999__7000.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7001) {
          return or__3824__auto____7001
        }else {
          return G__6999__7000.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6999__7000.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6999__7000)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6999__7000)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7005__7006 = s;
  if(G__7005__7006) {
    if(function() {
      var or__3824__auto____7007 = G__7005__7006.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7007) {
        return or__3824__auto____7007
      }else {
        return G__7005__7006.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7005__7006.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7005__7006)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7005__7006)
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
  var and__3822__auto____7010 = goog.isString(x);
  if(and__3822__auto____7010) {
    return!function() {
      var or__3824__auto____7011 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7011) {
        return or__3824__auto____7011
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7010
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7013 = goog.isString(x);
  if(and__3822__auto____7013) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7013
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7015 = goog.isString(x);
  if(and__3822__auto____7015) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7015
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7020 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7020) {
    return or__3824__auto____7020
  }else {
    var G__7021__7022 = f;
    if(G__7021__7022) {
      if(function() {
        var or__3824__auto____7023 = G__7021__7022.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7023) {
          return or__3824__auto____7023
        }else {
          return G__7021__7022.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7021__7022.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7021__7022)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7021__7022)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7025 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7025) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7025
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
    var and__3822__auto____7028 = coll;
    if(cljs.core.truth_(and__3822__auto____7028)) {
      var and__3822__auto____7029 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7029) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7029
      }
    }else {
      return and__3822__auto____7028
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
    var G__7038__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7034 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7035 = more;
        while(true) {
          var x__7036 = cljs.core.first.call(null, xs__7035);
          var etc__7037 = cljs.core.next.call(null, xs__7035);
          if(cljs.core.truth_(xs__7035)) {
            if(cljs.core.contains_QMARK_.call(null, s__7034, x__7036)) {
              return false
            }else {
              var G__7039 = cljs.core.conj.call(null, s__7034, x__7036);
              var G__7040 = etc__7037;
              s__7034 = G__7039;
              xs__7035 = G__7040;
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
    var G__7038 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7038__delegate.call(this, x, y, more)
    };
    G__7038.cljs$lang$maxFixedArity = 2;
    G__7038.cljs$lang$applyTo = function(arglist__7041) {
      var x = cljs.core.first(arglist__7041);
      var y = cljs.core.first(cljs.core.next(arglist__7041));
      var more = cljs.core.rest(cljs.core.next(arglist__7041));
      return G__7038__delegate(x, y, more)
    };
    G__7038.cljs$lang$arity$variadic = G__7038__delegate;
    return G__7038
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
            var G__7045__7046 = x;
            if(G__7045__7046) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7047 = null;
                if(cljs.core.truth_(or__3824__auto____7047)) {
                  return or__3824__auto____7047
                }else {
                  return G__7045__7046.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7045__7046.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7045__7046)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7045__7046)
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
    var xl__7052 = cljs.core.count.call(null, xs);
    var yl__7053 = cljs.core.count.call(null, ys);
    if(xl__7052 < yl__7053) {
      return-1
    }else {
      if(xl__7052 > yl__7053) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7052, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7054 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7055 = d__7054 === 0;
        if(and__3822__auto____7055) {
          return n + 1 < len
        }else {
          return and__3822__auto____7055
        }
      }()) {
        var G__7056 = xs;
        var G__7057 = ys;
        var G__7058 = len;
        var G__7059 = n + 1;
        xs = G__7056;
        ys = G__7057;
        len = G__7058;
        n = G__7059;
        continue
      }else {
        return d__7054
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
      var r__7061 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7061)) {
        return r__7061
      }else {
        if(cljs.core.truth_(r__7061)) {
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
      var a__7063 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7063, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7063)
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
    var temp__3971__auto____7069 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7069) {
      var s__7070 = temp__3971__auto____7069;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7070), cljs.core.next.call(null, s__7070))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7071 = val;
    var coll__7072 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7072) {
        var nval__7073 = f.call(null, val__7071, cljs.core.first.call(null, coll__7072));
        if(cljs.core.reduced_QMARK_.call(null, nval__7073)) {
          return cljs.core.deref.call(null, nval__7073)
        }else {
          var G__7074 = nval__7073;
          var G__7075 = cljs.core.next.call(null, coll__7072);
          val__7071 = G__7074;
          coll__7072 = G__7075;
          continue
        }
      }else {
        return val__7071
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
  var a__7077 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7077);
  return cljs.core.vec.call(null, a__7077)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7084__7085 = coll;
      if(G__7084__7085) {
        if(function() {
          var or__3824__auto____7086 = G__7084__7085.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7086) {
            return or__3824__auto____7086
          }else {
            return G__7084__7085.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7084__7085.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7084__7085)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7084__7085)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7087__7088 = coll;
      if(G__7087__7088) {
        if(function() {
          var or__3824__auto____7089 = G__7087__7088.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7089) {
            return or__3824__auto____7089
          }else {
            return G__7087__7088.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7087__7088.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7087__7088)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7087__7088)
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
  var this__7090 = this;
  return this__7090.val
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
    var G__7091__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7091 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7091__delegate.call(this, x, y, more)
    };
    G__7091.cljs$lang$maxFixedArity = 2;
    G__7091.cljs$lang$applyTo = function(arglist__7092) {
      var x = cljs.core.first(arglist__7092);
      var y = cljs.core.first(cljs.core.next(arglist__7092));
      var more = cljs.core.rest(cljs.core.next(arglist__7092));
      return G__7091__delegate(x, y, more)
    };
    G__7091.cljs$lang$arity$variadic = G__7091__delegate;
    return G__7091
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
    var G__7093__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7093 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7093__delegate.call(this, x, y, more)
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = function(arglist__7094) {
      var x = cljs.core.first(arglist__7094);
      var y = cljs.core.first(cljs.core.next(arglist__7094));
      var more = cljs.core.rest(cljs.core.next(arglist__7094));
      return G__7093__delegate(x, y, more)
    };
    G__7093.cljs$lang$arity$variadic = G__7093__delegate;
    return G__7093
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
    var G__7095__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7095 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7095__delegate.call(this, x, y, more)
    };
    G__7095.cljs$lang$maxFixedArity = 2;
    G__7095.cljs$lang$applyTo = function(arglist__7096) {
      var x = cljs.core.first(arglist__7096);
      var y = cljs.core.first(cljs.core.next(arglist__7096));
      var more = cljs.core.rest(cljs.core.next(arglist__7096));
      return G__7095__delegate(x, y, more)
    };
    G__7095.cljs$lang$arity$variadic = G__7095__delegate;
    return G__7095
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
    var G__7097__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7097 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7097__delegate.call(this, x, y, more)
    };
    G__7097.cljs$lang$maxFixedArity = 2;
    G__7097.cljs$lang$applyTo = function(arglist__7098) {
      var x = cljs.core.first(arglist__7098);
      var y = cljs.core.first(cljs.core.next(arglist__7098));
      var more = cljs.core.rest(cljs.core.next(arglist__7098));
      return G__7097__delegate(x, y, more)
    };
    G__7097.cljs$lang$arity$variadic = G__7097__delegate;
    return G__7097
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
    var G__7099__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7100 = y;
            var G__7101 = cljs.core.first.call(null, more);
            var G__7102 = cljs.core.next.call(null, more);
            x = G__7100;
            y = G__7101;
            more = G__7102;
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
    var G__7099 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7099__delegate.call(this, x, y, more)
    };
    G__7099.cljs$lang$maxFixedArity = 2;
    G__7099.cljs$lang$applyTo = function(arglist__7103) {
      var x = cljs.core.first(arglist__7103);
      var y = cljs.core.first(cljs.core.next(arglist__7103));
      var more = cljs.core.rest(cljs.core.next(arglist__7103));
      return G__7099__delegate(x, y, more)
    };
    G__7099.cljs$lang$arity$variadic = G__7099__delegate;
    return G__7099
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
    var G__7104__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7105 = y;
            var G__7106 = cljs.core.first.call(null, more);
            var G__7107 = cljs.core.next.call(null, more);
            x = G__7105;
            y = G__7106;
            more = G__7107;
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
    var G__7104 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7104__delegate.call(this, x, y, more)
    };
    G__7104.cljs$lang$maxFixedArity = 2;
    G__7104.cljs$lang$applyTo = function(arglist__7108) {
      var x = cljs.core.first(arglist__7108);
      var y = cljs.core.first(cljs.core.next(arglist__7108));
      var more = cljs.core.rest(cljs.core.next(arglist__7108));
      return G__7104__delegate(x, y, more)
    };
    G__7104.cljs$lang$arity$variadic = G__7104__delegate;
    return G__7104
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
    var G__7109__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7110 = y;
            var G__7111 = cljs.core.first.call(null, more);
            var G__7112 = cljs.core.next.call(null, more);
            x = G__7110;
            y = G__7111;
            more = G__7112;
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
    var G__7109 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7109__delegate.call(this, x, y, more)
    };
    G__7109.cljs$lang$maxFixedArity = 2;
    G__7109.cljs$lang$applyTo = function(arglist__7113) {
      var x = cljs.core.first(arglist__7113);
      var y = cljs.core.first(cljs.core.next(arglist__7113));
      var more = cljs.core.rest(cljs.core.next(arglist__7113));
      return G__7109__delegate(x, y, more)
    };
    G__7109.cljs$lang$arity$variadic = G__7109__delegate;
    return G__7109
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
    var G__7114__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7115 = y;
            var G__7116 = cljs.core.first.call(null, more);
            var G__7117 = cljs.core.next.call(null, more);
            x = G__7115;
            y = G__7116;
            more = G__7117;
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
    var G__7114 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7114__delegate.call(this, x, y, more)
    };
    G__7114.cljs$lang$maxFixedArity = 2;
    G__7114.cljs$lang$applyTo = function(arglist__7118) {
      var x = cljs.core.first(arglist__7118);
      var y = cljs.core.first(cljs.core.next(arglist__7118));
      var more = cljs.core.rest(cljs.core.next(arglist__7118));
      return G__7114__delegate(x, y, more)
    };
    G__7114.cljs$lang$arity$variadic = G__7114__delegate;
    return G__7114
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
    var G__7119__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7119 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7119__delegate.call(this, x, y, more)
    };
    G__7119.cljs$lang$maxFixedArity = 2;
    G__7119.cljs$lang$applyTo = function(arglist__7120) {
      var x = cljs.core.first(arglist__7120);
      var y = cljs.core.first(cljs.core.next(arglist__7120));
      var more = cljs.core.rest(cljs.core.next(arglist__7120));
      return G__7119__delegate(x, y, more)
    };
    G__7119.cljs$lang$arity$variadic = G__7119__delegate;
    return G__7119
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
    var G__7121__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7121 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7121__delegate.call(this, x, y, more)
    };
    G__7121.cljs$lang$maxFixedArity = 2;
    G__7121.cljs$lang$applyTo = function(arglist__7122) {
      var x = cljs.core.first(arglist__7122);
      var y = cljs.core.first(cljs.core.next(arglist__7122));
      var more = cljs.core.rest(cljs.core.next(arglist__7122));
      return G__7121__delegate(x, y, more)
    };
    G__7121.cljs$lang$arity$variadic = G__7121__delegate;
    return G__7121
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
  var rem__7124 = n % d;
  return cljs.core.fix.call(null, (n - rem__7124) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7126 = cljs.core.quot.call(null, n, d);
  return n - d * q__7126
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
  var v__7129 = v - (v >> 1 & 1431655765);
  var v__7130 = (v__7129 & 858993459) + (v__7129 >> 2 & 858993459);
  return(v__7130 + (v__7130 >> 4) & 252645135) * 16843009 >> 24
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
    var G__7131__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7132 = y;
            var G__7133 = cljs.core.first.call(null, more);
            var G__7134 = cljs.core.next.call(null, more);
            x = G__7132;
            y = G__7133;
            more = G__7134;
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
    var G__7131 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7131__delegate.call(this, x, y, more)
    };
    G__7131.cljs$lang$maxFixedArity = 2;
    G__7131.cljs$lang$applyTo = function(arglist__7135) {
      var x = cljs.core.first(arglist__7135);
      var y = cljs.core.first(cljs.core.next(arglist__7135));
      var more = cljs.core.rest(cljs.core.next(arglist__7135));
      return G__7131__delegate(x, y, more)
    };
    G__7131.cljs$lang$arity$variadic = G__7131__delegate;
    return G__7131
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
  var n__7139 = n;
  var xs__7140 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7141 = xs__7140;
      if(and__3822__auto____7141) {
        return n__7139 > 0
      }else {
        return and__3822__auto____7141
      }
    }())) {
      var G__7142 = n__7139 - 1;
      var G__7143 = cljs.core.next.call(null, xs__7140);
      n__7139 = G__7142;
      xs__7140 = G__7143;
      continue
    }else {
      return xs__7140
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
    var G__7144__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7145 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7146 = cljs.core.next.call(null, more);
            sb = G__7145;
            more = G__7146;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7144 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7144__delegate.call(this, x, ys)
    };
    G__7144.cljs$lang$maxFixedArity = 1;
    G__7144.cljs$lang$applyTo = function(arglist__7147) {
      var x = cljs.core.first(arglist__7147);
      var ys = cljs.core.rest(arglist__7147);
      return G__7144__delegate(x, ys)
    };
    G__7144.cljs$lang$arity$variadic = G__7144__delegate;
    return G__7144
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
    var G__7148__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7149 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7150 = cljs.core.next.call(null, more);
            sb = G__7149;
            more = G__7150;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7148 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7148__delegate.call(this, x, ys)
    };
    G__7148.cljs$lang$maxFixedArity = 1;
    G__7148.cljs$lang$applyTo = function(arglist__7151) {
      var x = cljs.core.first(arglist__7151);
      var ys = cljs.core.rest(arglist__7151);
      return G__7148__delegate(x, ys)
    };
    G__7148.cljs$lang$arity$variadic = G__7148__delegate;
    return G__7148
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
  format.cljs$lang$applyTo = function(arglist__7152) {
    var fmt = cljs.core.first(arglist__7152);
    var args = cljs.core.rest(arglist__7152);
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
    var xs__7155 = cljs.core.seq.call(null, x);
    var ys__7156 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7155 == null) {
        return ys__7156 == null
      }else {
        if(ys__7156 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7155), cljs.core.first.call(null, ys__7156))) {
            var G__7157 = cljs.core.next.call(null, xs__7155);
            var G__7158 = cljs.core.next.call(null, ys__7156);
            xs__7155 = G__7157;
            ys__7156 = G__7158;
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
  return cljs.core.reduce.call(null, function(p1__7159_SHARP_, p2__7160_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7159_SHARP_, cljs.core.hash.call(null, p2__7160_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7164 = 0;
  var s__7165 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7165) {
      var e__7166 = cljs.core.first.call(null, s__7165);
      var G__7167 = (h__7164 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7166)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7166)))) % 4503599627370496;
      var G__7168 = cljs.core.next.call(null, s__7165);
      h__7164 = G__7167;
      s__7165 = G__7168;
      continue
    }else {
      return h__7164
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7172 = 0;
  var s__7173 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7173) {
      var e__7174 = cljs.core.first.call(null, s__7173);
      var G__7175 = (h__7172 + cljs.core.hash.call(null, e__7174)) % 4503599627370496;
      var G__7176 = cljs.core.next.call(null, s__7173);
      h__7172 = G__7175;
      s__7173 = G__7176;
      continue
    }else {
      return h__7172
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7197__7198 = cljs.core.seq.call(null, fn_map);
  if(G__7197__7198) {
    var G__7200__7202 = cljs.core.first.call(null, G__7197__7198);
    var vec__7201__7203 = G__7200__7202;
    var key_name__7204 = cljs.core.nth.call(null, vec__7201__7203, 0, null);
    var f__7205 = cljs.core.nth.call(null, vec__7201__7203, 1, null);
    var G__7197__7206 = G__7197__7198;
    var G__7200__7207 = G__7200__7202;
    var G__7197__7208 = G__7197__7206;
    while(true) {
      var vec__7209__7210 = G__7200__7207;
      var key_name__7211 = cljs.core.nth.call(null, vec__7209__7210, 0, null);
      var f__7212 = cljs.core.nth.call(null, vec__7209__7210, 1, null);
      var G__7197__7213 = G__7197__7208;
      var str_name__7214 = cljs.core.name.call(null, key_name__7211);
      obj[str_name__7214] = f__7212;
      var temp__3974__auto____7215 = cljs.core.next.call(null, G__7197__7213);
      if(temp__3974__auto____7215) {
        var G__7197__7216 = temp__3974__auto____7215;
        var G__7217 = cljs.core.first.call(null, G__7197__7216);
        var G__7218 = G__7197__7216;
        G__7200__7207 = G__7217;
        G__7197__7208 = G__7218;
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
  var this__7219 = this;
  var h__2220__auto____7220 = this__7219.__hash;
  if(!(h__2220__auto____7220 == null)) {
    return h__2220__auto____7220
  }else {
    var h__2220__auto____7221 = cljs.core.hash_coll.call(null, coll);
    this__7219.__hash = h__2220__auto____7221;
    return h__2220__auto____7221
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7222 = this;
  if(this__7222.count === 1) {
    return null
  }else {
    return this__7222.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7223 = this;
  return new cljs.core.List(this__7223.meta, o, coll, this__7223.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7224 = this;
  var this__7225 = this;
  return cljs.core.pr_str.call(null, this__7225)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7226 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7227 = this;
  return this__7227.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7228 = this;
  return this__7228.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7229 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7230 = this;
  return this__7230.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7231 = this;
  if(this__7231.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7231.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7232 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7233 = this;
  return new cljs.core.List(meta, this__7233.first, this__7233.rest, this__7233.count, this__7233.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7234 = this;
  return this__7234.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7235 = this;
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
  var this__7236 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7237 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7238 = this;
  return new cljs.core.List(this__7238.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7239 = this;
  var this__7240 = this;
  return cljs.core.pr_str.call(null, this__7240)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7241 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7242 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7243 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7244 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7245 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7246 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7247 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7248 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7249 = this;
  return this__7249.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7250 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7254__7255 = coll;
  if(G__7254__7255) {
    if(function() {
      var or__3824__auto____7256 = G__7254__7255.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7256) {
        return or__3824__auto____7256
      }else {
        return G__7254__7255.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7254__7255.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7254__7255)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7254__7255)
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
    var G__7257__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7257 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7257__delegate.call(this, x, y, z, items)
    };
    G__7257.cljs$lang$maxFixedArity = 3;
    G__7257.cljs$lang$applyTo = function(arglist__7258) {
      var x = cljs.core.first(arglist__7258);
      var y = cljs.core.first(cljs.core.next(arglist__7258));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7258)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7258)));
      return G__7257__delegate(x, y, z, items)
    };
    G__7257.cljs$lang$arity$variadic = G__7257__delegate;
    return G__7257
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
  var this__7259 = this;
  var h__2220__auto____7260 = this__7259.__hash;
  if(!(h__2220__auto____7260 == null)) {
    return h__2220__auto____7260
  }else {
    var h__2220__auto____7261 = cljs.core.hash_coll.call(null, coll);
    this__7259.__hash = h__2220__auto____7261;
    return h__2220__auto____7261
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7262 = this;
  if(this__7262.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7262.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7263 = this;
  return new cljs.core.Cons(null, o, coll, this__7263.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7264 = this;
  var this__7265 = this;
  return cljs.core.pr_str.call(null, this__7265)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7266 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7267 = this;
  return this__7267.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7268 = this;
  if(this__7268.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7268.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7269 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7270 = this;
  return new cljs.core.Cons(meta, this__7270.first, this__7270.rest, this__7270.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7271 = this;
  return this__7271.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7272 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7272.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7277 = coll == null;
    if(or__3824__auto____7277) {
      return or__3824__auto____7277
    }else {
      var G__7278__7279 = coll;
      if(G__7278__7279) {
        if(function() {
          var or__3824__auto____7280 = G__7278__7279.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7280) {
            return or__3824__auto____7280
          }else {
            return G__7278__7279.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7278__7279.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7278__7279)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7278__7279)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7284__7285 = x;
  if(G__7284__7285) {
    if(function() {
      var or__3824__auto____7286 = G__7284__7285.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7286) {
        return or__3824__auto____7286
      }else {
        return G__7284__7285.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7284__7285.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7284__7285)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7284__7285)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7287 = null;
  var G__7287__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7287__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7287 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7287__2.call(this, string, f);
      case 3:
        return G__7287__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7287
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7288 = null;
  var G__7288__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7288__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7288 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7288__2.call(this, string, k);
      case 3:
        return G__7288__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7288
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7289 = null;
  var G__7289__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7289__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7289 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7289__2.call(this, string, n);
      case 3:
        return G__7289__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7289
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
  var G__7301 = null;
  var G__7301__2 = function(this_sym7292, coll) {
    var this__7294 = this;
    var this_sym7292__7295 = this;
    var ___7296 = this_sym7292__7295;
    if(coll == null) {
      return null
    }else {
      var strobj__7297 = coll.strobj;
      if(strobj__7297 == null) {
        return cljs.core._lookup.call(null, coll, this__7294.k, null)
      }else {
        return strobj__7297[this__7294.k]
      }
    }
  };
  var G__7301__3 = function(this_sym7293, coll, not_found) {
    var this__7294 = this;
    var this_sym7293__7298 = this;
    var ___7299 = this_sym7293__7298;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7294.k, not_found)
    }
  };
  G__7301 = function(this_sym7293, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7301__2.call(this, this_sym7293, coll);
      case 3:
        return G__7301__3.call(this, this_sym7293, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7301
}();
cljs.core.Keyword.prototype.apply = function(this_sym7290, args7291) {
  var this__7300 = this;
  return this_sym7290.call.apply(this_sym7290, [this_sym7290].concat(args7291.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7310 = null;
  var G__7310__2 = function(this_sym7304, coll) {
    var this_sym7304__7306 = this;
    var this__7307 = this_sym7304__7306;
    return cljs.core._lookup.call(null, coll, this__7307.toString(), null)
  };
  var G__7310__3 = function(this_sym7305, coll, not_found) {
    var this_sym7305__7308 = this;
    var this__7309 = this_sym7305__7308;
    return cljs.core._lookup.call(null, coll, this__7309.toString(), not_found)
  };
  G__7310 = function(this_sym7305, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7310__2.call(this, this_sym7305, coll);
      case 3:
        return G__7310__3.call(this, this_sym7305, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7310
}();
String.prototype.apply = function(this_sym7302, args7303) {
  return this_sym7302.call.apply(this_sym7302, [this_sym7302].concat(args7303.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7312 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7312
  }else {
    lazy_seq.x = x__7312.call(null);
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
  var this__7313 = this;
  var h__2220__auto____7314 = this__7313.__hash;
  if(!(h__2220__auto____7314 == null)) {
    return h__2220__auto____7314
  }else {
    var h__2220__auto____7315 = cljs.core.hash_coll.call(null, coll);
    this__7313.__hash = h__2220__auto____7315;
    return h__2220__auto____7315
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7316 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7317 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7318 = this;
  var this__7319 = this;
  return cljs.core.pr_str.call(null, this__7319)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7320 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7321 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7322 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7323 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7324 = this;
  return new cljs.core.LazySeq(meta, this__7324.realized, this__7324.x, this__7324.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7325 = this;
  return this__7325.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7326 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7326.meta)
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
  var this__7327 = this;
  return this__7327.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7328 = this;
  var ___7329 = this;
  this__7328.buf[this__7328.end] = o;
  return this__7328.end = this__7328.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7330 = this;
  var ___7331 = this;
  var ret__7332 = new cljs.core.ArrayChunk(this__7330.buf, 0, this__7330.end);
  this__7330.buf = null;
  return ret__7332
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
  var this__7333 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7333.arr[this__7333.off], this__7333.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7334 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7334.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7335 = this;
  if(this__7335.off === this__7335.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7335.arr, this__7335.off + 1, this__7335.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7336 = this;
  return this__7336.arr[this__7336.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7337 = this;
  if(function() {
    var and__3822__auto____7338 = i >= 0;
    if(and__3822__auto____7338) {
      return i < this__7337.end - this__7337.off
    }else {
      return and__3822__auto____7338
    }
  }()) {
    return this__7337.arr[this__7337.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7339 = this;
  return this__7339.end - this__7339.off
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
  var this__7340 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7341 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7342 = this;
  return cljs.core._nth.call(null, this__7342.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7343 = this;
  if(cljs.core._count.call(null, this__7343.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7343.chunk), this__7343.more, this__7343.meta)
  }else {
    if(this__7343.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7343.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7344 = this;
  if(this__7344.more == null) {
    return null
  }else {
    return this__7344.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7345 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7346 = this;
  return new cljs.core.ChunkedCons(this__7346.chunk, this__7346.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7347 = this;
  return this__7347.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7348 = this;
  return this__7348.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7349 = this;
  if(this__7349.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7349.more
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
    var G__7353__7354 = s;
    if(G__7353__7354) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7355 = null;
        if(cljs.core.truth_(or__3824__auto____7355)) {
          return or__3824__auto____7355
        }else {
          return G__7353__7354.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7353__7354.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7353__7354)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7353__7354)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7358 = [];
  var s__7359 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7359)) {
      ary__7358.push(cljs.core.first.call(null, s__7359));
      var G__7360 = cljs.core.next.call(null, s__7359);
      s__7359 = G__7360;
      continue
    }else {
      return ary__7358
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7364 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7365 = 0;
  var xs__7366 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7366) {
      ret__7364[i__7365] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7366));
      var G__7367 = i__7365 + 1;
      var G__7368 = cljs.core.next.call(null, xs__7366);
      i__7365 = G__7367;
      xs__7366 = G__7368;
      continue
    }else {
    }
    break
  }
  return ret__7364
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
    var a__7376 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7377 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7378 = 0;
      var s__7379 = s__7377;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7380 = s__7379;
          if(and__3822__auto____7380) {
            return i__7378 < size
          }else {
            return and__3822__auto____7380
          }
        }())) {
          a__7376[i__7378] = cljs.core.first.call(null, s__7379);
          var G__7383 = i__7378 + 1;
          var G__7384 = cljs.core.next.call(null, s__7379);
          i__7378 = G__7383;
          s__7379 = G__7384;
          continue
        }else {
          return a__7376
        }
        break
      }
    }else {
      var n__2555__auto____7381 = size;
      var i__7382 = 0;
      while(true) {
        if(i__7382 < n__2555__auto____7381) {
          a__7376[i__7382] = init_val_or_seq;
          var G__7385 = i__7382 + 1;
          i__7382 = G__7385;
          continue
        }else {
        }
        break
      }
      return a__7376
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
    var a__7393 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7394 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7395 = 0;
      var s__7396 = s__7394;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7397 = s__7396;
          if(and__3822__auto____7397) {
            return i__7395 < size
          }else {
            return and__3822__auto____7397
          }
        }())) {
          a__7393[i__7395] = cljs.core.first.call(null, s__7396);
          var G__7400 = i__7395 + 1;
          var G__7401 = cljs.core.next.call(null, s__7396);
          i__7395 = G__7400;
          s__7396 = G__7401;
          continue
        }else {
          return a__7393
        }
        break
      }
    }else {
      var n__2555__auto____7398 = size;
      var i__7399 = 0;
      while(true) {
        if(i__7399 < n__2555__auto____7398) {
          a__7393[i__7399] = init_val_or_seq;
          var G__7402 = i__7399 + 1;
          i__7399 = G__7402;
          continue
        }else {
        }
        break
      }
      return a__7393
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
    var a__7410 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7411 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7412 = 0;
      var s__7413 = s__7411;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7414 = s__7413;
          if(and__3822__auto____7414) {
            return i__7412 < size
          }else {
            return and__3822__auto____7414
          }
        }())) {
          a__7410[i__7412] = cljs.core.first.call(null, s__7413);
          var G__7417 = i__7412 + 1;
          var G__7418 = cljs.core.next.call(null, s__7413);
          i__7412 = G__7417;
          s__7413 = G__7418;
          continue
        }else {
          return a__7410
        }
        break
      }
    }else {
      var n__2555__auto____7415 = size;
      var i__7416 = 0;
      while(true) {
        if(i__7416 < n__2555__auto____7415) {
          a__7410[i__7416] = init_val_or_seq;
          var G__7419 = i__7416 + 1;
          i__7416 = G__7419;
          continue
        }else {
        }
        break
      }
      return a__7410
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
    var s__7424 = s;
    var i__7425 = n;
    var sum__7426 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7427 = i__7425 > 0;
        if(and__3822__auto____7427) {
          return cljs.core.seq.call(null, s__7424)
        }else {
          return and__3822__auto____7427
        }
      }())) {
        var G__7428 = cljs.core.next.call(null, s__7424);
        var G__7429 = i__7425 - 1;
        var G__7430 = sum__7426 + 1;
        s__7424 = G__7428;
        i__7425 = G__7429;
        sum__7426 = G__7430;
        continue
      }else {
        return sum__7426
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
      var s__7435 = cljs.core.seq.call(null, x);
      if(s__7435) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7435)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7435), concat.call(null, cljs.core.chunk_rest.call(null, s__7435), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7435), concat.call(null, cljs.core.rest.call(null, s__7435), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7439__delegate = function(x, y, zs) {
      var cat__7438 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7437 = cljs.core.seq.call(null, xys);
          if(xys__7437) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7437)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7437), cat.call(null, cljs.core.chunk_rest.call(null, xys__7437), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7437), cat.call(null, cljs.core.rest.call(null, xys__7437), zs))
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
      return cat__7438.call(null, concat.call(null, x, y), zs)
    };
    var G__7439 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7439__delegate.call(this, x, y, zs)
    };
    G__7439.cljs$lang$maxFixedArity = 2;
    G__7439.cljs$lang$applyTo = function(arglist__7440) {
      var x = cljs.core.first(arglist__7440);
      var y = cljs.core.first(cljs.core.next(arglist__7440));
      var zs = cljs.core.rest(cljs.core.next(arglist__7440));
      return G__7439__delegate(x, y, zs)
    };
    G__7439.cljs$lang$arity$variadic = G__7439__delegate;
    return G__7439
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
    var G__7441__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7441 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7441__delegate.call(this, a, b, c, d, more)
    };
    G__7441.cljs$lang$maxFixedArity = 4;
    G__7441.cljs$lang$applyTo = function(arglist__7442) {
      var a = cljs.core.first(arglist__7442);
      var b = cljs.core.first(cljs.core.next(arglist__7442));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7442)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7442))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7442))));
      return G__7441__delegate(a, b, c, d, more)
    };
    G__7441.cljs$lang$arity$variadic = G__7441__delegate;
    return G__7441
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
  var args__7484 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7485 = cljs.core._first.call(null, args__7484);
    var args__7486 = cljs.core._rest.call(null, args__7484);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7485)
      }else {
        return f.call(null, a__7485)
      }
    }else {
      var b__7487 = cljs.core._first.call(null, args__7486);
      var args__7488 = cljs.core._rest.call(null, args__7486);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7485, b__7487)
        }else {
          return f.call(null, a__7485, b__7487)
        }
      }else {
        var c__7489 = cljs.core._first.call(null, args__7488);
        var args__7490 = cljs.core._rest.call(null, args__7488);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7485, b__7487, c__7489)
          }else {
            return f.call(null, a__7485, b__7487, c__7489)
          }
        }else {
          var d__7491 = cljs.core._first.call(null, args__7490);
          var args__7492 = cljs.core._rest.call(null, args__7490);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7485, b__7487, c__7489, d__7491)
            }else {
              return f.call(null, a__7485, b__7487, c__7489, d__7491)
            }
          }else {
            var e__7493 = cljs.core._first.call(null, args__7492);
            var args__7494 = cljs.core._rest.call(null, args__7492);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7485, b__7487, c__7489, d__7491, e__7493)
              }else {
                return f.call(null, a__7485, b__7487, c__7489, d__7491, e__7493)
              }
            }else {
              var f__7495 = cljs.core._first.call(null, args__7494);
              var args__7496 = cljs.core._rest.call(null, args__7494);
              if(argc === 6) {
                if(f__7495.cljs$lang$arity$6) {
                  return f__7495.cljs$lang$arity$6(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495)
                }else {
                  return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495)
                }
              }else {
                var g__7497 = cljs.core._first.call(null, args__7496);
                var args__7498 = cljs.core._rest.call(null, args__7496);
                if(argc === 7) {
                  if(f__7495.cljs$lang$arity$7) {
                    return f__7495.cljs$lang$arity$7(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497)
                  }else {
                    return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497)
                  }
                }else {
                  var h__7499 = cljs.core._first.call(null, args__7498);
                  var args__7500 = cljs.core._rest.call(null, args__7498);
                  if(argc === 8) {
                    if(f__7495.cljs$lang$arity$8) {
                      return f__7495.cljs$lang$arity$8(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499)
                    }else {
                      return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499)
                    }
                  }else {
                    var i__7501 = cljs.core._first.call(null, args__7500);
                    var args__7502 = cljs.core._rest.call(null, args__7500);
                    if(argc === 9) {
                      if(f__7495.cljs$lang$arity$9) {
                        return f__7495.cljs$lang$arity$9(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501)
                      }else {
                        return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501)
                      }
                    }else {
                      var j__7503 = cljs.core._first.call(null, args__7502);
                      var args__7504 = cljs.core._rest.call(null, args__7502);
                      if(argc === 10) {
                        if(f__7495.cljs$lang$arity$10) {
                          return f__7495.cljs$lang$arity$10(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503)
                        }else {
                          return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503)
                        }
                      }else {
                        var k__7505 = cljs.core._first.call(null, args__7504);
                        var args__7506 = cljs.core._rest.call(null, args__7504);
                        if(argc === 11) {
                          if(f__7495.cljs$lang$arity$11) {
                            return f__7495.cljs$lang$arity$11(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505)
                          }else {
                            return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505)
                          }
                        }else {
                          var l__7507 = cljs.core._first.call(null, args__7506);
                          var args__7508 = cljs.core._rest.call(null, args__7506);
                          if(argc === 12) {
                            if(f__7495.cljs$lang$arity$12) {
                              return f__7495.cljs$lang$arity$12(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507)
                            }else {
                              return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507)
                            }
                          }else {
                            var m__7509 = cljs.core._first.call(null, args__7508);
                            var args__7510 = cljs.core._rest.call(null, args__7508);
                            if(argc === 13) {
                              if(f__7495.cljs$lang$arity$13) {
                                return f__7495.cljs$lang$arity$13(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509)
                              }else {
                                return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509)
                              }
                            }else {
                              var n__7511 = cljs.core._first.call(null, args__7510);
                              var args__7512 = cljs.core._rest.call(null, args__7510);
                              if(argc === 14) {
                                if(f__7495.cljs$lang$arity$14) {
                                  return f__7495.cljs$lang$arity$14(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511)
                                }else {
                                  return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511)
                                }
                              }else {
                                var o__7513 = cljs.core._first.call(null, args__7512);
                                var args__7514 = cljs.core._rest.call(null, args__7512);
                                if(argc === 15) {
                                  if(f__7495.cljs$lang$arity$15) {
                                    return f__7495.cljs$lang$arity$15(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513)
                                  }else {
                                    return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513)
                                  }
                                }else {
                                  var p__7515 = cljs.core._first.call(null, args__7514);
                                  var args__7516 = cljs.core._rest.call(null, args__7514);
                                  if(argc === 16) {
                                    if(f__7495.cljs$lang$arity$16) {
                                      return f__7495.cljs$lang$arity$16(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515)
                                    }else {
                                      return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515)
                                    }
                                  }else {
                                    var q__7517 = cljs.core._first.call(null, args__7516);
                                    var args__7518 = cljs.core._rest.call(null, args__7516);
                                    if(argc === 17) {
                                      if(f__7495.cljs$lang$arity$17) {
                                        return f__7495.cljs$lang$arity$17(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517)
                                      }else {
                                        return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517)
                                      }
                                    }else {
                                      var r__7519 = cljs.core._first.call(null, args__7518);
                                      var args__7520 = cljs.core._rest.call(null, args__7518);
                                      if(argc === 18) {
                                        if(f__7495.cljs$lang$arity$18) {
                                          return f__7495.cljs$lang$arity$18(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519)
                                        }else {
                                          return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519)
                                        }
                                      }else {
                                        var s__7521 = cljs.core._first.call(null, args__7520);
                                        var args__7522 = cljs.core._rest.call(null, args__7520);
                                        if(argc === 19) {
                                          if(f__7495.cljs$lang$arity$19) {
                                            return f__7495.cljs$lang$arity$19(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519, s__7521)
                                          }else {
                                            return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519, s__7521)
                                          }
                                        }else {
                                          var t__7523 = cljs.core._first.call(null, args__7522);
                                          var args__7524 = cljs.core._rest.call(null, args__7522);
                                          if(argc === 20) {
                                            if(f__7495.cljs$lang$arity$20) {
                                              return f__7495.cljs$lang$arity$20(a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519, s__7521, t__7523)
                                            }else {
                                              return f__7495.call(null, a__7485, b__7487, c__7489, d__7491, e__7493, f__7495, g__7497, h__7499, i__7501, j__7503, k__7505, l__7507, m__7509, n__7511, o__7513, p__7515, q__7517, r__7519, s__7521, t__7523)
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
    var fixed_arity__7539 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7540 = cljs.core.bounded_count.call(null, args, fixed_arity__7539 + 1);
      if(bc__7540 <= fixed_arity__7539) {
        return cljs.core.apply_to.call(null, f, bc__7540, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7541 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7542 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7543 = cljs.core.bounded_count.call(null, arglist__7541, fixed_arity__7542 + 1);
      if(bc__7543 <= fixed_arity__7542) {
        return cljs.core.apply_to.call(null, f, bc__7543, arglist__7541)
      }else {
        return f.cljs$lang$applyTo(arglist__7541)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7541))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7544 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7545 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7546 = cljs.core.bounded_count.call(null, arglist__7544, fixed_arity__7545 + 1);
      if(bc__7546 <= fixed_arity__7545) {
        return cljs.core.apply_to.call(null, f, bc__7546, arglist__7544)
      }else {
        return f.cljs$lang$applyTo(arglist__7544)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7544))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7547 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7548 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7549 = cljs.core.bounded_count.call(null, arglist__7547, fixed_arity__7548 + 1);
      if(bc__7549 <= fixed_arity__7548) {
        return cljs.core.apply_to.call(null, f, bc__7549, arglist__7547)
      }else {
        return f.cljs$lang$applyTo(arglist__7547)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7547))
    }
  };
  var apply__6 = function() {
    var G__7553__delegate = function(f, a, b, c, d, args) {
      var arglist__7550 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7551 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7552 = cljs.core.bounded_count.call(null, arglist__7550, fixed_arity__7551 + 1);
        if(bc__7552 <= fixed_arity__7551) {
          return cljs.core.apply_to.call(null, f, bc__7552, arglist__7550)
        }else {
          return f.cljs$lang$applyTo(arglist__7550)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7550))
      }
    };
    var G__7553 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7553__delegate.call(this, f, a, b, c, d, args)
    };
    G__7553.cljs$lang$maxFixedArity = 5;
    G__7553.cljs$lang$applyTo = function(arglist__7554) {
      var f = cljs.core.first(arglist__7554);
      var a = cljs.core.first(cljs.core.next(arglist__7554));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7554)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7554))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7554)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7554)))));
      return G__7553__delegate(f, a, b, c, d, args)
    };
    G__7553.cljs$lang$arity$variadic = G__7553__delegate;
    return G__7553
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
  vary_meta.cljs$lang$applyTo = function(arglist__7555) {
    var obj = cljs.core.first(arglist__7555);
    var f = cljs.core.first(cljs.core.next(arglist__7555));
    var args = cljs.core.rest(cljs.core.next(arglist__7555));
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
    var G__7556__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7556 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7556__delegate.call(this, x, y, more)
    };
    G__7556.cljs$lang$maxFixedArity = 2;
    G__7556.cljs$lang$applyTo = function(arglist__7557) {
      var x = cljs.core.first(arglist__7557);
      var y = cljs.core.first(cljs.core.next(arglist__7557));
      var more = cljs.core.rest(cljs.core.next(arglist__7557));
      return G__7556__delegate(x, y, more)
    };
    G__7556.cljs$lang$arity$variadic = G__7556__delegate;
    return G__7556
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
        var G__7558 = pred;
        var G__7559 = cljs.core.next.call(null, coll);
        pred = G__7558;
        coll = G__7559;
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
      var or__3824__auto____7561 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7561)) {
        return or__3824__auto____7561
      }else {
        var G__7562 = pred;
        var G__7563 = cljs.core.next.call(null, coll);
        pred = G__7562;
        coll = G__7563;
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
    var G__7564 = null;
    var G__7564__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7564__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7564__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7564__3 = function() {
      var G__7565__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7565 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7565__delegate.call(this, x, y, zs)
      };
      G__7565.cljs$lang$maxFixedArity = 2;
      G__7565.cljs$lang$applyTo = function(arglist__7566) {
        var x = cljs.core.first(arglist__7566);
        var y = cljs.core.first(cljs.core.next(arglist__7566));
        var zs = cljs.core.rest(cljs.core.next(arglist__7566));
        return G__7565__delegate(x, y, zs)
      };
      G__7565.cljs$lang$arity$variadic = G__7565__delegate;
      return G__7565
    }();
    G__7564 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7564__0.call(this);
        case 1:
          return G__7564__1.call(this, x);
        case 2:
          return G__7564__2.call(this, x, y);
        default:
          return G__7564__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7564.cljs$lang$maxFixedArity = 2;
    G__7564.cljs$lang$applyTo = G__7564__3.cljs$lang$applyTo;
    return G__7564
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7567__delegate = function(args) {
      return x
    };
    var G__7567 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7567__delegate.call(this, args)
    };
    G__7567.cljs$lang$maxFixedArity = 0;
    G__7567.cljs$lang$applyTo = function(arglist__7568) {
      var args = cljs.core.seq(arglist__7568);
      return G__7567__delegate(args)
    };
    G__7567.cljs$lang$arity$variadic = G__7567__delegate;
    return G__7567
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
      var G__7575 = null;
      var G__7575__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7575__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7575__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7575__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7575__4 = function() {
        var G__7576__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7576 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7576__delegate.call(this, x, y, z, args)
        };
        G__7576.cljs$lang$maxFixedArity = 3;
        G__7576.cljs$lang$applyTo = function(arglist__7577) {
          var x = cljs.core.first(arglist__7577);
          var y = cljs.core.first(cljs.core.next(arglist__7577));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7577)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7577)));
          return G__7576__delegate(x, y, z, args)
        };
        G__7576.cljs$lang$arity$variadic = G__7576__delegate;
        return G__7576
      }();
      G__7575 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7575__0.call(this);
          case 1:
            return G__7575__1.call(this, x);
          case 2:
            return G__7575__2.call(this, x, y);
          case 3:
            return G__7575__3.call(this, x, y, z);
          default:
            return G__7575__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7575.cljs$lang$maxFixedArity = 3;
      G__7575.cljs$lang$applyTo = G__7575__4.cljs$lang$applyTo;
      return G__7575
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7578 = null;
      var G__7578__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7578__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7578__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7578__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7578__4 = function() {
        var G__7579__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7579 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7579__delegate.call(this, x, y, z, args)
        };
        G__7579.cljs$lang$maxFixedArity = 3;
        G__7579.cljs$lang$applyTo = function(arglist__7580) {
          var x = cljs.core.first(arglist__7580);
          var y = cljs.core.first(cljs.core.next(arglist__7580));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7580)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7580)));
          return G__7579__delegate(x, y, z, args)
        };
        G__7579.cljs$lang$arity$variadic = G__7579__delegate;
        return G__7579
      }();
      G__7578 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7578__0.call(this);
          case 1:
            return G__7578__1.call(this, x);
          case 2:
            return G__7578__2.call(this, x, y);
          case 3:
            return G__7578__3.call(this, x, y, z);
          default:
            return G__7578__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7578.cljs$lang$maxFixedArity = 3;
      G__7578.cljs$lang$applyTo = G__7578__4.cljs$lang$applyTo;
      return G__7578
    }()
  };
  var comp__4 = function() {
    var G__7581__delegate = function(f1, f2, f3, fs) {
      var fs__7572 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7582__delegate = function(args) {
          var ret__7573 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7572), args);
          var fs__7574 = cljs.core.next.call(null, fs__7572);
          while(true) {
            if(fs__7574) {
              var G__7583 = cljs.core.first.call(null, fs__7574).call(null, ret__7573);
              var G__7584 = cljs.core.next.call(null, fs__7574);
              ret__7573 = G__7583;
              fs__7574 = G__7584;
              continue
            }else {
              return ret__7573
            }
            break
          }
        };
        var G__7582 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7582__delegate.call(this, args)
        };
        G__7582.cljs$lang$maxFixedArity = 0;
        G__7582.cljs$lang$applyTo = function(arglist__7585) {
          var args = cljs.core.seq(arglist__7585);
          return G__7582__delegate(args)
        };
        G__7582.cljs$lang$arity$variadic = G__7582__delegate;
        return G__7582
      }()
    };
    var G__7581 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7581__delegate.call(this, f1, f2, f3, fs)
    };
    G__7581.cljs$lang$maxFixedArity = 3;
    G__7581.cljs$lang$applyTo = function(arglist__7586) {
      var f1 = cljs.core.first(arglist__7586);
      var f2 = cljs.core.first(cljs.core.next(arglist__7586));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7586)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7586)));
      return G__7581__delegate(f1, f2, f3, fs)
    };
    G__7581.cljs$lang$arity$variadic = G__7581__delegate;
    return G__7581
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
      var G__7587__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7587 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7587__delegate.call(this, args)
      };
      G__7587.cljs$lang$maxFixedArity = 0;
      G__7587.cljs$lang$applyTo = function(arglist__7588) {
        var args = cljs.core.seq(arglist__7588);
        return G__7587__delegate(args)
      };
      G__7587.cljs$lang$arity$variadic = G__7587__delegate;
      return G__7587
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7589__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7589 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7589__delegate.call(this, args)
      };
      G__7589.cljs$lang$maxFixedArity = 0;
      G__7589.cljs$lang$applyTo = function(arglist__7590) {
        var args = cljs.core.seq(arglist__7590);
        return G__7589__delegate(args)
      };
      G__7589.cljs$lang$arity$variadic = G__7589__delegate;
      return G__7589
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7591__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7591 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7591__delegate.call(this, args)
      };
      G__7591.cljs$lang$maxFixedArity = 0;
      G__7591.cljs$lang$applyTo = function(arglist__7592) {
        var args = cljs.core.seq(arglist__7592);
        return G__7591__delegate(args)
      };
      G__7591.cljs$lang$arity$variadic = G__7591__delegate;
      return G__7591
    }()
  };
  var partial__5 = function() {
    var G__7593__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7594__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7594 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7594__delegate.call(this, args)
        };
        G__7594.cljs$lang$maxFixedArity = 0;
        G__7594.cljs$lang$applyTo = function(arglist__7595) {
          var args = cljs.core.seq(arglist__7595);
          return G__7594__delegate(args)
        };
        G__7594.cljs$lang$arity$variadic = G__7594__delegate;
        return G__7594
      }()
    };
    var G__7593 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7593__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7593.cljs$lang$maxFixedArity = 4;
    G__7593.cljs$lang$applyTo = function(arglist__7596) {
      var f = cljs.core.first(arglist__7596);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7596));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7596)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7596))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7596))));
      return G__7593__delegate(f, arg1, arg2, arg3, more)
    };
    G__7593.cljs$lang$arity$variadic = G__7593__delegate;
    return G__7593
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
      var G__7597 = null;
      var G__7597__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7597__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7597__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7597__4 = function() {
        var G__7598__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7598 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7598__delegate.call(this, a, b, c, ds)
        };
        G__7598.cljs$lang$maxFixedArity = 3;
        G__7598.cljs$lang$applyTo = function(arglist__7599) {
          var a = cljs.core.first(arglist__7599);
          var b = cljs.core.first(cljs.core.next(arglist__7599));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7599)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7599)));
          return G__7598__delegate(a, b, c, ds)
        };
        G__7598.cljs$lang$arity$variadic = G__7598__delegate;
        return G__7598
      }();
      G__7597 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7597__1.call(this, a);
          case 2:
            return G__7597__2.call(this, a, b);
          case 3:
            return G__7597__3.call(this, a, b, c);
          default:
            return G__7597__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7597.cljs$lang$maxFixedArity = 3;
      G__7597.cljs$lang$applyTo = G__7597__4.cljs$lang$applyTo;
      return G__7597
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7600 = null;
      var G__7600__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7600__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7600__4 = function() {
        var G__7601__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7601 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7601__delegate.call(this, a, b, c, ds)
        };
        G__7601.cljs$lang$maxFixedArity = 3;
        G__7601.cljs$lang$applyTo = function(arglist__7602) {
          var a = cljs.core.first(arglist__7602);
          var b = cljs.core.first(cljs.core.next(arglist__7602));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7602)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7602)));
          return G__7601__delegate(a, b, c, ds)
        };
        G__7601.cljs$lang$arity$variadic = G__7601__delegate;
        return G__7601
      }();
      G__7600 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7600__2.call(this, a, b);
          case 3:
            return G__7600__3.call(this, a, b, c);
          default:
            return G__7600__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7600.cljs$lang$maxFixedArity = 3;
      G__7600.cljs$lang$applyTo = G__7600__4.cljs$lang$applyTo;
      return G__7600
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7603 = null;
      var G__7603__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7603__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7603__4 = function() {
        var G__7604__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7604 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7604__delegate.call(this, a, b, c, ds)
        };
        G__7604.cljs$lang$maxFixedArity = 3;
        G__7604.cljs$lang$applyTo = function(arglist__7605) {
          var a = cljs.core.first(arglist__7605);
          var b = cljs.core.first(cljs.core.next(arglist__7605));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7605)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7605)));
          return G__7604__delegate(a, b, c, ds)
        };
        G__7604.cljs$lang$arity$variadic = G__7604__delegate;
        return G__7604
      }();
      G__7603 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7603__2.call(this, a, b);
          case 3:
            return G__7603__3.call(this, a, b, c);
          default:
            return G__7603__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7603.cljs$lang$maxFixedArity = 3;
      G__7603.cljs$lang$applyTo = G__7603__4.cljs$lang$applyTo;
      return G__7603
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
  var mapi__7621 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7629 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7629) {
        var s__7630 = temp__3974__auto____7629;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7630)) {
          var c__7631 = cljs.core.chunk_first.call(null, s__7630);
          var size__7632 = cljs.core.count.call(null, c__7631);
          var b__7633 = cljs.core.chunk_buffer.call(null, size__7632);
          var n__2555__auto____7634 = size__7632;
          var i__7635 = 0;
          while(true) {
            if(i__7635 < n__2555__auto____7634) {
              cljs.core.chunk_append.call(null, b__7633, f.call(null, idx + i__7635, cljs.core._nth.call(null, c__7631, i__7635)));
              var G__7636 = i__7635 + 1;
              i__7635 = G__7636;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7633), mapi.call(null, idx + size__7632, cljs.core.chunk_rest.call(null, s__7630)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7630)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7630)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7621.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7646 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____7646) {
      var s__7647 = temp__3974__auto____7646;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7647)) {
        var c__7648 = cljs.core.chunk_first.call(null, s__7647);
        var size__7649 = cljs.core.count.call(null, c__7648);
        var b__7650 = cljs.core.chunk_buffer.call(null, size__7649);
        var n__2555__auto____7651 = size__7649;
        var i__7652 = 0;
        while(true) {
          if(i__7652 < n__2555__auto____7651) {
            var x__7653 = f.call(null, cljs.core._nth.call(null, c__7648, i__7652));
            if(x__7653 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7650, x__7653)
            }
            var G__7655 = i__7652 + 1;
            i__7652 = G__7655;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7650), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7647)))
      }else {
        var x__7654 = f.call(null, cljs.core.first.call(null, s__7647));
        if(x__7654 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7647))
        }else {
          return cljs.core.cons.call(null, x__7654, keep.call(null, f, cljs.core.rest.call(null, s__7647)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7681 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7691 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____7691) {
        var s__7692 = temp__3974__auto____7691;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7692)) {
          var c__7693 = cljs.core.chunk_first.call(null, s__7692);
          var size__7694 = cljs.core.count.call(null, c__7693);
          var b__7695 = cljs.core.chunk_buffer.call(null, size__7694);
          var n__2555__auto____7696 = size__7694;
          var i__7697 = 0;
          while(true) {
            if(i__7697 < n__2555__auto____7696) {
              var x__7698 = f.call(null, idx + i__7697, cljs.core._nth.call(null, c__7693, i__7697));
              if(x__7698 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7695, x__7698)
              }
              var G__7700 = i__7697 + 1;
              i__7697 = G__7700;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7695), keepi.call(null, idx + size__7694, cljs.core.chunk_rest.call(null, s__7692)))
        }else {
          var x__7699 = f.call(null, idx, cljs.core.first.call(null, s__7692));
          if(x__7699 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7692))
          }else {
            return cljs.core.cons.call(null, x__7699, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7692)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7681.call(null, 0, coll)
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
          var and__3822__auto____7786 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7786)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____7786
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7787 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7787)) {
            var and__3822__auto____7788 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7788)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____7788
            }
          }else {
            return and__3822__auto____7787
          }
        }())
      };
      var ep1__4 = function() {
        var G__7857__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7789 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7789)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____7789
            }
          }())
        };
        var G__7857 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7857__delegate.call(this, x, y, z, args)
        };
        G__7857.cljs$lang$maxFixedArity = 3;
        G__7857.cljs$lang$applyTo = function(arglist__7858) {
          var x = cljs.core.first(arglist__7858);
          var y = cljs.core.first(cljs.core.next(arglist__7858));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7858)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7858)));
          return G__7857__delegate(x, y, z, args)
        };
        G__7857.cljs$lang$arity$variadic = G__7857__delegate;
        return G__7857
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
          var and__3822__auto____7801 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7801)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____7801
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7802 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7802)) {
            var and__3822__auto____7803 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7803)) {
              var and__3822__auto____7804 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7804)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____7804
              }
            }else {
              return and__3822__auto____7803
            }
          }else {
            return and__3822__auto____7802
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7805 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7805)) {
            var and__3822__auto____7806 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7806)) {
              var and__3822__auto____7807 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7807)) {
                var and__3822__auto____7808 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7808)) {
                  var and__3822__auto____7809 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7809)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____7809
                  }
                }else {
                  return and__3822__auto____7808
                }
              }else {
                return and__3822__auto____7807
              }
            }else {
              return and__3822__auto____7806
            }
          }else {
            return and__3822__auto____7805
          }
        }())
      };
      var ep2__4 = function() {
        var G__7859__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7810 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7810)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7656_SHARP_) {
                var and__3822__auto____7811 = p1.call(null, p1__7656_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7811)) {
                  return p2.call(null, p1__7656_SHARP_)
                }else {
                  return and__3822__auto____7811
                }
              }, args)
            }else {
              return and__3822__auto____7810
            }
          }())
        };
        var G__7859 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7859__delegate.call(this, x, y, z, args)
        };
        G__7859.cljs$lang$maxFixedArity = 3;
        G__7859.cljs$lang$applyTo = function(arglist__7860) {
          var x = cljs.core.first(arglist__7860);
          var y = cljs.core.first(cljs.core.next(arglist__7860));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7860)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7860)));
          return G__7859__delegate(x, y, z, args)
        };
        G__7859.cljs$lang$arity$variadic = G__7859__delegate;
        return G__7859
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
          var and__3822__auto____7830 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7830)) {
            var and__3822__auto____7831 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7831)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____7831
            }
          }else {
            return and__3822__auto____7830
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7832 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7832)) {
            var and__3822__auto____7833 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7833)) {
              var and__3822__auto____7834 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7834)) {
                var and__3822__auto____7835 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7835)) {
                  var and__3822__auto____7836 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7836)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____7836
                  }
                }else {
                  return and__3822__auto____7835
                }
              }else {
                return and__3822__auto____7834
              }
            }else {
              return and__3822__auto____7833
            }
          }else {
            return and__3822__auto____7832
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____7837 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7837)) {
            var and__3822__auto____7838 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7838)) {
              var and__3822__auto____7839 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7839)) {
                var and__3822__auto____7840 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7840)) {
                  var and__3822__auto____7841 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7841)) {
                    var and__3822__auto____7842 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7842)) {
                      var and__3822__auto____7843 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7843)) {
                        var and__3822__auto____7844 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7844)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____7844
                        }
                      }else {
                        return and__3822__auto____7843
                      }
                    }else {
                      return and__3822__auto____7842
                    }
                  }else {
                    return and__3822__auto____7841
                  }
                }else {
                  return and__3822__auto____7840
                }
              }else {
                return and__3822__auto____7839
              }
            }else {
              return and__3822__auto____7838
            }
          }else {
            return and__3822__auto____7837
          }
        }())
      };
      var ep3__4 = function() {
        var G__7861__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____7845 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____7845)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7657_SHARP_) {
                var and__3822__auto____7846 = p1.call(null, p1__7657_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7846)) {
                  var and__3822__auto____7847 = p2.call(null, p1__7657_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7847)) {
                    return p3.call(null, p1__7657_SHARP_)
                  }else {
                    return and__3822__auto____7847
                  }
                }else {
                  return and__3822__auto____7846
                }
              }, args)
            }else {
              return and__3822__auto____7845
            }
          }())
        };
        var G__7861 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7861__delegate.call(this, x, y, z, args)
        };
        G__7861.cljs$lang$maxFixedArity = 3;
        G__7861.cljs$lang$applyTo = function(arglist__7862) {
          var x = cljs.core.first(arglist__7862);
          var y = cljs.core.first(cljs.core.next(arglist__7862));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7862)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7862)));
          return G__7861__delegate(x, y, z, args)
        };
        G__7861.cljs$lang$arity$variadic = G__7861__delegate;
        return G__7861
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
    var G__7863__delegate = function(p1, p2, p3, ps) {
      var ps__7848 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7658_SHARP_) {
            return p1__7658_SHARP_.call(null, x)
          }, ps__7848)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7659_SHARP_) {
            var and__3822__auto____7853 = p1__7659_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7853)) {
              return p1__7659_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7853
            }
          }, ps__7848)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7660_SHARP_) {
            var and__3822__auto____7854 = p1__7660_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7854)) {
              var and__3822__auto____7855 = p1__7660_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7855)) {
                return p1__7660_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7855
              }
            }else {
              return and__3822__auto____7854
            }
          }, ps__7848)
        };
        var epn__4 = function() {
          var G__7864__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____7856 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____7856)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7661_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7661_SHARP_, args)
                }, ps__7848)
              }else {
                return and__3822__auto____7856
              }
            }())
          };
          var G__7864 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7864__delegate.call(this, x, y, z, args)
          };
          G__7864.cljs$lang$maxFixedArity = 3;
          G__7864.cljs$lang$applyTo = function(arglist__7865) {
            var x = cljs.core.first(arglist__7865);
            var y = cljs.core.first(cljs.core.next(arglist__7865));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7865)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7865)));
            return G__7864__delegate(x, y, z, args)
          };
          G__7864.cljs$lang$arity$variadic = G__7864__delegate;
          return G__7864
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
    var G__7863 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7863__delegate.call(this, p1, p2, p3, ps)
    };
    G__7863.cljs$lang$maxFixedArity = 3;
    G__7863.cljs$lang$applyTo = function(arglist__7866) {
      var p1 = cljs.core.first(arglist__7866);
      var p2 = cljs.core.first(cljs.core.next(arglist__7866));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7866)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7866)));
      return G__7863__delegate(p1, p2, p3, ps)
    };
    G__7863.cljs$lang$arity$variadic = G__7863__delegate;
    return G__7863
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
        var or__3824__auto____7947 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7947)) {
          return or__3824__auto____7947
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7948 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7948)) {
          return or__3824__auto____7948
        }else {
          var or__3824__auto____7949 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7949)) {
            return or__3824__auto____7949
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8018__delegate = function(x, y, z, args) {
          var or__3824__auto____7950 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7950)) {
            return or__3824__auto____7950
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8018 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8018__delegate.call(this, x, y, z, args)
        };
        G__8018.cljs$lang$maxFixedArity = 3;
        G__8018.cljs$lang$applyTo = function(arglist__8019) {
          var x = cljs.core.first(arglist__8019);
          var y = cljs.core.first(cljs.core.next(arglist__8019));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8019)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8019)));
          return G__8018__delegate(x, y, z, args)
        };
        G__8018.cljs$lang$arity$variadic = G__8018__delegate;
        return G__8018
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
        var or__3824__auto____7962 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7962)) {
          return or__3824__auto____7962
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____7963 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7963)) {
          return or__3824__auto____7963
        }else {
          var or__3824__auto____7964 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7964)) {
            return or__3824__auto____7964
          }else {
            var or__3824__auto____7965 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7965)) {
              return or__3824__auto____7965
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____7966 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7966)) {
          return or__3824__auto____7966
        }else {
          var or__3824__auto____7967 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7967)) {
            return or__3824__auto____7967
          }else {
            var or__3824__auto____7968 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____7968)) {
              return or__3824__auto____7968
            }else {
              var or__3824__auto____7969 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____7969)) {
                return or__3824__auto____7969
              }else {
                var or__3824__auto____7970 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7970)) {
                  return or__3824__auto____7970
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8020__delegate = function(x, y, z, args) {
          var or__3824__auto____7971 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____7971)) {
            return or__3824__auto____7971
          }else {
            return cljs.core.some.call(null, function(p1__7701_SHARP_) {
              var or__3824__auto____7972 = p1.call(null, p1__7701_SHARP_);
              if(cljs.core.truth_(or__3824__auto____7972)) {
                return or__3824__auto____7972
              }else {
                return p2.call(null, p1__7701_SHARP_)
              }
            }, args)
          }
        };
        var G__8020 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8020__delegate.call(this, x, y, z, args)
        };
        G__8020.cljs$lang$maxFixedArity = 3;
        G__8020.cljs$lang$applyTo = function(arglist__8021) {
          var x = cljs.core.first(arglist__8021);
          var y = cljs.core.first(cljs.core.next(arglist__8021));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8021)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8021)));
          return G__8020__delegate(x, y, z, args)
        };
        G__8020.cljs$lang$arity$variadic = G__8020__delegate;
        return G__8020
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
        var or__3824__auto____7991 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7991)) {
          return or__3824__auto____7991
        }else {
          var or__3824__auto____7992 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7992)) {
            return or__3824__auto____7992
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____7993 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7993)) {
          return or__3824__auto____7993
        }else {
          var or__3824__auto____7994 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7994)) {
            return or__3824__auto____7994
          }else {
            var or__3824__auto____7995 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____7995)) {
              return or__3824__auto____7995
            }else {
              var or__3824__auto____7996 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____7996)) {
                return or__3824__auto____7996
              }else {
                var or__3824__auto____7997 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____7997)) {
                  return or__3824__auto____7997
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____7998 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7998)) {
          return or__3824__auto____7998
        }else {
          var or__3824__auto____7999 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____7999)) {
            return or__3824__auto____7999
          }else {
            var or__3824__auto____8000 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8000)) {
              return or__3824__auto____8000
            }else {
              var or__3824__auto____8001 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8001)) {
                return or__3824__auto____8001
              }else {
                var or__3824__auto____8002 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8002)) {
                  return or__3824__auto____8002
                }else {
                  var or__3824__auto____8003 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8003)) {
                    return or__3824__auto____8003
                  }else {
                    var or__3824__auto____8004 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8004)) {
                      return or__3824__auto____8004
                    }else {
                      var or__3824__auto____8005 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8005)) {
                        return or__3824__auto____8005
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
        var G__8022__delegate = function(x, y, z, args) {
          var or__3824__auto____8006 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8006)) {
            return or__3824__auto____8006
          }else {
            return cljs.core.some.call(null, function(p1__7702_SHARP_) {
              var or__3824__auto____8007 = p1.call(null, p1__7702_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8007)) {
                return or__3824__auto____8007
              }else {
                var or__3824__auto____8008 = p2.call(null, p1__7702_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8008)) {
                  return or__3824__auto____8008
                }else {
                  return p3.call(null, p1__7702_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8022 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8022__delegate.call(this, x, y, z, args)
        };
        G__8022.cljs$lang$maxFixedArity = 3;
        G__8022.cljs$lang$applyTo = function(arglist__8023) {
          var x = cljs.core.first(arglist__8023);
          var y = cljs.core.first(cljs.core.next(arglist__8023));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8023)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8023)));
          return G__8022__delegate(x, y, z, args)
        };
        G__8022.cljs$lang$arity$variadic = G__8022__delegate;
        return G__8022
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
    var G__8024__delegate = function(p1, p2, p3, ps) {
      var ps__8009 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7703_SHARP_) {
            return p1__7703_SHARP_.call(null, x)
          }, ps__8009)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7704_SHARP_) {
            var or__3824__auto____8014 = p1__7704_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8014)) {
              return or__3824__auto____8014
            }else {
              return p1__7704_SHARP_.call(null, y)
            }
          }, ps__8009)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7705_SHARP_) {
            var or__3824__auto____8015 = p1__7705_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8015)) {
              return or__3824__auto____8015
            }else {
              var or__3824__auto____8016 = p1__7705_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8016)) {
                return or__3824__auto____8016
              }else {
                return p1__7705_SHARP_.call(null, z)
              }
            }
          }, ps__8009)
        };
        var spn__4 = function() {
          var G__8025__delegate = function(x, y, z, args) {
            var or__3824__auto____8017 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8017)) {
              return or__3824__auto____8017
            }else {
              return cljs.core.some.call(null, function(p1__7706_SHARP_) {
                return cljs.core.some.call(null, p1__7706_SHARP_, args)
              }, ps__8009)
            }
          };
          var G__8025 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8025__delegate.call(this, x, y, z, args)
          };
          G__8025.cljs$lang$maxFixedArity = 3;
          G__8025.cljs$lang$applyTo = function(arglist__8026) {
            var x = cljs.core.first(arglist__8026);
            var y = cljs.core.first(cljs.core.next(arglist__8026));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8026)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8026)));
            return G__8025__delegate(x, y, z, args)
          };
          G__8025.cljs$lang$arity$variadic = G__8025__delegate;
          return G__8025
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
    var G__8024 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8024__delegate.call(this, p1, p2, p3, ps)
    };
    G__8024.cljs$lang$maxFixedArity = 3;
    G__8024.cljs$lang$applyTo = function(arglist__8027) {
      var p1 = cljs.core.first(arglist__8027);
      var p2 = cljs.core.first(cljs.core.next(arglist__8027));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8027)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8027)));
      return G__8024__delegate(p1, p2, p3, ps)
    };
    G__8024.cljs$lang$arity$variadic = G__8024__delegate;
    return G__8024
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
      var temp__3974__auto____8046 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8046) {
        var s__8047 = temp__3974__auto____8046;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8047)) {
          var c__8048 = cljs.core.chunk_first.call(null, s__8047);
          var size__8049 = cljs.core.count.call(null, c__8048);
          var b__8050 = cljs.core.chunk_buffer.call(null, size__8049);
          var n__2555__auto____8051 = size__8049;
          var i__8052 = 0;
          while(true) {
            if(i__8052 < n__2555__auto____8051) {
              cljs.core.chunk_append.call(null, b__8050, f.call(null, cljs.core._nth.call(null, c__8048, i__8052)));
              var G__8064 = i__8052 + 1;
              i__8052 = G__8064;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8050), map.call(null, f, cljs.core.chunk_rest.call(null, s__8047)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8047)), map.call(null, f, cljs.core.rest.call(null, s__8047)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8053 = cljs.core.seq.call(null, c1);
      var s2__8054 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8055 = s1__8053;
        if(and__3822__auto____8055) {
          return s2__8054
        }else {
          return and__3822__auto____8055
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8053), cljs.core.first.call(null, s2__8054)), map.call(null, f, cljs.core.rest.call(null, s1__8053), cljs.core.rest.call(null, s2__8054)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8056 = cljs.core.seq.call(null, c1);
      var s2__8057 = cljs.core.seq.call(null, c2);
      var s3__8058 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8059 = s1__8056;
        if(and__3822__auto____8059) {
          var and__3822__auto____8060 = s2__8057;
          if(and__3822__auto____8060) {
            return s3__8058
          }else {
            return and__3822__auto____8060
          }
        }else {
          return and__3822__auto____8059
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8056), cljs.core.first.call(null, s2__8057), cljs.core.first.call(null, s3__8058)), map.call(null, f, cljs.core.rest.call(null, s1__8056), cljs.core.rest.call(null, s2__8057), cljs.core.rest.call(null, s3__8058)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8065__delegate = function(f, c1, c2, c3, colls) {
      var step__8063 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8062 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8062)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8062), step.call(null, map.call(null, cljs.core.rest, ss__8062)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7867_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7867_SHARP_)
      }, step__8063.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8065 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8065__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8065.cljs$lang$maxFixedArity = 4;
    G__8065.cljs$lang$applyTo = function(arglist__8066) {
      var f = cljs.core.first(arglist__8066);
      var c1 = cljs.core.first(cljs.core.next(arglist__8066));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8066)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8066))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8066))));
      return G__8065__delegate(f, c1, c2, c3, colls)
    };
    G__8065.cljs$lang$arity$variadic = G__8065__delegate;
    return G__8065
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
      var temp__3974__auto____8069 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8069) {
        var s__8070 = temp__3974__auto____8069;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8070), take.call(null, n - 1, cljs.core.rest.call(null, s__8070)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8076 = function(n, coll) {
    while(true) {
      var s__8074 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8075 = n > 0;
        if(and__3822__auto____8075) {
          return s__8074
        }else {
          return and__3822__auto____8075
        }
      }())) {
        var G__8077 = n - 1;
        var G__8078 = cljs.core.rest.call(null, s__8074);
        n = G__8077;
        coll = G__8078;
        continue
      }else {
        return s__8074
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8076.call(null, n, coll)
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
  var s__8081 = cljs.core.seq.call(null, coll);
  var lead__8082 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8082) {
      var G__8083 = cljs.core.next.call(null, s__8081);
      var G__8084 = cljs.core.next.call(null, lead__8082);
      s__8081 = G__8083;
      lead__8082 = G__8084;
      continue
    }else {
      return s__8081
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8090 = function(pred, coll) {
    while(true) {
      var s__8088 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8089 = s__8088;
        if(and__3822__auto____8089) {
          return pred.call(null, cljs.core.first.call(null, s__8088))
        }else {
          return and__3822__auto____8089
        }
      }())) {
        var G__8091 = pred;
        var G__8092 = cljs.core.rest.call(null, s__8088);
        pred = G__8091;
        coll = G__8092;
        continue
      }else {
        return s__8088
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8090.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8095 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8095) {
      var s__8096 = temp__3974__auto____8095;
      return cljs.core.concat.call(null, s__8096, cycle.call(null, s__8096))
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
      var s1__8101 = cljs.core.seq.call(null, c1);
      var s2__8102 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8103 = s1__8101;
        if(and__3822__auto____8103) {
          return s2__8102
        }else {
          return and__3822__auto____8103
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8101), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8102), interleave.call(null, cljs.core.rest.call(null, s1__8101), cljs.core.rest.call(null, s2__8102))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8105__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8104 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8104)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8104), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8104)))
        }else {
          return null
        }
      }, null)
    };
    var G__8105 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8105__delegate.call(this, c1, c2, colls)
    };
    G__8105.cljs$lang$maxFixedArity = 2;
    G__8105.cljs$lang$applyTo = function(arglist__8106) {
      var c1 = cljs.core.first(arglist__8106);
      var c2 = cljs.core.first(cljs.core.next(arglist__8106));
      var colls = cljs.core.rest(cljs.core.next(arglist__8106));
      return G__8105__delegate(c1, c2, colls)
    };
    G__8105.cljs$lang$arity$variadic = G__8105__delegate;
    return G__8105
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
  var cat__8116 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8114 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8114) {
        var coll__8115 = temp__3971__auto____8114;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8115), cat.call(null, cljs.core.rest.call(null, coll__8115), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8116.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8117__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8117 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8117__delegate.call(this, f, coll, colls)
    };
    G__8117.cljs$lang$maxFixedArity = 2;
    G__8117.cljs$lang$applyTo = function(arglist__8118) {
      var f = cljs.core.first(arglist__8118);
      var coll = cljs.core.first(cljs.core.next(arglist__8118));
      var colls = cljs.core.rest(cljs.core.next(arglist__8118));
      return G__8117__delegate(f, coll, colls)
    };
    G__8117.cljs$lang$arity$variadic = G__8117__delegate;
    return G__8117
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
    var temp__3974__auto____8128 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8128) {
      var s__8129 = temp__3974__auto____8128;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8129)) {
        var c__8130 = cljs.core.chunk_first.call(null, s__8129);
        var size__8131 = cljs.core.count.call(null, c__8130);
        var b__8132 = cljs.core.chunk_buffer.call(null, size__8131);
        var n__2555__auto____8133 = size__8131;
        var i__8134 = 0;
        while(true) {
          if(i__8134 < n__2555__auto____8133) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8130, i__8134)))) {
              cljs.core.chunk_append.call(null, b__8132, cljs.core._nth.call(null, c__8130, i__8134))
            }else {
            }
            var G__8137 = i__8134 + 1;
            i__8134 = G__8137;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8132), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8129)))
      }else {
        var f__8135 = cljs.core.first.call(null, s__8129);
        var r__8136 = cljs.core.rest.call(null, s__8129);
        if(cljs.core.truth_(pred.call(null, f__8135))) {
          return cljs.core.cons.call(null, f__8135, filter.call(null, pred, r__8136))
        }else {
          return filter.call(null, pred, r__8136)
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
  var walk__8140 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8140.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8138_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8138_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8144__8145 = to;
    if(G__8144__8145) {
      if(function() {
        var or__3824__auto____8146 = G__8144__8145.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8146) {
          return or__3824__auto____8146
        }else {
          return G__8144__8145.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8144__8145.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8144__8145)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8144__8145)
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
    var G__8147__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8147 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8147__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8147.cljs$lang$maxFixedArity = 4;
    G__8147.cljs$lang$applyTo = function(arglist__8148) {
      var f = cljs.core.first(arglist__8148);
      var c1 = cljs.core.first(cljs.core.next(arglist__8148));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8148)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8148))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8148))));
      return G__8147__delegate(f, c1, c2, c3, colls)
    };
    G__8147.cljs$lang$arity$variadic = G__8147__delegate;
    return G__8147
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
      var temp__3974__auto____8155 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8155) {
        var s__8156 = temp__3974__auto____8155;
        var p__8157 = cljs.core.take.call(null, n, s__8156);
        if(n === cljs.core.count.call(null, p__8157)) {
          return cljs.core.cons.call(null, p__8157, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8156)))
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
      var temp__3974__auto____8158 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8158) {
        var s__8159 = temp__3974__auto____8158;
        var p__8160 = cljs.core.take.call(null, n, s__8159);
        if(n === cljs.core.count.call(null, p__8160)) {
          return cljs.core.cons.call(null, p__8160, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8159)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8160, pad)))
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
    var sentinel__8165 = cljs.core.lookup_sentinel;
    var m__8166 = m;
    var ks__8167 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8167) {
        var m__8168 = cljs.core._lookup.call(null, m__8166, cljs.core.first.call(null, ks__8167), sentinel__8165);
        if(sentinel__8165 === m__8168) {
          return not_found
        }else {
          var G__8169 = sentinel__8165;
          var G__8170 = m__8168;
          var G__8171 = cljs.core.next.call(null, ks__8167);
          sentinel__8165 = G__8169;
          m__8166 = G__8170;
          ks__8167 = G__8171;
          continue
        }
      }else {
        return m__8166
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
cljs.core.assoc_in = function assoc_in(m, p__8172, v) {
  var vec__8177__8178 = p__8172;
  var k__8179 = cljs.core.nth.call(null, vec__8177__8178, 0, null);
  var ks__8180 = cljs.core.nthnext.call(null, vec__8177__8178, 1);
  if(cljs.core.truth_(ks__8180)) {
    return cljs.core.assoc.call(null, m, k__8179, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8179, null), ks__8180, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8179, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8181, f, args) {
    var vec__8186__8187 = p__8181;
    var k__8188 = cljs.core.nth.call(null, vec__8186__8187, 0, null);
    var ks__8189 = cljs.core.nthnext.call(null, vec__8186__8187, 1);
    if(cljs.core.truth_(ks__8189)) {
      return cljs.core.assoc.call(null, m, k__8188, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8188, null), ks__8189, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8188, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8188, null), args))
    }
  };
  var update_in = function(m, p__8181, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8181, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8190) {
    var m = cljs.core.first(arglist__8190);
    var p__8181 = cljs.core.first(cljs.core.next(arglist__8190));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8190)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8190)));
    return update_in__delegate(m, p__8181, f, args)
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
  var this__8193 = this;
  var h__2220__auto____8194 = this__8193.__hash;
  if(!(h__2220__auto____8194 == null)) {
    return h__2220__auto____8194
  }else {
    var h__2220__auto____8195 = cljs.core.hash_coll.call(null, coll);
    this__8193.__hash = h__2220__auto____8195;
    return h__2220__auto____8195
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8196 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8197 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8198 = this;
  var new_array__8199 = this__8198.array.slice();
  new_array__8199[k] = v;
  return new cljs.core.Vector(this__8198.meta, new_array__8199, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8230 = null;
  var G__8230__2 = function(this_sym8200, k) {
    var this__8202 = this;
    var this_sym8200__8203 = this;
    var coll__8204 = this_sym8200__8203;
    return coll__8204.cljs$core$ILookup$_lookup$arity$2(coll__8204, k)
  };
  var G__8230__3 = function(this_sym8201, k, not_found) {
    var this__8202 = this;
    var this_sym8201__8205 = this;
    var coll__8206 = this_sym8201__8205;
    return coll__8206.cljs$core$ILookup$_lookup$arity$3(coll__8206, k, not_found)
  };
  G__8230 = function(this_sym8201, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8230__2.call(this, this_sym8201, k);
      case 3:
        return G__8230__3.call(this, this_sym8201, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8230
}();
cljs.core.Vector.prototype.apply = function(this_sym8191, args8192) {
  var this__8207 = this;
  return this_sym8191.call.apply(this_sym8191, [this_sym8191].concat(args8192.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8208 = this;
  var new_array__8209 = this__8208.array.slice();
  new_array__8209.push(o);
  return new cljs.core.Vector(this__8208.meta, new_array__8209, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8210 = this;
  var this__8211 = this;
  return cljs.core.pr_str.call(null, this__8211)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8212 = this;
  return cljs.core.ci_reduce.call(null, this__8212.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8213 = this;
  return cljs.core.ci_reduce.call(null, this__8213.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8214 = this;
  if(this__8214.array.length > 0) {
    var vector_seq__8215 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8214.array.length) {
          return cljs.core.cons.call(null, this__8214.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8215.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8216 = this;
  return this__8216.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8217 = this;
  var count__8218 = this__8217.array.length;
  if(count__8218 > 0) {
    return this__8217.array[count__8218 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8219 = this;
  if(this__8219.array.length > 0) {
    var new_array__8220 = this__8219.array.slice();
    new_array__8220.pop();
    return new cljs.core.Vector(this__8219.meta, new_array__8220, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8221 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8222 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8223 = this;
  return new cljs.core.Vector(meta, this__8223.array, this__8223.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8224 = this;
  return this__8224.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8225 = this;
  if(function() {
    var and__3822__auto____8226 = 0 <= n;
    if(and__3822__auto____8226) {
      return n < this__8225.array.length
    }else {
      return and__3822__auto____8226
    }
  }()) {
    return this__8225.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8227 = this;
  if(function() {
    var and__3822__auto____8228 = 0 <= n;
    if(and__3822__auto____8228) {
      return n < this__8227.array.length
    }else {
      return and__3822__auto____8228
    }
  }()) {
    return this__8227.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8229 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8229.meta)
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
  var cnt__8232 = pv.cnt;
  if(cnt__8232 < 32) {
    return 0
  }else {
    return cnt__8232 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8238 = level;
  var ret__8239 = node;
  while(true) {
    if(ll__8238 === 0) {
      return ret__8239
    }else {
      var embed__8240 = ret__8239;
      var r__8241 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8242 = cljs.core.pv_aset.call(null, r__8241, 0, embed__8240);
      var G__8243 = ll__8238 - 5;
      var G__8244 = r__8241;
      ll__8238 = G__8243;
      ret__8239 = G__8244;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8250 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8251 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8250, subidx__8251, tailnode);
    return ret__8250
  }else {
    var child__8252 = cljs.core.pv_aget.call(null, parent, subidx__8251);
    if(!(child__8252 == null)) {
      var node_to_insert__8253 = push_tail.call(null, pv, level - 5, child__8252, tailnode);
      cljs.core.pv_aset.call(null, ret__8250, subidx__8251, node_to_insert__8253);
      return ret__8250
    }else {
      var node_to_insert__8254 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8250, subidx__8251, node_to_insert__8254);
      return ret__8250
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8258 = 0 <= i;
    if(and__3822__auto____8258) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8258
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8259 = pv.root;
      var level__8260 = pv.shift;
      while(true) {
        if(level__8260 > 0) {
          var G__8261 = cljs.core.pv_aget.call(null, node__8259, i >>> level__8260 & 31);
          var G__8262 = level__8260 - 5;
          node__8259 = G__8261;
          level__8260 = G__8262;
          continue
        }else {
          return node__8259.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8265 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8265, i & 31, val);
    return ret__8265
  }else {
    var subidx__8266 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8265, subidx__8266, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8266), i, val));
    return ret__8265
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8272 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8273 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8272));
    if(function() {
      var and__3822__auto____8274 = new_child__8273 == null;
      if(and__3822__auto____8274) {
        return subidx__8272 === 0
      }else {
        return and__3822__auto____8274
      }
    }()) {
      return null
    }else {
      var ret__8275 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8275, subidx__8272, new_child__8273);
      return ret__8275
    }
  }else {
    if(subidx__8272 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8276 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8276, subidx__8272, null);
        return ret__8276
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
  var this__8279 = this;
  return new cljs.core.TransientVector(this__8279.cnt, this__8279.shift, cljs.core.tv_editable_root.call(null, this__8279.root), cljs.core.tv_editable_tail.call(null, this__8279.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8280 = this;
  var h__2220__auto____8281 = this__8280.__hash;
  if(!(h__2220__auto____8281 == null)) {
    return h__2220__auto____8281
  }else {
    var h__2220__auto____8282 = cljs.core.hash_coll.call(null, coll);
    this__8280.__hash = h__2220__auto____8282;
    return h__2220__auto____8282
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8283 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8284 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8285 = this;
  if(function() {
    var and__3822__auto____8286 = 0 <= k;
    if(and__3822__auto____8286) {
      return k < this__8285.cnt
    }else {
      return and__3822__auto____8286
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8287 = this__8285.tail.slice();
      new_tail__8287[k & 31] = v;
      return new cljs.core.PersistentVector(this__8285.meta, this__8285.cnt, this__8285.shift, this__8285.root, new_tail__8287, null)
    }else {
      return new cljs.core.PersistentVector(this__8285.meta, this__8285.cnt, this__8285.shift, cljs.core.do_assoc.call(null, coll, this__8285.shift, this__8285.root, k, v), this__8285.tail, null)
    }
  }else {
    if(k === this__8285.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8285.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8335 = null;
  var G__8335__2 = function(this_sym8288, k) {
    var this__8290 = this;
    var this_sym8288__8291 = this;
    var coll__8292 = this_sym8288__8291;
    return coll__8292.cljs$core$ILookup$_lookup$arity$2(coll__8292, k)
  };
  var G__8335__3 = function(this_sym8289, k, not_found) {
    var this__8290 = this;
    var this_sym8289__8293 = this;
    var coll__8294 = this_sym8289__8293;
    return coll__8294.cljs$core$ILookup$_lookup$arity$3(coll__8294, k, not_found)
  };
  G__8335 = function(this_sym8289, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8335__2.call(this, this_sym8289, k);
      case 3:
        return G__8335__3.call(this, this_sym8289, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8335
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8277, args8278) {
  var this__8295 = this;
  return this_sym8277.call.apply(this_sym8277, [this_sym8277].concat(args8278.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8296 = this;
  var step_init__8297 = [0, init];
  var i__8298 = 0;
  while(true) {
    if(i__8298 < this__8296.cnt) {
      var arr__8299 = cljs.core.array_for.call(null, v, i__8298);
      var len__8300 = arr__8299.length;
      var init__8304 = function() {
        var j__8301 = 0;
        var init__8302 = step_init__8297[1];
        while(true) {
          if(j__8301 < len__8300) {
            var init__8303 = f.call(null, init__8302, j__8301 + i__8298, arr__8299[j__8301]);
            if(cljs.core.reduced_QMARK_.call(null, init__8303)) {
              return init__8303
            }else {
              var G__8336 = j__8301 + 1;
              var G__8337 = init__8303;
              j__8301 = G__8336;
              init__8302 = G__8337;
              continue
            }
          }else {
            step_init__8297[0] = len__8300;
            step_init__8297[1] = init__8302;
            return init__8302
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8304)) {
        return cljs.core.deref.call(null, init__8304)
      }else {
        var G__8338 = i__8298 + step_init__8297[0];
        i__8298 = G__8338;
        continue
      }
    }else {
      return step_init__8297[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8305 = this;
  if(this__8305.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8306 = this__8305.tail.slice();
    new_tail__8306.push(o);
    return new cljs.core.PersistentVector(this__8305.meta, this__8305.cnt + 1, this__8305.shift, this__8305.root, new_tail__8306, null)
  }else {
    var root_overflow_QMARK___8307 = this__8305.cnt >>> 5 > 1 << this__8305.shift;
    var new_shift__8308 = root_overflow_QMARK___8307 ? this__8305.shift + 5 : this__8305.shift;
    var new_root__8310 = root_overflow_QMARK___8307 ? function() {
      var n_r__8309 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8309, 0, this__8305.root);
      cljs.core.pv_aset.call(null, n_r__8309, 1, cljs.core.new_path.call(null, null, this__8305.shift, new cljs.core.VectorNode(null, this__8305.tail)));
      return n_r__8309
    }() : cljs.core.push_tail.call(null, coll, this__8305.shift, this__8305.root, new cljs.core.VectorNode(null, this__8305.tail));
    return new cljs.core.PersistentVector(this__8305.meta, this__8305.cnt + 1, new_shift__8308, new_root__8310, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8311 = this;
  if(this__8311.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8311.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8312 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8313 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8314 = this;
  var this__8315 = this;
  return cljs.core.pr_str.call(null, this__8315)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8316 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8317 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8318 = this;
  if(this__8318.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8319 = this;
  return this__8319.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8320 = this;
  if(this__8320.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8320.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8321 = this;
  if(this__8321.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8321.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8321.meta)
    }else {
      if(1 < this__8321.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8321.meta, this__8321.cnt - 1, this__8321.shift, this__8321.root, this__8321.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8322 = cljs.core.array_for.call(null, coll, this__8321.cnt - 2);
          var nr__8323 = cljs.core.pop_tail.call(null, coll, this__8321.shift, this__8321.root);
          var new_root__8324 = nr__8323 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8323;
          var cnt_1__8325 = this__8321.cnt - 1;
          if(function() {
            var and__3822__auto____8326 = 5 < this__8321.shift;
            if(and__3822__auto____8326) {
              return cljs.core.pv_aget.call(null, new_root__8324, 1) == null
            }else {
              return and__3822__auto____8326
            }
          }()) {
            return new cljs.core.PersistentVector(this__8321.meta, cnt_1__8325, this__8321.shift - 5, cljs.core.pv_aget.call(null, new_root__8324, 0), new_tail__8322, null)
          }else {
            return new cljs.core.PersistentVector(this__8321.meta, cnt_1__8325, this__8321.shift, new_root__8324, new_tail__8322, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8327 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8328 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8329 = this;
  return new cljs.core.PersistentVector(meta, this__8329.cnt, this__8329.shift, this__8329.root, this__8329.tail, this__8329.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8330 = this;
  return this__8330.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8331 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8332 = this;
  if(function() {
    var and__3822__auto____8333 = 0 <= n;
    if(and__3822__auto____8333) {
      return n < this__8332.cnt
    }else {
      return and__3822__auto____8333
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8334 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8334.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8339 = xs.length;
  var xs__8340 = no_clone === true ? xs : xs.slice();
  if(l__8339 < 32) {
    return new cljs.core.PersistentVector(null, l__8339, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8340, null)
  }else {
    var node__8341 = xs__8340.slice(0, 32);
    var v__8342 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8341, null);
    var i__8343 = 32;
    var out__8344 = cljs.core._as_transient.call(null, v__8342);
    while(true) {
      if(i__8343 < l__8339) {
        var G__8345 = i__8343 + 1;
        var G__8346 = cljs.core.conj_BANG_.call(null, out__8344, xs__8340[i__8343]);
        i__8343 = G__8345;
        out__8344 = G__8346;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8344)
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
  vector.cljs$lang$applyTo = function(arglist__8347) {
    var args = cljs.core.seq(arglist__8347);
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
  var this__8348 = this;
  if(this__8348.off + 1 < this__8348.node.length) {
    var s__8349 = cljs.core.chunked_seq.call(null, this__8348.vec, this__8348.node, this__8348.i, this__8348.off + 1);
    if(s__8349 == null) {
      return null
    }else {
      return s__8349
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8350 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8351 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8352 = this;
  return this__8352.node[this__8352.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8353 = this;
  if(this__8353.off + 1 < this__8353.node.length) {
    var s__8354 = cljs.core.chunked_seq.call(null, this__8353.vec, this__8353.node, this__8353.i, this__8353.off + 1);
    if(s__8354 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8354
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8355 = this;
  var l__8356 = this__8355.node.length;
  var s__8357 = this__8355.i + l__8356 < cljs.core._count.call(null, this__8355.vec) ? cljs.core.chunked_seq.call(null, this__8355.vec, this__8355.i + l__8356, 0) : null;
  if(s__8357 == null) {
    return null
  }else {
    return s__8357
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8358 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8359 = this;
  return cljs.core.chunked_seq.call(null, this__8359.vec, this__8359.node, this__8359.i, this__8359.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8360 = this;
  return this__8360.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8361 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8361.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8362 = this;
  return cljs.core.array_chunk.call(null, this__8362.node, this__8362.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8363 = this;
  var l__8364 = this__8363.node.length;
  var s__8365 = this__8363.i + l__8364 < cljs.core._count.call(null, this__8363.vec) ? cljs.core.chunked_seq.call(null, this__8363.vec, this__8363.i + l__8364, 0) : null;
  if(s__8365 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8365
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
  var this__8368 = this;
  var h__2220__auto____8369 = this__8368.__hash;
  if(!(h__2220__auto____8369 == null)) {
    return h__2220__auto____8369
  }else {
    var h__2220__auto____8370 = cljs.core.hash_coll.call(null, coll);
    this__8368.__hash = h__2220__auto____8370;
    return h__2220__auto____8370
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8371 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8372 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8373 = this;
  var v_pos__8374 = this__8373.start + key;
  return new cljs.core.Subvec(this__8373.meta, cljs.core._assoc.call(null, this__8373.v, v_pos__8374, val), this__8373.start, this__8373.end > v_pos__8374 + 1 ? this__8373.end : v_pos__8374 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8400 = null;
  var G__8400__2 = function(this_sym8375, k) {
    var this__8377 = this;
    var this_sym8375__8378 = this;
    var coll__8379 = this_sym8375__8378;
    return coll__8379.cljs$core$ILookup$_lookup$arity$2(coll__8379, k)
  };
  var G__8400__3 = function(this_sym8376, k, not_found) {
    var this__8377 = this;
    var this_sym8376__8380 = this;
    var coll__8381 = this_sym8376__8380;
    return coll__8381.cljs$core$ILookup$_lookup$arity$3(coll__8381, k, not_found)
  };
  G__8400 = function(this_sym8376, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8400__2.call(this, this_sym8376, k);
      case 3:
        return G__8400__3.call(this, this_sym8376, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8400
}();
cljs.core.Subvec.prototype.apply = function(this_sym8366, args8367) {
  var this__8382 = this;
  return this_sym8366.call.apply(this_sym8366, [this_sym8366].concat(args8367.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8383 = this;
  return new cljs.core.Subvec(this__8383.meta, cljs.core._assoc_n.call(null, this__8383.v, this__8383.end, o), this__8383.start, this__8383.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8384 = this;
  var this__8385 = this;
  return cljs.core.pr_str.call(null, this__8385)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8386 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8387 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8388 = this;
  var subvec_seq__8389 = function subvec_seq(i) {
    if(i === this__8388.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8388.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8389.call(null, this__8388.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8390 = this;
  return this__8390.end - this__8390.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8391 = this;
  return cljs.core._nth.call(null, this__8391.v, this__8391.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8392 = this;
  if(this__8392.start === this__8392.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8392.meta, this__8392.v, this__8392.start, this__8392.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8393 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8394 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8395 = this;
  return new cljs.core.Subvec(meta, this__8395.v, this__8395.start, this__8395.end, this__8395.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8396 = this;
  return this__8396.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8397 = this;
  return cljs.core._nth.call(null, this__8397.v, this__8397.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8398 = this;
  return cljs.core._nth.call(null, this__8398.v, this__8398.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8399 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8399.meta)
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
  var ret__8402 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8402, 0, tl.length);
  return ret__8402
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8406 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8407 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8406, subidx__8407, level === 5 ? tail_node : function() {
    var child__8408 = cljs.core.pv_aget.call(null, ret__8406, subidx__8407);
    if(!(child__8408 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8408, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8406
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8413 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8414 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8415 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8413, subidx__8414));
    if(function() {
      var and__3822__auto____8416 = new_child__8415 == null;
      if(and__3822__auto____8416) {
        return subidx__8414 === 0
      }else {
        return and__3822__auto____8416
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8413, subidx__8414, new_child__8415);
      return node__8413
    }
  }else {
    if(subidx__8414 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8413, subidx__8414, null);
        return node__8413
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8421 = 0 <= i;
    if(and__3822__auto____8421) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8421
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8422 = tv.root;
      var node__8423 = root__8422;
      var level__8424 = tv.shift;
      while(true) {
        if(level__8424 > 0) {
          var G__8425 = cljs.core.tv_ensure_editable.call(null, root__8422.edit, cljs.core.pv_aget.call(null, node__8423, i >>> level__8424 & 31));
          var G__8426 = level__8424 - 5;
          node__8423 = G__8425;
          level__8424 = G__8426;
          continue
        }else {
          return node__8423.arr
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
  var G__8466 = null;
  var G__8466__2 = function(this_sym8429, k) {
    var this__8431 = this;
    var this_sym8429__8432 = this;
    var coll__8433 = this_sym8429__8432;
    return coll__8433.cljs$core$ILookup$_lookup$arity$2(coll__8433, k)
  };
  var G__8466__3 = function(this_sym8430, k, not_found) {
    var this__8431 = this;
    var this_sym8430__8434 = this;
    var coll__8435 = this_sym8430__8434;
    return coll__8435.cljs$core$ILookup$_lookup$arity$3(coll__8435, k, not_found)
  };
  G__8466 = function(this_sym8430, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8466__2.call(this, this_sym8430, k);
      case 3:
        return G__8466__3.call(this, this_sym8430, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8466
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8427, args8428) {
  var this__8436 = this;
  return this_sym8427.call.apply(this_sym8427, [this_sym8427].concat(args8428.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8437 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8438 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8439 = this;
  if(this__8439.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8440 = this;
  if(function() {
    var and__3822__auto____8441 = 0 <= n;
    if(and__3822__auto____8441) {
      return n < this__8440.cnt
    }else {
      return and__3822__auto____8441
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8442 = this;
  if(this__8442.root.edit) {
    return this__8442.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8443 = this;
  if(this__8443.root.edit) {
    if(function() {
      var and__3822__auto____8444 = 0 <= n;
      if(and__3822__auto____8444) {
        return n < this__8443.cnt
      }else {
        return and__3822__auto____8444
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8443.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8449 = function go(level, node) {
          var node__8447 = cljs.core.tv_ensure_editable.call(null, this__8443.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8447, n & 31, val);
            return node__8447
          }else {
            var subidx__8448 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8447, subidx__8448, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8447, subidx__8448)));
            return node__8447
          }
        }.call(null, this__8443.shift, this__8443.root);
        this__8443.root = new_root__8449;
        return tcoll
      }
    }else {
      if(n === this__8443.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8443.cnt)].join(""));
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
  var this__8450 = this;
  if(this__8450.root.edit) {
    if(this__8450.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8450.cnt) {
        this__8450.cnt = 0;
        return tcoll
      }else {
        if((this__8450.cnt - 1 & 31) > 0) {
          this__8450.cnt = this__8450.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8451 = cljs.core.editable_array_for.call(null, tcoll, this__8450.cnt - 2);
            var new_root__8453 = function() {
              var nr__8452 = cljs.core.tv_pop_tail.call(null, tcoll, this__8450.shift, this__8450.root);
              if(!(nr__8452 == null)) {
                return nr__8452
              }else {
                return new cljs.core.VectorNode(this__8450.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8454 = 5 < this__8450.shift;
              if(and__3822__auto____8454) {
                return cljs.core.pv_aget.call(null, new_root__8453, 1) == null
              }else {
                return and__3822__auto____8454
              }
            }()) {
              var new_root__8455 = cljs.core.tv_ensure_editable.call(null, this__8450.root.edit, cljs.core.pv_aget.call(null, new_root__8453, 0));
              this__8450.root = new_root__8455;
              this__8450.shift = this__8450.shift - 5;
              this__8450.cnt = this__8450.cnt - 1;
              this__8450.tail = new_tail__8451;
              return tcoll
            }else {
              this__8450.root = new_root__8453;
              this__8450.cnt = this__8450.cnt - 1;
              this__8450.tail = new_tail__8451;
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
  var this__8456 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8457 = this;
  if(this__8457.root.edit) {
    if(this__8457.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8457.tail[this__8457.cnt & 31] = o;
      this__8457.cnt = this__8457.cnt + 1;
      return tcoll
    }else {
      var tail_node__8458 = new cljs.core.VectorNode(this__8457.root.edit, this__8457.tail);
      var new_tail__8459 = cljs.core.make_array.call(null, 32);
      new_tail__8459[0] = o;
      this__8457.tail = new_tail__8459;
      if(this__8457.cnt >>> 5 > 1 << this__8457.shift) {
        var new_root_array__8460 = cljs.core.make_array.call(null, 32);
        var new_shift__8461 = this__8457.shift + 5;
        new_root_array__8460[0] = this__8457.root;
        new_root_array__8460[1] = cljs.core.new_path.call(null, this__8457.root.edit, this__8457.shift, tail_node__8458);
        this__8457.root = new cljs.core.VectorNode(this__8457.root.edit, new_root_array__8460);
        this__8457.shift = new_shift__8461;
        this__8457.cnt = this__8457.cnt + 1;
        return tcoll
      }else {
        var new_root__8462 = cljs.core.tv_push_tail.call(null, tcoll, this__8457.shift, this__8457.root, tail_node__8458);
        this__8457.root = new_root__8462;
        this__8457.cnt = this__8457.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8463 = this;
  if(this__8463.root.edit) {
    this__8463.root.edit = null;
    var len__8464 = this__8463.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8465 = cljs.core.make_array.call(null, len__8464);
    cljs.core.array_copy.call(null, this__8463.tail, 0, trimmed_tail__8465, 0, len__8464);
    return new cljs.core.PersistentVector(null, this__8463.cnt, this__8463.shift, this__8463.root, trimmed_tail__8465, null)
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
  var this__8467 = this;
  var h__2220__auto____8468 = this__8467.__hash;
  if(!(h__2220__auto____8468 == null)) {
    return h__2220__auto____8468
  }else {
    var h__2220__auto____8469 = cljs.core.hash_coll.call(null, coll);
    this__8467.__hash = h__2220__auto____8469;
    return h__2220__auto____8469
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8470 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8471 = this;
  var this__8472 = this;
  return cljs.core.pr_str.call(null, this__8472)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8473 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8474 = this;
  return cljs.core._first.call(null, this__8474.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8475 = this;
  var temp__3971__auto____8476 = cljs.core.next.call(null, this__8475.front);
  if(temp__3971__auto____8476) {
    var f1__8477 = temp__3971__auto____8476;
    return new cljs.core.PersistentQueueSeq(this__8475.meta, f1__8477, this__8475.rear, null)
  }else {
    if(this__8475.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8475.meta, this__8475.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8478 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8479 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8479.front, this__8479.rear, this__8479.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8480 = this;
  return this__8480.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8481 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8481.meta)
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
  var this__8482 = this;
  var h__2220__auto____8483 = this__8482.__hash;
  if(!(h__2220__auto____8483 == null)) {
    return h__2220__auto____8483
  }else {
    var h__2220__auto____8484 = cljs.core.hash_coll.call(null, coll);
    this__8482.__hash = h__2220__auto____8484;
    return h__2220__auto____8484
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8485 = this;
  if(cljs.core.truth_(this__8485.front)) {
    return new cljs.core.PersistentQueue(this__8485.meta, this__8485.count + 1, this__8485.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8486 = this__8485.rear;
      if(cljs.core.truth_(or__3824__auto____8486)) {
        return or__3824__auto____8486
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8485.meta, this__8485.count + 1, cljs.core.conj.call(null, this__8485.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8487 = this;
  var this__8488 = this;
  return cljs.core.pr_str.call(null, this__8488)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8489 = this;
  var rear__8490 = cljs.core.seq.call(null, this__8489.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8491 = this__8489.front;
    if(cljs.core.truth_(or__3824__auto____8491)) {
      return or__3824__auto____8491
    }else {
      return rear__8490
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8489.front, cljs.core.seq.call(null, rear__8490), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8492 = this;
  return this__8492.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8493 = this;
  return cljs.core._first.call(null, this__8493.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8494 = this;
  if(cljs.core.truth_(this__8494.front)) {
    var temp__3971__auto____8495 = cljs.core.next.call(null, this__8494.front);
    if(temp__3971__auto____8495) {
      var f1__8496 = temp__3971__auto____8495;
      return new cljs.core.PersistentQueue(this__8494.meta, this__8494.count - 1, f1__8496, this__8494.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8494.meta, this__8494.count - 1, cljs.core.seq.call(null, this__8494.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8497 = this;
  return cljs.core.first.call(null, this__8497.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8498 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8499 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8500 = this;
  return new cljs.core.PersistentQueue(meta, this__8500.count, this__8500.front, this__8500.rear, this__8500.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8501 = this;
  return this__8501.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8502 = this;
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
  var this__8503 = this;
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
  var len__8506 = array.length;
  var i__8507 = 0;
  while(true) {
    if(i__8507 < len__8506) {
      if(k === array[i__8507]) {
        return i__8507
      }else {
        var G__8508 = i__8507 + incr;
        i__8507 = G__8508;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8511 = cljs.core.hash.call(null, a);
  var b__8512 = cljs.core.hash.call(null, b);
  if(a__8511 < b__8512) {
    return-1
  }else {
    if(a__8511 > b__8512) {
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
  var ks__8520 = m.keys;
  var len__8521 = ks__8520.length;
  var so__8522 = m.strobj;
  var out__8523 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8524 = 0;
  var out__8525 = cljs.core.transient$.call(null, out__8523);
  while(true) {
    if(i__8524 < len__8521) {
      var k__8526 = ks__8520[i__8524];
      var G__8527 = i__8524 + 1;
      var G__8528 = cljs.core.assoc_BANG_.call(null, out__8525, k__8526, so__8522[k__8526]);
      i__8524 = G__8527;
      out__8525 = G__8528;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8525, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8534 = {};
  var l__8535 = ks.length;
  var i__8536 = 0;
  while(true) {
    if(i__8536 < l__8535) {
      var k__8537 = ks[i__8536];
      new_obj__8534[k__8537] = obj[k__8537];
      var G__8538 = i__8536 + 1;
      i__8536 = G__8538;
      continue
    }else {
    }
    break
  }
  return new_obj__8534
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
  var this__8541 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8542 = this;
  var h__2220__auto____8543 = this__8542.__hash;
  if(!(h__2220__auto____8543 == null)) {
    return h__2220__auto____8543
  }else {
    var h__2220__auto____8544 = cljs.core.hash_imap.call(null, coll);
    this__8542.__hash = h__2220__auto____8544;
    return h__2220__auto____8544
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8545 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8546 = this;
  if(function() {
    var and__3822__auto____8547 = goog.isString(k);
    if(and__3822__auto____8547) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8546.keys) == null)
    }else {
      return and__3822__auto____8547
    }
  }()) {
    return this__8546.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8548 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8549 = this__8548.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8549) {
        return or__3824__auto____8549
      }else {
        return this__8548.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8548.keys) == null)) {
        var new_strobj__8550 = cljs.core.obj_clone.call(null, this__8548.strobj, this__8548.keys);
        new_strobj__8550[k] = v;
        return new cljs.core.ObjMap(this__8548.meta, this__8548.keys, new_strobj__8550, this__8548.update_count + 1, null)
      }else {
        var new_strobj__8551 = cljs.core.obj_clone.call(null, this__8548.strobj, this__8548.keys);
        var new_keys__8552 = this__8548.keys.slice();
        new_strobj__8551[k] = v;
        new_keys__8552.push(k);
        return new cljs.core.ObjMap(this__8548.meta, new_keys__8552, new_strobj__8551, this__8548.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8553 = this;
  if(function() {
    var and__3822__auto____8554 = goog.isString(k);
    if(and__3822__auto____8554) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8553.keys) == null)
    }else {
      return and__3822__auto____8554
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8576 = null;
  var G__8576__2 = function(this_sym8555, k) {
    var this__8557 = this;
    var this_sym8555__8558 = this;
    var coll__8559 = this_sym8555__8558;
    return coll__8559.cljs$core$ILookup$_lookup$arity$2(coll__8559, k)
  };
  var G__8576__3 = function(this_sym8556, k, not_found) {
    var this__8557 = this;
    var this_sym8556__8560 = this;
    var coll__8561 = this_sym8556__8560;
    return coll__8561.cljs$core$ILookup$_lookup$arity$3(coll__8561, k, not_found)
  };
  G__8576 = function(this_sym8556, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8576__2.call(this, this_sym8556, k);
      case 3:
        return G__8576__3.call(this, this_sym8556, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8576
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8539, args8540) {
  var this__8562 = this;
  return this_sym8539.call.apply(this_sym8539, [this_sym8539].concat(args8540.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8563 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8564 = this;
  var this__8565 = this;
  return cljs.core.pr_str.call(null, this__8565)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8566 = this;
  if(this__8566.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8529_SHARP_) {
      return cljs.core.vector.call(null, p1__8529_SHARP_, this__8566.strobj[p1__8529_SHARP_])
    }, this__8566.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8567 = this;
  return this__8567.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8568 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8569 = this;
  return new cljs.core.ObjMap(meta, this__8569.keys, this__8569.strobj, this__8569.update_count, this__8569.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8570 = this;
  return this__8570.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8571 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8571.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8572 = this;
  if(function() {
    var and__3822__auto____8573 = goog.isString(k);
    if(and__3822__auto____8573) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8572.keys) == null)
    }else {
      return and__3822__auto____8573
    }
  }()) {
    var new_keys__8574 = this__8572.keys.slice();
    var new_strobj__8575 = cljs.core.obj_clone.call(null, this__8572.strobj, this__8572.keys);
    new_keys__8574.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8574), 1);
    cljs.core.js_delete.call(null, new_strobj__8575, k);
    return new cljs.core.ObjMap(this__8572.meta, new_keys__8574, new_strobj__8575, this__8572.update_count + 1, null)
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
  var this__8580 = this;
  var h__2220__auto____8581 = this__8580.__hash;
  if(!(h__2220__auto____8581 == null)) {
    return h__2220__auto____8581
  }else {
    var h__2220__auto____8582 = cljs.core.hash_imap.call(null, coll);
    this__8580.__hash = h__2220__auto____8582;
    return h__2220__auto____8582
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8583 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8584 = this;
  var bucket__8585 = this__8584.hashobj[cljs.core.hash.call(null, k)];
  var i__8586 = cljs.core.truth_(bucket__8585) ? cljs.core.scan_array.call(null, 2, k, bucket__8585) : null;
  if(cljs.core.truth_(i__8586)) {
    return bucket__8585[i__8586 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8587 = this;
  var h__8588 = cljs.core.hash.call(null, k);
  var bucket__8589 = this__8587.hashobj[h__8588];
  if(cljs.core.truth_(bucket__8589)) {
    var new_bucket__8590 = bucket__8589.slice();
    var new_hashobj__8591 = goog.object.clone(this__8587.hashobj);
    new_hashobj__8591[h__8588] = new_bucket__8590;
    var temp__3971__auto____8592 = cljs.core.scan_array.call(null, 2, k, new_bucket__8590);
    if(cljs.core.truth_(temp__3971__auto____8592)) {
      var i__8593 = temp__3971__auto____8592;
      new_bucket__8590[i__8593 + 1] = v;
      return new cljs.core.HashMap(this__8587.meta, this__8587.count, new_hashobj__8591, null)
    }else {
      new_bucket__8590.push(k, v);
      return new cljs.core.HashMap(this__8587.meta, this__8587.count + 1, new_hashobj__8591, null)
    }
  }else {
    var new_hashobj__8594 = goog.object.clone(this__8587.hashobj);
    new_hashobj__8594[h__8588] = [k, v];
    return new cljs.core.HashMap(this__8587.meta, this__8587.count + 1, new_hashobj__8594, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8595 = this;
  var bucket__8596 = this__8595.hashobj[cljs.core.hash.call(null, k)];
  var i__8597 = cljs.core.truth_(bucket__8596) ? cljs.core.scan_array.call(null, 2, k, bucket__8596) : null;
  if(cljs.core.truth_(i__8597)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8622 = null;
  var G__8622__2 = function(this_sym8598, k) {
    var this__8600 = this;
    var this_sym8598__8601 = this;
    var coll__8602 = this_sym8598__8601;
    return coll__8602.cljs$core$ILookup$_lookup$arity$2(coll__8602, k)
  };
  var G__8622__3 = function(this_sym8599, k, not_found) {
    var this__8600 = this;
    var this_sym8599__8603 = this;
    var coll__8604 = this_sym8599__8603;
    return coll__8604.cljs$core$ILookup$_lookup$arity$3(coll__8604, k, not_found)
  };
  G__8622 = function(this_sym8599, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8622__2.call(this, this_sym8599, k);
      case 3:
        return G__8622__3.call(this, this_sym8599, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8622
}();
cljs.core.HashMap.prototype.apply = function(this_sym8578, args8579) {
  var this__8605 = this;
  return this_sym8578.call.apply(this_sym8578, [this_sym8578].concat(args8579.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8606 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8607 = this;
  var this__8608 = this;
  return cljs.core.pr_str.call(null, this__8608)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8609 = this;
  if(this__8609.count > 0) {
    var hashes__8610 = cljs.core.js_keys.call(null, this__8609.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8577_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8609.hashobj[p1__8577_SHARP_]))
    }, hashes__8610)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8611 = this;
  return this__8611.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8612 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8613 = this;
  return new cljs.core.HashMap(meta, this__8613.count, this__8613.hashobj, this__8613.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8614 = this;
  return this__8614.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8615 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8615.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8616 = this;
  var h__8617 = cljs.core.hash.call(null, k);
  var bucket__8618 = this__8616.hashobj[h__8617];
  var i__8619 = cljs.core.truth_(bucket__8618) ? cljs.core.scan_array.call(null, 2, k, bucket__8618) : null;
  if(cljs.core.not.call(null, i__8619)) {
    return coll
  }else {
    var new_hashobj__8620 = goog.object.clone(this__8616.hashobj);
    if(3 > bucket__8618.length) {
      cljs.core.js_delete.call(null, new_hashobj__8620, h__8617)
    }else {
      var new_bucket__8621 = bucket__8618.slice();
      new_bucket__8621.splice(i__8619, 2);
      new_hashobj__8620[h__8617] = new_bucket__8621
    }
    return new cljs.core.HashMap(this__8616.meta, this__8616.count - 1, new_hashobj__8620, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8623 = ks.length;
  var i__8624 = 0;
  var out__8625 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8624 < len__8623) {
      var G__8626 = i__8624 + 1;
      var G__8627 = cljs.core.assoc.call(null, out__8625, ks[i__8624], vs[i__8624]);
      i__8624 = G__8626;
      out__8625 = G__8627;
      continue
    }else {
      return out__8625
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8631 = m.arr;
  var len__8632 = arr__8631.length;
  var i__8633 = 0;
  while(true) {
    if(len__8632 <= i__8633) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8631[i__8633], k)) {
        return i__8633
      }else {
        if("\ufdd0'else") {
          var G__8634 = i__8633 + 2;
          i__8633 = G__8634;
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
  var this__8637 = this;
  return new cljs.core.TransientArrayMap({}, this__8637.arr.length, this__8637.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8638 = this;
  var h__2220__auto____8639 = this__8638.__hash;
  if(!(h__2220__auto____8639 == null)) {
    return h__2220__auto____8639
  }else {
    var h__2220__auto____8640 = cljs.core.hash_imap.call(null, coll);
    this__8638.__hash = h__2220__auto____8640;
    return h__2220__auto____8640
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8641 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8642 = this;
  var idx__8643 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8643 === -1) {
    return not_found
  }else {
    return this__8642.arr[idx__8643 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8644 = this;
  var idx__8645 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8645 === -1) {
    if(this__8644.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8644.meta, this__8644.cnt + 1, function() {
        var G__8646__8647 = this__8644.arr.slice();
        G__8646__8647.push(k);
        G__8646__8647.push(v);
        return G__8646__8647
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8644.arr[idx__8645 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8644.meta, this__8644.cnt, function() {
          var G__8648__8649 = this__8644.arr.slice();
          G__8648__8649[idx__8645 + 1] = v;
          return G__8648__8649
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8650 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8682 = null;
  var G__8682__2 = function(this_sym8651, k) {
    var this__8653 = this;
    var this_sym8651__8654 = this;
    var coll__8655 = this_sym8651__8654;
    return coll__8655.cljs$core$ILookup$_lookup$arity$2(coll__8655, k)
  };
  var G__8682__3 = function(this_sym8652, k, not_found) {
    var this__8653 = this;
    var this_sym8652__8656 = this;
    var coll__8657 = this_sym8652__8656;
    return coll__8657.cljs$core$ILookup$_lookup$arity$3(coll__8657, k, not_found)
  };
  G__8682 = function(this_sym8652, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8682__2.call(this, this_sym8652, k);
      case 3:
        return G__8682__3.call(this, this_sym8652, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8682
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8635, args8636) {
  var this__8658 = this;
  return this_sym8635.call.apply(this_sym8635, [this_sym8635].concat(args8636.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8659 = this;
  var len__8660 = this__8659.arr.length;
  var i__8661 = 0;
  var init__8662 = init;
  while(true) {
    if(i__8661 < len__8660) {
      var init__8663 = f.call(null, init__8662, this__8659.arr[i__8661], this__8659.arr[i__8661 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8663)) {
        return cljs.core.deref.call(null, init__8663)
      }else {
        var G__8683 = i__8661 + 2;
        var G__8684 = init__8663;
        i__8661 = G__8683;
        init__8662 = G__8684;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8664 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8665 = this;
  var this__8666 = this;
  return cljs.core.pr_str.call(null, this__8666)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8667 = this;
  if(this__8667.cnt > 0) {
    var len__8668 = this__8667.arr.length;
    var array_map_seq__8669 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8668) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8667.arr[i], this__8667.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8669.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8670 = this;
  return this__8670.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8671 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8672 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8672.cnt, this__8672.arr, this__8672.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8673 = this;
  return this__8673.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8674 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8674.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8675 = this;
  var idx__8676 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8676 >= 0) {
    var len__8677 = this__8675.arr.length;
    var new_len__8678 = len__8677 - 2;
    if(new_len__8678 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8679 = cljs.core.make_array.call(null, new_len__8678);
      var s__8680 = 0;
      var d__8681 = 0;
      while(true) {
        if(s__8680 >= len__8677) {
          return new cljs.core.PersistentArrayMap(this__8675.meta, this__8675.cnt - 1, new_arr__8679, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8675.arr[s__8680])) {
            var G__8685 = s__8680 + 2;
            var G__8686 = d__8681;
            s__8680 = G__8685;
            d__8681 = G__8686;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8679[d__8681] = this__8675.arr[s__8680];
              new_arr__8679[d__8681 + 1] = this__8675.arr[s__8680 + 1];
              var G__8687 = s__8680 + 2;
              var G__8688 = d__8681 + 2;
              s__8680 = G__8687;
              d__8681 = G__8688;
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
  var len__8689 = cljs.core.count.call(null, ks);
  var i__8690 = 0;
  var out__8691 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8690 < len__8689) {
      var G__8692 = i__8690 + 1;
      var G__8693 = cljs.core.assoc_BANG_.call(null, out__8691, ks[i__8690], vs[i__8690]);
      i__8690 = G__8692;
      out__8691 = G__8693;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8691)
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
  var this__8694 = this;
  if(cljs.core.truth_(this__8694.editable_QMARK_)) {
    var idx__8695 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8695 >= 0) {
      this__8694.arr[idx__8695] = this__8694.arr[this__8694.len - 2];
      this__8694.arr[idx__8695 + 1] = this__8694.arr[this__8694.len - 1];
      var G__8696__8697 = this__8694.arr;
      G__8696__8697.pop();
      G__8696__8697.pop();
      G__8696__8697;
      this__8694.len = this__8694.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8698 = this;
  if(cljs.core.truth_(this__8698.editable_QMARK_)) {
    var idx__8699 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8699 === -1) {
      if(this__8698.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8698.len = this__8698.len + 2;
        this__8698.arr.push(key);
        this__8698.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8698.len, this__8698.arr), key, val)
      }
    }else {
      if(val === this__8698.arr[idx__8699 + 1]) {
        return tcoll
      }else {
        this__8698.arr[idx__8699 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8700 = this;
  if(cljs.core.truth_(this__8700.editable_QMARK_)) {
    if(function() {
      var G__8701__8702 = o;
      if(G__8701__8702) {
        if(function() {
          var or__3824__auto____8703 = G__8701__8702.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8703) {
            return or__3824__auto____8703
          }else {
            return G__8701__8702.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8701__8702.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8701__8702)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8701__8702)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8704 = cljs.core.seq.call(null, o);
      var tcoll__8705 = tcoll;
      while(true) {
        var temp__3971__auto____8706 = cljs.core.first.call(null, es__8704);
        if(cljs.core.truth_(temp__3971__auto____8706)) {
          var e__8707 = temp__3971__auto____8706;
          var G__8713 = cljs.core.next.call(null, es__8704);
          var G__8714 = tcoll__8705.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8705, cljs.core.key.call(null, e__8707), cljs.core.val.call(null, e__8707));
          es__8704 = G__8713;
          tcoll__8705 = G__8714;
          continue
        }else {
          return tcoll__8705
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8708 = this;
  if(cljs.core.truth_(this__8708.editable_QMARK_)) {
    this__8708.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8708.len, 2), this__8708.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8709 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8710 = this;
  if(cljs.core.truth_(this__8710.editable_QMARK_)) {
    var idx__8711 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8711 === -1) {
      return not_found
    }else {
      return this__8710.arr[idx__8711 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8712 = this;
  if(cljs.core.truth_(this__8712.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8712.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8717 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8718 = 0;
  while(true) {
    if(i__8718 < len) {
      var G__8719 = cljs.core.assoc_BANG_.call(null, out__8717, arr[i__8718], arr[i__8718 + 1]);
      var G__8720 = i__8718 + 2;
      out__8717 = G__8719;
      i__8718 = G__8720;
      continue
    }else {
      return out__8717
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
    var G__8725__8726 = arr.slice();
    G__8725__8726[i] = a;
    return G__8725__8726
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8727__8728 = arr.slice();
    G__8727__8728[i] = a;
    G__8727__8728[j] = b;
    return G__8727__8728
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
  var new_arr__8730 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8730, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8730, 2 * i, new_arr__8730.length - 2 * i);
  return new_arr__8730
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
    var editable__8733 = inode.ensure_editable(edit);
    editable__8733.arr[i] = a;
    return editable__8733
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8734 = inode.ensure_editable(edit);
    editable__8734.arr[i] = a;
    editable__8734.arr[j] = b;
    return editable__8734
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
  var len__8741 = arr.length;
  var i__8742 = 0;
  var init__8743 = init;
  while(true) {
    if(i__8742 < len__8741) {
      var init__8746 = function() {
        var k__8744 = arr[i__8742];
        if(!(k__8744 == null)) {
          return f.call(null, init__8743, k__8744, arr[i__8742 + 1])
        }else {
          var node__8745 = arr[i__8742 + 1];
          if(!(node__8745 == null)) {
            return node__8745.kv_reduce(f, init__8743)
          }else {
            return init__8743
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8746)) {
        return cljs.core.deref.call(null, init__8746)
      }else {
        var G__8747 = i__8742 + 2;
        var G__8748 = init__8746;
        i__8742 = G__8747;
        init__8743 = G__8748;
        continue
      }
    }else {
      return init__8743
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
  var this__8749 = this;
  var inode__8750 = this;
  if(this__8749.bitmap === bit) {
    return null
  }else {
    var editable__8751 = inode__8750.ensure_editable(e);
    var earr__8752 = editable__8751.arr;
    var len__8753 = earr__8752.length;
    editable__8751.bitmap = bit ^ editable__8751.bitmap;
    cljs.core.array_copy.call(null, earr__8752, 2 * (i + 1), earr__8752, 2 * i, len__8753 - 2 * (i + 1));
    earr__8752[len__8753 - 2] = null;
    earr__8752[len__8753 - 1] = null;
    return editable__8751
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8754 = this;
  var inode__8755 = this;
  var bit__8756 = 1 << (hash >>> shift & 31);
  var idx__8757 = cljs.core.bitmap_indexed_node_index.call(null, this__8754.bitmap, bit__8756);
  if((this__8754.bitmap & bit__8756) === 0) {
    var n__8758 = cljs.core.bit_count.call(null, this__8754.bitmap);
    if(2 * n__8758 < this__8754.arr.length) {
      var editable__8759 = inode__8755.ensure_editable(edit);
      var earr__8760 = editable__8759.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8760, 2 * idx__8757, earr__8760, 2 * (idx__8757 + 1), 2 * (n__8758 - idx__8757));
      earr__8760[2 * idx__8757] = key;
      earr__8760[2 * idx__8757 + 1] = val;
      editable__8759.bitmap = editable__8759.bitmap | bit__8756;
      return editable__8759
    }else {
      if(n__8758 >= 16) {
        var nodes__8761 = cljs.core.make_array.call(null, 32);
        var jdx__8762 = hash >>> shift & 31;
        nodes__8761[jdx__8762] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8763 = 0;
        var j__8764 = 0;
        while(true) {
          if(i__8763 < 32) {
            if((this__8754.bitmap >>> i__8763 & 1) === 0) {
              var G__8817 = i__8763 + 1;
              var G__8818 = j__8764;
              i__8763 = G__8817;
              j__8764 = G__8818;
              continue
            }else {
              nodes__8761[i__8763] = !(this__8754.arr[j__8764] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8754.arr[j__8764]), this__8754.arr[j__8764], this__8754.arr[j__8764 + 1], added_leaf_QMARK_) : this__8754.arr[j__8764 + 1];
              var G__8819 = i__8763 + 1;
              var G__8820 = j__8764 + 2;
              i__8763 = G__8819;
              j__8764 = G__8820;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8758 + 1, nodes__8761)
      }else {
        if("\ufdd0'else") {
          var new_arr__8765 = cljs.core.make_array.call(null, 2 * (n__8758 + 4));
          cljs.core.array_copy.call(null, this__8754.arr, 0, new_arr__8765, 0, 2 * idx__8757);
          new_arr__8765[2 * idx__8757] = key;
          new_arr__8765[2 * idx__8757 + 1] = val;
          cljs.core.array_copy.call(null, this__8754.arr, 2 * idx__8757, new_arr__8765, 2 * (idx__8757 + 1), 2 * (n__8758 - idx__8757));
          added_leaf_QMARK_.val = true;
          var editable__8766 = inode__8755.ensure_editable(edit);
          editable__8766.arr = new_arr__8765;
          editable__8766.bitmap = editable__8766.bitmap | bit__8756;
          return editable__8766
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8767 = this__8754.arr[2 * idx__8757];
    var val_or_node__8768 = this__8754.arr[2 * idx__8757 + 1];
    if(key_or_nil__8767 == null) {
      var n__8769 = val_or_node__8768.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8769 === val_or_node__8768) {
        return inode__8755
      }else {
        return cljs.core.edit_and_set.call(null, inode__8755, edit, 2 * idx__8757 + 1, n__8769)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8767)) {
        if(val === val_or_node__8768) {
          return inode__8755
        }else {
          return cljs.core.edit_and_set.call(null, inode__8755, edit, 2 * idx__8757 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8755, edit, 2 * idx__8757, null, 2 * idx__8757 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8767, val_or_node__8768, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8770 = this;
  var inode__8771 = this;
  return cljs.core.create_inode_seq.call(null, this__8770.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8772 = this;
  var inode__8773 = this;
  var bit__8774 = 1 << (hash >>> shift & 31);
  if((this__8772.bitmap & bit__8774) === 0) {
    return inode__8773
  }else {
    var idx__8775 = cljs.core.bitmap_indexed_node_index.call(null, this__8772.bitmap, bit__8774);
    var key_or_nil__8776 = this__8772.arr[2 * idx__8775];
    var val_or_node__8777 = this__8772.arr[2 * idx__8775 + 1];
    if(key_or_nil__8776 == null) {
      var n__8778 = val_or_node__8777.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8778 === val_or_node__8777) {
        return inode__8773
      }else {
        if(!(n__8778 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8773, edit, 2 * idx__8775 + 1, n__8778)
        }else {
          if(this__8772.bitmap === bit__8774) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8773.edit_and_remove_pair(edit, bit__8774, idx__8775)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8776)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8773.edit_and_remove_pair(edit, bit__8774, idx__8775)
      }else {
        if("\ufdd0'else") {
          return inode__8773
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8779 = this;
  var inode__8780 = this;
  if(e === this__8779.edit) {
    return inode__8780
  }else {
    var n__8781 = cljs.core.bit_count.call(null, this__8779.bitmap);
    var new_arr__8782 = cljs.core.make_array.call(null, n__8781 < 0 ? 4 : 2 * (n__8781 + 1));
    cljs.core.array_copy.call(null, this__8779.arr, 0, new_arr__8782, 0, 2 * n__8781);
    return new cljs.core.BitmapIndexedNode(e, this__8779.bitmap, new_arr__8782)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8783 = this;
  var inode__8784 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8783.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8785 = this;
  var inode__8786 = this;
  var bit__8787 = 1 << (hash >>> shift & 31);
  if((this__8785.bitmap & bit__8787) === 0) {
    return not_found
  }else {
    var idx__8788 = cljs.core.bitmap_indexed_node_index.call(null, this__8785.bitmap, bit__8787);
    var key_or_nil__8789 = this__8785.arr[2 * idx__8788];
    var val_or_node__8790 = this__8785.arr[2 * idx__8788 + 1];
    if(key_or_nil__8789 == null) {
      return val_or_node__8790.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8789)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8789, val_or_node__8790], true)
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
  var this__8791 = this;
  var inode__8792 = this;
  var bit__8793 = 1 << (hash >>> shift & 31);
  if((this__8791.bitmap & bit__8793) === 0) {
    return inode__8792
  }else {
    var idx__8794 = cljs.core.bitmap_indexed_node_index.call(null, this__8791.bitmap, bit__8793);
    var key_or_nil__8795 = this__8791.arr[2 * idx__8794];
    var val_or_node__8796 = this__8791.arr[2 * idx__8794 + 1];
    if(key_or_nil__8795 == null) {
      var n__8797 = val_or_node__8796.inode_without(shift + 5, hash, key);
      if(n__8797 === val_or_node__8796) {
        return inode__8792
      }else {
        if(!(n__8797 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8791.bitmap, cljs.core.clone_and_set.call(null, this__8791.arr, 2 * idx__8794 + 1, n__8797))
        }else {
          if(this__8791.bitmap === bit__8793) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8791.bitmap ^ bit__8793, cljs.core.remove_pair.call(null, this__8791.arr, idx__8794))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8795)) {
        return new cljs.core.BitmapIndexedNode(null, this__8791.bitmap ^ bit__8793, cljs.core.remove_pair.call(null, this__8791.arr, idx__8794))
      }else {
        if("\ufdd0'else") {
          return inode__8792
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8798 = this;
  var inode__8799 = this;
  var bit__8800 = 1 << (hash >>> shift & 31);
  var idx__8801 = cljs.core.bitmap_indexed_node_index.call(null, this__8798.bitmap, bit__8800);
  if((this__8798.bitmap & bit__8800) === 0) {
    var n__8802 = cljs.core.bit_count.call(null, this__8798.bitmap);
    if(n__8802 >= 16) {
      var nodes__8803 = cljs.core.make_array.call(null, 32);
      var jdx__8804 = hash >>> shift & 31;
      nodes__8803[jdx__8804] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8805 = 0;
      var j__8806 = 0;
      while(true) {
        if(i__8805 < 32) {
          if((this__8798.bitmap >>> i__8805 & 1) === 0) {
            var G__8821 = i__8805 + 1;
            var G__8822 = j__8806;
            i__8805 = G__8821;
            j__8806 = G__8822;
            continue
          }else {
            nodes__8803[i__8805] = !(this__8798.arr[j__8806] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8798.arr[j__8806]), this__8798.arr[j__8806], this__8798.arr[j__8806 + 1], added_leaf_QMARK_) : this__8798.arr[j__8806 + 1];
            var G__8823 = i__8805 + 1;
            var G__8824 = j__8806 + 2;
            i__8805 = G__8823;
            j__8806 = G__8824;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8802 + 1, nodes__8803)
    }else {
      var new_arr__8807 = cljs.core.make_array.call(null, 2 * (n__8802 + 1));
      cljs.core.array_copy.call(null, this__8798.arr, 0, new_arr__8807, 0, 2 * idx__8801);
      new_arr__8807[2 * idx__8801] = key;
      new_arr__8807[2 * idx__8801 + 1] = val;
      cljs.core.array_copy.call(null, this__8798.arr, 2 * idx__8801, new_arr__8807, 2 * (idx__8801 + 1), 2 * (n__8802 - idx__8801));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8798.bitmap | bit__8800, new_arr__8807)
    }
  }else {
    var key_or_nil__8808 = this__8798.arr[2 * idx__8801];
    var val_or_node__8809 = this__8798.arr[2 * idx__8801 + 1];
    if(key_or_nil__8808 == null) {
      var n__8810 = val_or_node__8809.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8810 === val_or_node__8809) {
        return inode__8799
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8798.bitmap, cljs.core.clone_and_set.call(null, this__8798.arr, 2 * idx__8801 + 1, n__8810))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8808)) {
        if(val === val_or_node__8809) {
          return inode__8799
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8798.bitmap, cljs.core.clone_and_set.call(null, this__8798.arr, 2 * idx__8801 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8798.bitmap, cljs.core.clone_and_set.call(null, this__8798.arr, 2 * idx__8801, null, 2 * idx__8801 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8808, val_or_node__8809, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8811 = this;
  var inode__8812 = this;
  var bit__8813 = 1 << (hash >>> shift & 31);
  if((this__8811.bitmap & bit__8813) === 0) {
    return not_found
  }else {
    var idx__8814 = cljs.core.bitmap_indexed_node_index.call(null, this__8811.bitmap, bit__8813);
    var key_or_nil__8815 = this__8811.arr[2 * idx__8814];
    var val_or_node__8816 = this__8811.arr[2 * idx__8814 + 1];
    if(key_or_nil__8815 == null) {
      return val_or_node__8816.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8815)) {
        return val_or_node__8816
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
  var arr__8832 = array_node.arr;
  var len__8833 = 2 * (array_node.cnt - 1);
  var new_arr__8834 = cljs.core.make_array.call(null, len__8833);
  var i__8835 = 0;
  var j__8836 = 1;
  var bitmap__8837 = 0;
  while(true) {
    if(i__8835 < len__8833) {
      if(function() {
        var and__3822__auto____8838 = !(i__8835 === idx);
        if(and__3822__auto____8838) {
          return!(arr__8832[i__8835] == null)
        }else {
          return and__3822__auto____8838
        }
      }()) {
        new_arr__8834[j__8836] = arr__8832[i__8835];
        var G__8839 = i__8835 + 1;
        var G__8840 = j__8836 + 2;
        var G__8841 = bitmap__8837 | 1 << i__8835;
        i__8835 = G__8839;
        j__8836 = G__8840;
        bitmap__8837 = G__8841;
        continue
      }else {
        var G__8842 = i__8835 + 1;
        var G__8843 = j__8836;
        var G__8844 = bitmap__8837;
        i__8835 = G__8842;
        j__8836 = G__8843;
        bitmap__8837 = G__8844;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8837, new_arr__8834)
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
  var this__8845 = this;
  var inode__8846 = this;
  var idx__8847 = hash >>> shift & 31;
  var node__8848 = this__8845.arr[idx__8847];
  if(node__8848 == null) {
    var editable__8849 = cljs.core.edit_and_set.call(null, inode__8846, edit, idx__8847, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8849.cnt = editable__8849.cnt + 1;
    return editable__8849
  }else {
    var n__8850 = node__8848.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8850 === node__8848) {
      return inode__8846
    }else {
      return cljs.core.edit_and_set.call(null, inode__8846, edit, idx__8847, n__8850)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8851 = this;
  var inode__8852 = this;
  return cljs.core.create_array_node_seq.call(null, this__8851.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8853 = this;
  var inode__8854 = this;
  var idx__8855 = hash >>> shift & 31;
  var node__8856 = this__8853.arr[idx__8855];
  if(node__8856 == null) {
    return inode__8854
  }else {
    var n__8857 = node__8856.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8857 === node__8856) {
      return inode__8854
    }else {
      if(n__8857 == null) {
        if(this__8853.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8854, edit, idx__8855)
        }else {
          var editable__8858 = cljs.core.edit_and_set.call(null, inode__8854, edit, idx__8855, n__8857);
          editable__8858.cnt = editable__8858.cnt - 1;
          return editable__8858
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8854, edit, idx__8855, n__8857)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8859 = this;
  var inode__8860 = this;
  if(e === this__8859.edit) {
    return inode__8860
  }else {
    return new cljs.core.ArrayNode(e, this__8859.cnt, this__8859.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8861 = this;
  var inode__8862 = this;
  var len__8863 = this__8861.arr.length;
  var i__8864 = 0;
  var init__8865 = init;
  while(true) {
    if(i__8864 < len__8863) {
      var node__8866 = this__8861.arr[i__8864];
      if(!(node__8866 == null)) {
        var init__8867 = node__8866.kv_reduce(f, init__8865);
        if(cljs.core.reduced_QMARK_.call(null, init__8867)) {
          return cljs.core.deref.call(null, init__8867)
        }else {
          var G__8886 = i__8864 + 1;
          var G__8887 = init__8867;
          i__8864 = G__8886;
          init__8865 = G__8887;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8865
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8868 = this;
  var inode__8869 = this;
  var idx__8870 = hash >>> shift & 31;
  var node__8871 = this__8868.arr[idx__8870];
  if(!(node__8871 == null)) {
    return node__8871.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8872 = this;
  var inode__8873 = this;
  var idx__8874 = hash >>> shift & 31;
  var node__8875 = this__8872.arr[idx__8874];
  if(!(node__8875 == null)) {
    var n__8876 = node__8875.inode_without(shift + 5, hash, key);
    if(n__8876 === node__8875) {
      return inode__8873
    }else {
      if(n__8876 == null) {
        if(this__8872.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8873, null, idx__8874)
        }else {
          return new cljs.core.ArrayNode(null, this__8872.cnt - 1, cljs.core.clone_and_set.call(null, this__8872.arr, idx__8874, n__8876))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8872.cnt, cljs.core.clone_and_set.call(null, this__8872.arr, idx__8874, n__8876))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8873
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8877 = this;
  var inode__8878 = this;
  var idx__8879 = hash >>> shift & 31;
  var node__8880 = this__8877.arr[idx__8879];
  if(node__8880 == null) {
    return new cljs.core.ArrayNode(null, this__8877.cnt + 1, cljs.core.clone_and_set.call(null, this__8877.arr, idx__8879, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8881 = node__8880.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8881 === node__8880) {
      return inode__8878
    }else {
      return new cljs.core.ArrayNode(null, this__8877.cnt, cljs.core.clone_and_set.call(null, this__8877.arr, idx__8879, n__8881))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8882 = this;
  var inode__8883 = this;
  var idx__8884 = hash >>> shift & 31;
  var node__8885 = this__8882.arr[idx__8884];
  if(!(node__8885 == null)) {
    return node__8885.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8890 = 2 * cnt;
  var i__8891 = 0;
  while(true) {
    if(i__8891 < lim__8890) {
      if(cljs.core.key_test.call(null, key, arr[i__8891])) {
        return i__8891
      }else {
        var G__8892 = i__8891 + 2;
        i__8891 = G__8892;
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
  var this__8893 = this;
  var inode__8894 = this;
  if(hash === this__8893.collision_hash) {
    var idx__8895 = cljs.core.hash_collision_node_find_index.call(null, this__8893.arr, this__8893.cnt, key);
    if(idx__8895 === -1) {
      if(this__8893.arr.length > 2 * this__8893.cnt) {
        var editable__8896 = cljs.core.edit_and_set.call(null, inode__8894, edit, 2 * this__8893.cnt, key, 2 * this__8893.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8896.cnt = editable__8896.cnt + 1;
        return editable__8896
      }else {
        var len__8897 = this__8893.arr.length;
        var new_arr__8898 = cljs.core.make_array.call(null, len__8897 + 2);
        cljs.core.array_copy.call(null, this__8893.arr, 0, new_arr__8898, 0, len__8897);
        new_arr__8898[len__8897] = key;
        new_arr__8898[len__8897 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8894.ensure_editable_array(edit, this__8893.cnt + 1, new_arr__8898)
      }
    }else {
      if(this__8893.arr[idx__8895 + 1] === val) {
        return inode__8894
      }else {
        return cljs.core.edit_and_set.call(null, inode__8894, edit, idx__8895 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8893.collision_hash >>> shift & 31), [null, inode__8894, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8899 = this;
  var inode__8900 = this;
  return cljs.core.create_inode_seq.call(null, this__8899.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8901 = this;
  var inode__8902 = this;
  var idx__8903 = cljs.core.hash_collision_node_find_index.call(null, this__8901.arr, this__8901.cnt, key);
  if(idx__8903 === -1) {
    return inode__8902
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8901.cnt === 1) {
      return null
    }else {
      var editable__8904 = inode__8902.ensure_editable(edit);
      var earr__8905 = editable__8904.arr;
      earr__8905[idx__8903] = earr__8905[2 * this__8901.cnt - 2];
      earr__8905[idx__8903 + 1] = earr__8905[2 * this__8901.cnt - 1];
      earr__8905[2 * this__8901.cnt - 1] = null;
      earr__8905[2 * this__8901.cnt - 2] = null;
      editable__8904.cnt = editable__8904.cnt - 1;
      return editable__8904
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8906 = this;
  var inode__8907 = this;
  if(e === this__8906.edit) {
    return inode__8907
  }else {
    var new_arr__8908 = cljs.core.make_array.call(null, 2 * (this__8906.cnt + 1));
    cljs.core.array_copy.call(null, this__8906.arr, 0, new_arr__8908, 0, 2 * this__8906.cnt);
    return new cljs.core.HashCollisionNode(e, this__8906.collision_hash, this__8906.cnt, new_arr__8908)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8909 = this;
  var inode__8910 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8909.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8911 = this;
  var inode__8912 = this;
  var idx__8913 = cljs.core.hash_collision_node_find_index.call(null, this__8911.arr, this__8911.cnt, key);
  if(idx__8913 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8911.arr[idx__8913])) {
      return cljs.core.PersistentVector.fromArray([this__8911.arr[idx__8913], this__8911.arr[idx__8913 + 1]], true)
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
  var this__8914 = this;
  var inode__8915 = this;
  var idx__8916 = cljs.core.hash_collision_node_find_index.call(null, this__8914.arr, this__8914.cnt, key);
  if(idx__8916 === -1) {
    return inode__8915
  }else {
    if(this__8914.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8914.collision_hash, this__8914.cnt - 1, cljs.core.remove_pair.call(null, this__8914.arr, cljs.core.quot.call(null, idx__8916, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8917 = this;
  var inode__8918 = this;
  if(hash === this__8917.collision_hash) {
    var idx__8919 = cljs.core.hash_collision_node_find_index.call(null, this__8917.arr, this__8917.cnt, key);
    if(idx__8919 === -1) {
      var len__8920 = this__8917.arr.length;
      var new_arr__8921 = cljs.core.make_array.call(null, len__8920 + 2);
      cljs.core.array_copy.call(null, this__8917.arr, 0, new_arr__8921, 0, len__8920);
      new_arr__8921[len__8920] = key;
      new_arr__8921[len__8920 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8917.collision_hash, this__8917.cnt + 1, new_arr__8921)
    }else {
      if(cljs.core._EQ_.call(null, this__8917.arr[idx__8919], val)) {
        return inode__8918
      }else {
        return new cljs.core.HashCollisionNode(null, this__8917.collision_hash, this__8917.cnt, cljs.core.clone_and_set.call(null, this__8917.arr, idx__8919 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8917.collision_hash >>> shift & 31), [null, inode__8918])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8922 = this;
  var inode__8923 = this;
  var idx__8924 = cljs.core.hash_collision_node_find_index.call(null, this__8922.arr, this__8922.cnt, key);
  if(idx__8924 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8922.arr[idx__8924])) {
      return this__8922.arr[idx__8924 + 1]
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
  var this__8925 = this;
  var inode__8926 = this;
  if(e === this__8925.edit) {
    this__8925.arr = array;
    this__8925.cnt = count;
    return inode__8926
  }else {
    return new cljs.core.HashCollisionNode(this__8925.edit, this__8925.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8931 = cljs.core.hash.call(null, key1);
    if(key1hash__8931 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8931, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8932 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8931, key1, val1, added_leaf_QMARK___8932).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8932)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8933 = cljs.core.hash.call(null, key1);
    if(key1hash__8933 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8933, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8934 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8933, key1, val1, added_leaf_QMARK___8934).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8934)
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
  var this__8935 = this;
  var h__2220__auto____8936 = this__8935.__hash;
  if(!(h__2220__auto____8936 == null)) {
    return h__2220__auto____8936
  }else {
    var h__2220__auto____8937 = cljs.core.hash_coll.call(null, coll);
    this__8935.__hash = h__2220__auto____8937;
    return h__2220__auto____8937
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8938 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8939 = this;
  var this__8940 = this;
  return cljs.core.pr_str.call(null, this__8940)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8941 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8942 = this;
  if(this__8942.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8942.nodes[this__8942.i], this__8942.nodes[this__8942.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8942.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8943 = this;
  if(this__8943.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8943.nodes, this__8943.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8943.nodes, this__8943.i, cljs.core.next.call(null, this__8943.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8944 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8945 = this;
  return new cljs.core.NodeSeq(meta, this__8945.nodes, this__8945.i, this__8945.s, this__8945.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8946 = this;
  return this__8946.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8947 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8947.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8954 = nodes.length;
      var j__8955 = i;
      while(true) {
        if(j__8955 < len__8954) {
          if(!(nodes[j__8955] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8955, null, null)
          }else {
            var temp__3971__auto____8956 = nodes[j__8955 + 1];
            if(cljs.core.truth_(temp__3971__auto____8956)) {
              var node__8957 = temp__3971__auto____8956;
              var temp__3971__auto____8958 = node__8957.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____8958)) {
                var node_seq__8959 = temp__3971__auto____8958;
                return new cljs.core.NodeSeq(null, nodes, j__8955 + 2, node_seq__8959, null)
              }else {
                var G__8960 = j__8955 + 2;
                j__8955 = G__8960;
                continue
              }
            }else {
              var G__8961 = j__8955 + 2;
              j__8955 = G__8961;
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
  var this__8962 = this;
  var h__2220__auto____8963 = this__8962.__hash;
  if(!(h__2220__auto____8963 == null)) {
    return h__2220__auto____8963
  }else {
    var h__2220__auto____8964 = cljs.core.hash_coll.call(null, coll);
    this__8962.__hash = h__2220__auto____8964;
    return h__2220__auto____8964
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8965 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8966 = this;
  var this__8967 = this;
  return cljs.core.pr_str.call(null, this__8967)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8968 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8969 = this;
  return cljs.core.first.call(null, this__8969.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8970 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8970.nodes, this__8970.i, cljs.core.next.call(null, this__8970.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8971 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8972 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8972.nodes, this__8972.i, this__8972.s, this__8972.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8973 = this;
  return this__8973.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8974 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8974.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8981 = nodes.length;
      var j__8982 = i;
      while(true) {
        if(j__8982 < len__8981) {
          var temp__3971__auto____8983 = nodes[j__8982];
          if(cljs.core.truth_(temp__3971__auto____8983)) {
            var nj__8984 = temp__3971__auto____8983;
            var temp__3971__auto____8985 = nj__8984.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____8985)) {
              var ns__8986 = temp__3971__auto____8985;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8982 + 1, ns__8986, null)
            }else {
              var G__8987 = j__8982 + 1;
              j__8982 = G__8987;
              continue
            }
          }else {
            var G__8988 = j__8982 + 1;
            j__8982 = G__8988;
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
  var this__8991 = this;
  return new cljs.core.TransientHashMap({}, this__8991.root, this__8991.cnt, this__8991.has_nil_QMARK_, this__8991.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8992 = this;
  var h__2220__auto____8993 = this__8992.__hash;
  if(!(h__2220__auto____8993 == null)) {
    return h__2220__auto____8993
  }else {
    var h__2220__auto____8994 = cljs.core.hash_imap.call(null, coll);
    this__8992.__hash = h__2220__auto____8994;
    return h__2220__auto____8994
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8995 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8996 = this;
  if(k == null) {
    if(this__8996.has_nil_QMARK_) {
      return this__8996.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8996.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8996.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8997 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____8998 = this__8997.has_nil_QMARK_;
      if(and__3822__auto____8998) {
        return v === this__8997.nil_val
      }else {
        return and__3822__auto____8998
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8997.meta, this__8997.has_nil_QMARK_ ? this__8997.cnt : this__8997.cnt + 1, this__8997.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8999 = new cljs.core.Box(false);
    var new_root__9000 = (this__8997.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8997.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8999);
    if(new_root__9000 === this__8997.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8997.meta, added_leaf_QMARK___8999.val ? this__8997.cnt + 1 : this__8997.cnt, new_root__9000, this__8997.has_nil_QMARK_, this__8997.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9001 = this;
  if(k == null) {
    return this__9001.has_nil_QMARK_
  }else {
    if(this__9001.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9001.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9024 = null;
  var G__9024__2 = function(this_sym9002, k) {
    var this__9004 = this;
    var this_sym9002__9005 = this;
    var coll__9006 = this_sym9002__9005;
    return coll__9006.cljs$core$ILookup$_lookup$arity$2(coll__9006, k)
  };
  var G__9024__3 = function(this_sym9003, k, not_found) {
    var this__9004 = this;
    var this_sym9003__9007 = this;
    var coll__9008 = this_sym9003__9007;
    return coll__9008.cljs$core$ILookup$_lookup$arity$3(coll__9008, k, not_found)
  };
  G__9024 = function(this_sym9003, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9024__2.call(this, this_sym9003, k);
      case 3:
        return G__9024__3.call(this, this_sym9003, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9024
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8989, args8990) {
  var this__9009 = this;
  return this_sym8989.call.apply(this_sym8989, [this_sym8989].concat(args8990.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9010 = this;
  var init__9011 = this__9010.has_nil_QMARK_ ? f.call(null, init, null, this__9010.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9011)) {
    return cljs.core.deref.call(null, init__9011)
  }else {
    if(!(this__9010.root == null)) {
      return this__9010.root.kv_reduce(f, init__9011)
    }else {
      if("\ufdd0'else") {
        return init__9011
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9012 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9013 = this;
  var this__9014 = this;
  return cljs.core.pr_str.call(null, this__9014)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9015 = this;
  if(this__9015.cnt > 0) {
    var s__9016 = !(this__9015.root == null) ? this__9015.root.inode_seq() : null;
    if(this__9015.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9015.nil_val], true), s__9016)
    }else {
      return s__9016
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9017 = this;
  return this__9017.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9018 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9019 = this;
  return new cljs.core.PersistentHashMap(meta, this__9019.cnt, this__9019.root, this__9019.has_nil_QMARK_, this__9019.nil_val, this__9019.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9020 = this;
  return this__9020.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9021 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9021.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9022 = this;
  if(k == null) {
    if(this__9022.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9022.meta, this__9022.cnt - 1, this__9022.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9022.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9023 = this__9022.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9023 === this__9022.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9022.meta, this__9022.cnt - 1, new_root__9023, this__9022.has_nil_QMARK_, this__9022.nil_val, null)
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
  var len__9025 = ks.length;
  var i__9026 = 0;
  var out__9027 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9026 < len__9025) {
      var G__9028 = i__9026 + 1;
      var G__9029 = cljs.core.assoc_BANG_.call(null, out__9027, ks[i__9026], vs[i__9026]);
      i__9026 = G__9028;
      out__9027 = G__9029;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9027)
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
  var this__9030 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9031 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9032 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9033 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9034 = this;
  if(k == null) {
    if(this__9034.has_nil_QMARK_) {
      return this__9034.nil_val
    }else {
      return null
    }
  }else {
    if(this__9034.root == null) {
      return null
    }else {
      return this__9034.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9035 = this;
  if(k == null) {
    if(this__9035.has_nil_QMARK_) {
      return this__9035.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9035.root == null) {
      return not_found
    }else {
      return this__9035.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9036 = this;
  if(this__9036.edit) {
    return this__9036.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9037 = this;
  var tcoll__9038 = this;
  if(this__9037.edit) {
    if(function() {
      var G__9039__9040 = o;
      if(G__9039__9040) {
        if(function() {
          var or__3824__auto____9041 = G__9039__9040.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9041) {
            return or__3824__auto____9041
          }else {
            return G__9039__9040.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9039__9040.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9039__9040)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9039__9040)
      }
    }()) {
      return tcoll__9038.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9042 = cljs.core.seq.call(null, o);
      var tcoll__9043 = tcoll__9038;
      while(true) {
        var temp__3971__auto____9044 = cljs.core.first.call(null, es__9042);
        if(cljs.core.truth_(temp__3971__auto____9044)) {
          var e__9045 = temp__3971__auto____9044;
          var G__9056 = cljs.core.next.call(null, es__9042);
          var G__9057 = tcoll__9043.assoc_BANG_(cljs.core.key.call(null, e__9045), cljs.core.val.call(null, e__9045));
          es__9042 = G__9056;
          tcoll__9043 = G__9057;
          continue
        }else {
          return tcoll__9043
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9046 = this;
  var tcoll__9047 = this;
  if(this__9046.edit) {
    if(k == null) {
      if(this__9046.nil_val === v) {
      }else {
        this__9046.nil_val = v
      }
      if(this__9046.has_nil_QMARK_) {
      }else {
        this__9046.count = this__9046.count + 1;
        this__9046.has_nil_QMARK_ = true
      }
      return tcoll__9047
    }else {
      var added_leaf_QMARK___9048 = new cljs.core.Box(false);
      var node__9049 = (this__9046.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9046.root).inode_assoc_BANG_(this__9046.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9048);
      if(node__9049 === this__9046.root) {
      }else {
        this__9046.root = node__9049
      }
      if(added_leaf_QMARK___9048.val) {
        this__9046.count = this__9046.count + 1
      }else {
      }
      return tcoll__9047
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9050 = this;
  var tcoll__9051 = this;
  if(this__9050.edit) {
    if(k == null) {
      if(this__9050.has_nil_QMARK_) {
        this__9050.has_nil_QMARK_ = false;
        this__9050.nil_val = null;
        this__9050.count = this__9050.count - 1;
        return tcoll__9051
      }else {
        return tcoll__9051
      }
    }else {
      if(this__9050.root == null) {
        return tcoll__9051
      }else {
        var removed_leaf_QMARK___9052 = new cljs.core.Box(false);
        var node__9053 = this__9050.root.inode_without_BANG_(this__9050.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9052);
        if(node__9053 === this__9050.root) {
        }else {
          this__9050.root = node__9053
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9052[0])) {
          this__9050.count = this__9050.count - 1
        }else {
        }
        return tcoll__9051
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9054 = this;
  var tcoll__9055 = this;
  if(this__9054.edit) {
    this__9054.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9054.count, this__9054.root, this__9054.has_nil_QMARK_, this__9054.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9060 = node;
  var stack__9061 = stack;
  while(true) {
    if(!(t__9060 == null)) {
      var G__9062 = ascending_QMARK_ ? t__9060.left : t__9060.right;
      var G__9063 = cljs.core.conj.call(null, stack__9061, t__9060);
      t__9060 = G__9062;
      stack__9061 = G__9063;
      continue
    }else {
      return stack__9061
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
  var this__9064 = this;
  var h__2220__auto____9065 = this__9064.__hash;
  if(!(h__2220__auto____9065 == null)) {
    return h__2220__auto____9065
  }else {
    var h__2220__auto____9066 = cljs.core.hash_coll.call(null, coll);
    this__9064.__hash = h__2220__auto____9066;
    return h__2220__auto____9066
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9067 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9068 = this;
  var this__9069 = this;
  return cljs.core.pr_str.call(null, this__9069)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9070 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9071 = this;
  if(this__9071.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9071.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9072 = this;
  return cljs.core.peek.call(null, this__9072.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9073 = this;
  var t__9074 = cljs.core.first.call(null, this__9073.stack);
  var next_stack__9075 = cljs.core.tree_map_seq_push.call(null, this__9073.ascending_QMARK_ ? t__9074.right : t__9074.left, cljs.core.next.call(null, this__9073.stack), this__9073.ascending_QMARK_);
  if(!(next_stack__9075 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9075, this__9073.ascending_QMARK_, this__9073.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9076 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9077 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9077.stack, this__9077.ascending_QMARK_, this__9077.cnt, this__9077.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9078 = this;
  return this__9078.meta
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
        var and__3822__auto____9080 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9080) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9080
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
        var and__3822__auto____9082 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9082) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9082
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
  var init__9086 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9086)) {
    return cljs.core.deref.call(null, init__9086)
  }else {
    var init__9087 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9086) : init__9086;
    if(cljs.core.reduced_QMARK_.call(null, init__9087)) {
      return cljs.core.deref.call(null, init__9087)
    }else {
      var init__9088 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9087) : init__9087;
      if(cljs.core.reduced_QMARK_.call(null, init__9088)) {
        return cljs.core.deref.call(null, init__9088)
      }else {
        return init__9088
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
  var this__9091 = this;
  var h__2220__auto____9092 = this__9091.__hash;
  if(!(h__2220__auto____9092 == null)) {
    return h__2220__auto____9092
  }else {
    var h__2220__auto____9093 = cljs.core.hash_coll.call(null, coll);
    this__9091.__hash = h__2220__auto____9093;
    return h__2220__auto____9093
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9094 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9095 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9096 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9096.key, this__9096.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9144 = null;
  var G__9144__2 = function(this_sym9097, k) {
    var this__9099 = this;
    var this_sym9097__9100 = this;
    var node__9101 = this_sym9097__9100;
    return node__9101.cljs$core$ILookup$_lookup$arity$2(node__9101, k)
  };
  var G__9144__3 = function(this_sym9098, k, not_found) {
    var this__9099 = this;
    var this_sym9098__9102 = this;
    var node__9103 = this_sym9098__9102;
    return node__9103.cljs$core$ILookup$_lookup$arity$3(node__9103, k, not_found)
  };
  G__9144 = function(this_sym9098, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9144__2.call(this, this_sym9098, k);
      case 3:
        return G__9144__3.call(this, this_sym9098, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9144
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9089, args9090) {
  var this__9104 = this;
  return this_sym9089.call.apply(this_sym9089, [this_sym9089].concat(args9090.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9105 = this;
  return cljs.core.PersistentVector.fromArray([this__9105.key, this__9105.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9106 = this;
  return this__9106.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9107 = this;
  return this__9107.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9108 = this;
  var node__9109 = this;
  return ins.balance_right(node__9109)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9110 = this;
  var node__9111 = this;
  return new cljs.core.RedNode(this__9110.key, this__9110.val, this__9110.left, this__9110.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9112 = this;
  var node__9113 = this;
  return cljs.core.balance_right_del.call(null, this__9112.key, this__9112.val, this__9112.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9114 = this;
  var node__9115 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9116 = this;
  var node__9117 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9117, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9118 = this;
  var node__9119 = this;
  return cljs.core.balance_left_del.call(null, this__9118.key, this__9118.val, del, this__9118.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9120 = this;
  var node__9121 = this;
  return ins.balance_left(node__9121)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9122 = this;
  var node__9123 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9123, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9145 = null;
  var G__9145__0 = function() {
    var this__9124 = this;
    var this__9126 = this;
    return cljs.core.pr_str.call(null, this__9126)
  };
  G__9145 = function() {
    switch(arguments.length) {
      case 0:
        return G__9145__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9145
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9127 = this;
  var node__9128 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9128, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9129 = this;
  var node__9130 = this;
  return node__9130
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9131 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9132 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9133 = this;
  return cljs.core.list.call(null, this__9133.key, this__9133.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9134 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9135 = this;
  return this__9135.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9136 = this;
  return cljs.core.PersistentVector.fromArray([this__9136.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9137 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9137.key, this__9137.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9138 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9139 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9139.key, this__9139.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9140 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9141 = this;
  if(n === 0) {
    return this__9141.key
  }else {
    if(n === 1) {
      return this__9141.val
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
  var this__9142 = this;
  if(n === 0) {
    return this__9142.key
  }else {
    if(n === 1) {
      return this__9142.val
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
  var this__9143 = this;
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
  var this__9148 = this;
  var h__2220__auto____9149 = this__9148.__hash;
  if(!(h__2220__auto____9149 == null)) {
    return h__2220__auto____9149
  }else {
    var h__2220__auto____9150 = cljs.core.hash_coll.call(null, coll);
    this__9148.__hash = h__2220__auto____9150;
    return h__2220__auto____9150
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9151 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9152 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9153 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9153.key, this__9153.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9201 = null;
  var G__9201__2 = function(this_sym9154, k) {
    var this__9156 = this;
    var this_sym9154__9157 = this;
    var node__9158 = this_sym9154__9157;
    return node__9158.cljs$core$ILookup$_lookup$arity$2(node__9158, k)
  };
  var G__9201__3 = function(this_sym9155, k, not_found) {
    var this__9156 = this;
    var this_sym9155__9159 = this;
    var node__9160 = this_sym9155__9159;
    return node__9160.cljs$core$ILookup$_lookup$arity$3(node__9160, k, not_found)
  };
  G__9201 = function(this_sym9155, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9201__2.call(this, this_sym9155, k);
      case 3:
        return G__9201__3.call(this, this_sym9155, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9201
}();
cljs.core.RedNode.prototype.apply = function(this_sym9146, args9147) {
  var this__9161 = this;
  return this_sym9146.call.apply(this_sym9146, [this_sym9146].concat(args9147.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9162 = this;
  return cljs.core.PersistentVector.fromArray([this__9162.key, this__9162.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9163 = this;
  return this__9163.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9164 = this;
  return this__9164.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9165 = this;
  var node__9166 = this;
  return new cljs.core.RedNode(this__9165.key, this__9165.val, this__9165.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9167 = this;
  var node__9168 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9169 = this;
  var node__9170 = this;
  return new cljs.core.RedNode(this__9169.key, this__9169.val, this__9169.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9171 = this;
  var node__9172 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9173 = this;
  var node__9174 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9174, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9175 = this;
  var node__9176 = this;
  return new cljs.core.RedNode(this__9175.key, this__9175.val, del, this__9175.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9177 = this;
  var node__9178 = this;
  return new cljs.core.RedNode(this__9177.key, this__9177.val, ins, this__9177.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9179 = this;
  var node__9180 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9179.left)) {
    return new cljs.core.RedNode(this__9179.key, this__9179.val, this__9179.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9179.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9179.right)) {
      return new cljs.core.RedNode(this__9179.right.key, this__9179.right.val, new cljs.core.BlackNode(this__9179.key, this__9179.val, this__9179.left, this__9179.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9179.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9180, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9202 = null;
  var G__9202__0 = function() {
    var this__9181 = this;
    var this__9183 = this;
    return cljs.core.pr_str.call(null, this__9183)
  };
  G__9202 = function() {
    switch(arguments.length) {
      case 0:
        return G__9202__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9202
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9184 = this;
  var node__9185 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9184.right)) {
    return new cljs.core.RedNode(this__9184.key, this__9184.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9184.left, null), this__9184.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9184.left)) {
      return new cljs.core.RedNode(this__9184.left.key, this__9184.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9184.left.left, null), new cljs.core.BlackNode(this__9184.key, this__9184.val, this__9184.left.right, this__9184.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9185, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9186 = this;
  var node__9187 = this;
  return new cljs.core.BlackNode(this__9186.key, this__9186.val, this__9186.left, this__9186.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9188 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9189 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9190 = this;
  return cljs.core.list.call(null, this__9190.key, this__9190.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9191 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9192 = this;
  return this__9192.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9193 = this;
  return cljs.core.PersistentVector.fromArray([this__9193.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9194 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9194.key, this__9194.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9195 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9196 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9196.key, this__9196.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9197 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9198 = this;
  if(n === 0) {
    return this__9198.key
  }else {
    if(n === 1) {
      return this__9198.val
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
  var this__9199 = this;
  if(n === 0) {
    return this__9199.key
  }else {
    if(n === 1) {
      return this__9199.val
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
  var this__9200 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9206 = comp.call(null, k, tree.key);
    if(c__9206 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9206 < 0) {
        var ins__9207 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9207 == null)) {
          return tree.add_left(ins__9207)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9208 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9208 == null)) {
            return tree.add_right(ins__9208)
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
          var app__9211 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9211)) {
            return new cljs.core.RedNode(app__9211.key, app__9211.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9211.left, null), new cljs.core.RedNode(right.key, right.val, app__9211.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9211, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9212 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9212)) {
              return new cljs.core.RedNode(app__9212.key, app__9212.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9212.left, null), new cljs.core.BlackNode(right.key, right.val, app__9212.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9212, right.right, null))
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
    var c__9218 = comp.call(null, k, tree.key);
    if(c__9218 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9218 < 0) {
        var del__9219 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9220 = !(del__9219 == null);
          if(or__3824__auto____9220) {
            return or__3824__auto____9220
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9219, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9219, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9221 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9222 = !(del__9221 == null);
            if(or__3824__auto____9222) {
              return or__3824__auto____9222
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9221)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9221, null)
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
  var tk__9225 = tree.key;
  var c__9226 = comp.call(null, k, tk__9225);
  if(c__9226 === 0) {
    return tree.replace(tk__9225, v, tree.left, tree.right)
  }else {
    if(c__9226 < 0) {
      return tree.replace(tk__9225, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9225, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
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
  var this__9229 = this;
  var h__2220__auto____9230 = this__9229.__hash;
  if(!(h__2220__auto____9230 == null)) {
    return h__2220__auto____9230
  }else {
    var h__2220__auto____9231 = cljs.core.hash_imap.call(null, coll);
    this__9229.__hash = h__2220__auto____9231;
    return h__2220__auto____9231
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9232 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9233 = this;
  var n__9234 = coll.entry_at(k);
  if(!(n__9234 == null)) {
    return n__9234.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9235 = this;
  var found__9236 = [null];
  var t__9237 = cljs.core.tree_map_add.call(null, this__9235.comp, this__9235.tree, k, v, found__9236);
  if(t__9237 == null) {
    var found_node__9238 = cljs.core.nth.call(null, found__9236, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9238.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9235.comp, cljs.core.tree_map_replace.call(null, this__9235.comp, this__9235.tree, k, v), this__9235.cnt, this__9235.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9235.comp, t__9237.blacken(), this__9235.cnt + 1, this__9235.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9239 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9273 = null;
  var G__9273__2 = function(this_sym9240, k) {
    var this__9242 = this;
    var this_sym9240__9243 = this;
    var coll__9244 = this_sym9240__9243;
    return coll__9244.cljs$core$ILookup$_lookup$arity$2(coll__9244, k)
  };
  var G__9273__3 = function(this_sym9241, k, not_found) {
    var this__9242 = this;
    var this_sym9241__9245 = this;
    var coll__9246 = this_sym9241__9245;
    return coll__9246.cljs$core$ILookup$_lookup$arity$3(coll__9246, k, not_found)
  };
  G__9273 = function(this_sym9241, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9273__2.call(this, this_sym9241, k);
      case 3:
        return G__9273__3.call(this, this_sym9241, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9273
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9227, args9228) {
  var this__9247 = this;
  return this_sym9227.call.apply(this_sym9227, [this_sym9227].concat(args9228.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9248 = this;
  if(!(this__9248.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9248.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9249 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9250 = this;
  if(this__9250.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9250.tree, false, this__9250.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9251 = this;
  var this__9252 = this;
  return cljs.core.pr_str.call(null, this__9252)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9253 = this;
  var coll__9254 = this;
  var t__9255 = this__9253.tree;
  while(true) {
    if(!(t__9255 == null)) {
      var c__9256 = this__9253.comp.call(null, k, t__9255.key);
      if(c__9256 === 0) {
        return t__9255
      }else {
        if(c__9256 < 0) {
          var G__9274 = t__9255.left;
          t__9255 = G__9274;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9275 = t__9255.right;
            t__9255 = G__9275;
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
  var this__9257 = this;
  if(this__9257.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9257.tree, ascending_QMARK_, this__9257.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9258 = this;
  if(this__9258.cnt > 0) {
    var stack__9259 = null;
    var t__9260 = this__9258.tree;
    while(true) {
      if(!(t__9260 == null)) {
        var c__9261 = this__9258.comp.call(null, k, t__9260.key);
        if(c__9261 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9259, t__9260), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9261 < 0) {
              var G__9276 = cljs.core.conj.call(null, stack__9259, t__9260);
              var G__9277 = t__9260.left;
              stack__9259 = G__9276;
              t__9260 = G__9277;
              continue
            }else {
              var G__9278 = stack__9259;
              var G__9279 = t__9260.right;
              stack__9259 = G__9278;
              t__9260 = G__9279;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9261 > 0) {
                var G__9280 = cljs.core.conj.call(null, stack__9259, t__9260);
                var G__9281 = t__9260.right;
                stack__9259 = G__9280;
                t__9260 = G__9281;
                continue
              }else {
                var G__9282 = stack__9259;
                var G__9283 = t__9260.left;
                stack__9259 = G__9282;
                t__9260 = G__9283;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9259 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9259, ascending_QMARK_, -1, null)
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
  var this__9262 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9263 = this;
  return this__9263.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9264 = this;
  if(this__9264.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9264.tree, true, this__9264.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9265 = this;
  return this__9265.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9266 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9267 = this;
  return new cljs.core.PersistentTreeMap(this__9267.comp, this__9267.tree, this__9267.cnt, meta, this__9267.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9268 = this;
  return this__9268.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9269 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9269.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9270 = this;
  var found__9271 = [null];
  var t__9272 = cljs.core.tree_map_remove.call(null, this__9270.comp, this__9270.tree, k, found__9271);
  if(t__9272 == null) {
    if(cljs.core.nth.call(null, found__9271, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9270.comp, null, 0, this__9270.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9270.comp, t__9272.blacken(), this__9270.cnt - 1, this__9270.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9286 = cljs.core.seq.call(null, keyvals);
    var out__9287 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9286) {
        var G__9288 = cljs.core.nnext.call(null, in__9286);
        var G__9289 = cljs.core.assoc_BANG_.call(null, out__9287, cljs.core.first.call(null, in__9286), cljs.core.second.call(null, in__9286));
        in__9286 = G__9288;
        out__9287 = G__9289;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9287)
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
  hash_map.cljs$lang$applyTo = function(arglist__9290) {
    var keyvals = cljs.core.seq(arglist__9290);
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
  array_map.cljs$lang$applyTo = function(arglist__9291) {
    var keyvals = cljs.core.seq(arglist__9291);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9295 = [];
    var obj__9296 = {};
    var kvs__9297 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9297) {
        ks__9295.push(cljs.core.first.call(null, kvs__9297));
        obj__9296[cljs.core.first.call(null, kvs__9297)] = cljs.core.second.call(null, kvs__9297);
        var G__9298 = cljs.core.nnext.call(null, kvs__9297);
        kvs__9297 = G__9298;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9295, obj__9296)
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
  obj_map.cljs$lang$applyTo = function(arglist__9299) {
    var keyvals = cljs.core.seq(arglist__9299);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9302 = cljs.core.seq.call(null, keyvals);
    var out__9303 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9302) {
        var G__9304 = cljs.core.nnext.call(null, in__9302);
        var G__9305 = cljs.core.assoc.call(null, out__9303, cljs.core.first.call(null, in__9302), cljs.core.second.call(null, in__9302));
        in__9302 = G__9304;
        out__9303 = G__9305;
        continue
      }else {
        return out__9303
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
  sorted_map.cljs$lang$applyTo = function(arglist__9306) {
    var keyvals = cljs.core.seq(arglist__9306);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9309 = cljs.core.seq.call(null, keyvals);
    var out__9310 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9309) {
        var G__9311 = cljs.core.nnext.call(null, in__9309);
        var G__9312 = cljs.core.assoc.call(null, out__9310, cljs.core.first.call(null, in__9309), cljs.core.second.call(null, in__9309));
        in__9309 = G__9311;
        out__9310 = G__9312;
        continue
      }else {
        return out__9310
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9313) {
    var comparator = cljs.core.first(arglist__9313);
    var keyvals = cljs.core.rest(arglist__9313);
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
      return cljs.core.reduce.call(null, function(p1__9314_SHARP_, p2__9315_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9317 = p1__9314_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9317)) {
            return or__3824__auto____9317
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9315_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9318) {
    var maps = cljs.core.seq(arglist__9318);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9326 = function(m, e) {
        var k__9324 = cljs.core.first.call(null, e);
        var v__9325 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9324)) {
          return cljs.core.assoc.call(null, m, k__9324, f.call(null, cljs.core._lookup.call(null, m, k__9324, null), v__9325))
        }else {
          return cljs.core.assoc.call(null, m, k__9324, v__9325)
        }
      };
      var merge2__9328 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9326, function() {
          var or__3824__auto____9327 = m1;
          if(cljs.core.truth_(or__3824__auto____9327)) {
            return or__3824__auto____9327
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9328, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9329) {
    var f = cljs.core.first(arglist__9329);
    var maps = cljs.core.rest(arglist__9329);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9334 = cljs.core.ObjMap.EMPTY;
  var keys__9335 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9335) {
      var key__9336 = cljs.core.first.call(null, keys__9335);
      var entry__9337 = cljs.core._lookup.call(null, map, key__9336, "\ufdd0'cljs.core/not-found");
      var G__9338 = cljs.core.not_EQ_.call(null, entry__9337, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9334, key__9336, entry__9337) : ret__9334;
      var G__9339 = cljs.core.next.call(null, keys__9335);
      ret__9334 = G__9338;
      keys__9335 = G__9339;
      continue
    }else {
      return ret__9334
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
  var this__9343 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9343.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9344 = this;
  var h__2220__auto____9345 = this__9344.__hash;
  if(!(h__2220__auto____9345 == null)) {
    return h__2220__auto____9345
  }else {
    var h__2220__auto____9346 = cljs.core.hash_iset.call(null, coll);
    this__9344.__hash = h__2220__auto____9346;
    return h__2220__auto____9346
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9347 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9348 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9348.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9369 = null;
  var G__9369__2 = function(this_sym9349, k) {
    var this__9351 = this;
    var this_sym9349__9352 = this;
    var coll__9353 = this_sym9349__9352;
    return coll__9353.cljs$core$ILookup$_lookup$arity$2(coll__9353, k)
  };
  var G__9369__3 = function(this_sym9350, k, not_found) {
    var this__9351 = this;
    var this_sym9350__9354 = this;
    var coll__9355 = this_sym9350__9354;
    return coll__9355.cljs$core$ILookup$_lookup$arity$3(coll__9355, k, not_found)
  };
  G__9369 = function(this_sym9350, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9369__2.call(this, this_sym9350, k);
      case 3:
        return G__9369__3.call(this, this_sym9350, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9369
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9341, args9342) {
  var this__9356 = this;
  return this_sym9341.call.apply(this_sym9341, [this_sym9341].concat(args9342.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9357 = this;
  return new cljs.core.PersistentHashSet(this__9357.meta, cljs.core.assoc.call(null, this__9357.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9358 = this;
  var this__9359 = this;
  return cljs.core.pr_str.call(null, this__9359)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9360 = this;
  return cljs.core.keys.call(null, this__9360.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9361 = this;
  return new cljs.core.PersistentHashSet(this__9361.meta, cljs.core.dissoc.call(null, this__9361.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9362 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9363 = this;
  var and__3822__auto____9364 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9364) {
    var and__3822__auto____9365 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9365) {
      return cljs.core.every_QMARK_.call(null, function(p1__9340_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9340_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9365
    }
  }else {
    return and__3822__auto____9364
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9366 = this;
  return new cljs.core.PersistentHashSet(meta, this__9366.hash_map, this__9366.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9367 = this;
  return this__9367.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9368 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9368.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9370 = cljs.core.count.call(null, items);
  var i__9371 = 0;
  var out__9372 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9371 < len__9370) {
      var G__9373 = i__9371 + 1;
      var G__9374 = cljs.core.conj_BANG_.call(null, out__9372, items[i__9371]);
      i__9371 = G__9373;
      out__9372 = G__9374;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9372)
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
  var G__9392 = null;
  var G__9392__2 = function(this_sym9378, k) {
    var this__9380 = this;
    var this_sym9378__9381 = this;
    var tcoll__9382 = this_sym9378__9381;
    if(cljs.core._lookup.call(null, this__9380.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9392__3 = function(this_sym9379, k, not_found) {
    var this__9380 = this;
    var this_sym9379__9383 = this;
    var tcoll__9384 = this_sym9379__9383;
    if(cljs.core._lookup.call(null, this__9380.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9392 = function(this_sym9379, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9392__2.call(this, this_sym9379, k);
      case 3:
        return G__9392__3.call(this, this_sym9379, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9392
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9376, args9377) {
  var this__9385 = this;
  return this_sym9376.call.apply(this_sym9376, [this_sym9376].concat(args9377.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9386 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9387 = this;
  if(cljs.core._lookup.call(null, this__9387.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9388 = this;
  return cljs.core.count.call(null, this__9388.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9389 = this;
  this__9389.transient_map = cljs.core.dissoc_BANG_.call(null, this__9389.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9390 = this;
  this__9390.transient_map = cljs.core.assoc_BANG_.call(null, this__9390.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9391 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9391.transient_map), null)
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
  var this__9395 = this;
  var h__2220__auto____9396 = this__9395.__hash;
  if(!(h__2220__auto____9396 == null)) {
    return h__2220__auto____9396
  }else {
    var h__2220__auto____9397 = cljs.core.hash_iset.call(null, coll);
    this__9395.__hash = h__2220__auto____9397;
    return h__2220__auto____9397
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9398 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9399 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9399.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9425 = null;
  var G__9425__2 = function(this_sym9400, k) {
    var this__9402 = this;
    var this_sym9400__9403 = this;
    var coll__9404 = this_sym9400__9403;
    return coll__9404.cljs$core$ILookup$_lookup$arity$2(coll__9404, k)
  };
  var G__9425__3 = function(this_sym9401, k, not_found) {
    var this__9402 = this;
    var this_sym9401__9405 = this;
    var coll__9406 = this_sym9401__9405;
    return coll__9406.cljs$core$ILookup$_lookup$arity$3(coll__9406, k, not_found)
  };
  G__9425 = function(this_sym9401, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9425__2.call(this, this_sym9401, k);
      case 3:
        return G__9425__3.call(this, this_sym9401, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9425
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9393, args9394) {
  var this__9407 = this;
  return this_sym9393.call.apply(this_sym9393, [this_sym9393].concat(args9394.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9408 = this;
  return new cljs.core.PersistentTreeSet(this__9408.meta, cljs.core.assoc.call(null, this__9408.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9409 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9409.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9410 = this;
  var this__9411 = this;
  return cljs.core.pr_str.call(null, this__9411)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9412 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9412.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9413 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9413.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9414 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9415 = this;
  return cljs.core._comparator.call(null, this__9415.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9416 = this;
  return cljs.core.keys.call(null, this__9416.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9417 = this;
  return new cljs.core.PersistentTreeSet(this__9417.meta, cljs.core.dissoc.call(null, this__9417.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9418 = this;
  return cljs.core.count.call(null, this__9418.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9419 = this;
  var and__3822__auto____9420 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9420) {
    var and__3822__auto____9421 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9421) {
      return cljs.core.every_QMARK_.call(null, function(p1__9375_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9375_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9421
    }
  }else {
    return and__3822__auto____9420
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9422 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9422.tree_map, this__9422.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9423 = this;
  return this__9423.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9424 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9424.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9430__delegate = function(keys) {
      var in__9428 = cljs.core.seq.call(null, keys);
      var out__9429 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9428)) {
          var G__9431 = cljs.core.next.call(null, in__9428);
          var G__9432 = cljs.core.conj_BANG_.call(null, out__9429, cljs.core.first.call(null, in__9428));
          in__9428 = G__9431;
          out__9429 = G__9432;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9429)
        }
        break
      }
    };
    var G__9430 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9430__delegate.call(this, keys)
    };
    G__9430.cljs$lang$maxFixedArity = 0;
    G__9430.cljs$lang$applyTo = function(arglist__9433) {
      var keys = cljs.core.seq(arglist__9433);
      return G__9430__delegate(keys)
    };
    G__9430.cljs$lang$arity$variadic = G__9430__delegate;
    return G__9430
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
  sorted_set.cljs$lang$applyTo = function(arglist__9434) {
    var keys = cljs.core.seq(arglist__9434);
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
  sorted_set_by.cljs$lang$applyTo = function(arglist__9436) {
    var comparator = cljs.core.first(arglist__9436);
    var keys = cljs.core.rest(arglist__9436);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9442 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9443 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9443)) {
        var e__9444 = temp__3971__auto____9443;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9444))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9442, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9435_SHARP_) {
      var temp__3971__auto____9445 = cljs.core.find.call(null, smap, p1__9435_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9445)) {
        var e__9446 = temp__3971__auto____9445;
        return cljs.core.second.call(null, e__9446)
      }else {
        return p1__9435_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9476 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9469, seen) {
        while(true) {
          var vec__9470__9471 = p__9469;
          var f__9472 = cljs.core.nth.call(null, vec__9470__9471, 0, null);
          var xs__9473 = vec__9470__9471;
          var temp__3974__auto____9474 = cljs.core.seq.call(null, xs__9473);
          if(temp__3974__auto____9474) {
            var s__9475 = temp__3974__auto____9474;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9472)) {
              var G__9477 = cljs.core.rest.call(null, s__9475);
              var G__9478 = seen;
              p__9469 = G__9477;
              seen = G__9478;
              continue
            }else {
              return cljs.core.cons.call(null, f__9472, step.call(null, cljs.core.rest.call(null, s__9475), cljs.core.conj.call(null, seen, f__9472)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9476.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9481 = cljs.core.PersistentVector.EMPTY;
  var s__9482 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9482)) {
      var G__9483 = cljs.core.conj.call(null, ret__9481, cljs.core.first.call(null, s__9482));
      var G__9484 = cljs.core.next.call(null, s__9482);
      ret__9481 = G__9483;
      s__9482 = G__9484;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9481)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9487 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9487) {
        return or__3824__auto____9487
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9488 = x.lastIndexOf("/");
      if(i__9488 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9488 + 1)
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
    var or__3824__auto____9491 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9491) {
      return or__3824__auto____9491
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9492 = x.lastIndexOf("/");
    if(i__9492 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9492)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9499 = cljs.core.ObjMap.EMPTY;
  var ks__9500 = cljs.core.seq.call(null, keys);
  var vs__9501 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9502 = ks__9500;
      if(and__3822__auto____9502) {
        return vs__9501
      }else {
        return and__3822__auto____9502
      }
    }()) {
      var G__9503 = cljs.core.assoc.call(null, map__9499, cljs.core.first.call(null, ks__9500), cljs.core.first.call(null, vs__9501));
      var G__9504 = cljs.core.next.call(null, ks__9500);
      var G__9505 = cljs.core.next.call(null, vs__9501);
      map__9499 = G__9503;
      ks__9500 = G__9504;
      vs__9501 = G__9505;
      continue
    }else {
      return map__9499
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
    var G__9508__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9493_SHARP_, p2__9494_SHARP_) {
        return max_key.call(null, k, p1__9493_SHARP_, p2__9494_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9508 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9508__delegate.call(this, k, x, y, more)
    };
    G__9508.cljs$lang$maxFixedArity = 3;
    G__9508.cljs$lang$applyTo = function(arglist__9509) {
      var k = cljs.core.first(arglist__9509);
      var x = cljs.core.first(cljs.core.next(arglist__9509));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9509)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9509)));
      return G__9508__delegate(k, x, y, more)
    };
    G__9508.cljs$lang$arity$variadic = G__9508__delegate;
    return G__9508
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
    var G__9510__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9506_SHARP_, p2__9507_SHARP_) {
        return min_key.call(null, k, p1__9506_SHARP_, p2__9507_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9510 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9510__delegate.call(this, k, x, y, more)
    };
    G__9510.cljs$lang$maxFixedArity = 3;
    G__9510.cljs$lang$applyTo = function(arglist__9511) {
      var k = cljs.core.first(arglist__9511);
      var x = cljs.core.first(cljs.core.next(arglist__9511));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9511)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9511)));
      return G__9510__delegate(k, x, y, more)
    };
    G__9510.cljs$lang$arity$variadic = G__9510__delegate;
    return G__9510
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
      var temp__3974__auto____9514 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9514) {
        var s__9515 = temp__3974__auto____9514;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9515), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9515)))
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
    var temp__3974__auto____9518 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9518) {
      var s__9519 = temp__3974__auto____9518;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9519)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9519), take_while.call(null, pred, cljs.core.rest.call(null, s__9519)))
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
    var comp__9521 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9521.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9533 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9534 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9534)) {
        var vec__9535__9536 = temp__3974__auto____9534;
        var e__9537 = cljs.core.nth.call(null, vec__9535__9536, 0, null);
        var s__9538 = vec__9535__9536;
        if(cljs.core.truth_(include__9533.call(null, e__9537))) {
          return s__9538
        }else {
          return cljs.core.next.call(null, s__9538)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9533, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9539 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9539)) {
      var vec__9540__9541 = temp__3974__auto____9539;
      var e__9542 = cljs.core.nth.call(null, vec__9540__9541, 0, null);
      var s__9543 = vec__9540__9541;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9542)) ? s__9543 : cljs.core.next.call(null, s__9543))
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
    var include__9555 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9556 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9556)) {
        var vec__9557__9558 = temp__3974__auto____9556;
        var e__9559 = cljs.core.nth.call(null, vec__9557__9558, 0, null);
        var s__9560 = vec__9557__9558;
        if(cljs.core.truth_(include__9555.call(null, e__9559))) {
          return s__9560
        }else {
          return cljs.core.next.call(null, s__9560)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9555, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9561 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9561)) {
      var vec__9562__9563 = temp__3974__auto____9561;
      var e__9564 = cljs.core.nth.call(null, vec__9562__9563, 0, null);
      var s__9565 = vec__9562__9563;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9564)) ? s__9565 : cljs.core.next.call(null, s__9565))
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
  var this__9566 = this;
  var h__2220__auto____9567 = this__9566.__hash;
  if(!(h__2220__auto____9567 == null)) {
    return h__2220__auto____9567
  }else {
    var h__2220__auto____9568 = cljs.core.hash_coll.call(null, rng);
    this__9566.__hash = h__2220__auto____9568;
    return h__2220__auto____9568
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9569 = this;
  if(this__9569.step > 0) {
    if(this__9569.start + this__9569.step < this__9569.end) {
      return new cljs.core.Range(this__9569.meta, this__9569.start + this__9569.step, this__9569.end, this__9569.step, null)
    }else {
      return null
    }
  }else {
    if(this__9569.start + this__9569.step > this__9569.end) {
      return new cljs.core.Range(this__9569.meta, this__9569.start + this__9569.step, this__9569.end, this__9569.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9570 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9571 = this;
  var this__9572 = this;
  return cljs.core.pr_str.call(null, this__9572)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9573 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9574 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9575 = this;
  if(this__9575.step > 0) {
    if(this__9575.start < this__9575.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9575.start > this__9575.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9576 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9576.end - this__9576.start) / this__9576.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9577 = this;
  return this__9577.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9578 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9578.meta, this__9578.start + this__9578.step, this__9578.end, this__9578.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9579 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9580 = this;
  return new cljs.core.Range(meta, this__9580.start, this__9580.end, this__9580.step, this__9580.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9581 = this;
  return this__9581.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9582 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9582.start + n * this__9582.step
  }else {
    if(function() {
      var and__3822__auto____9583 = this__9582.start > this__9582.end;
      if(and__3822__auto____9583) {
        return this__9582.step === 0
      }else {
        return and__3822__auto____9583
      }
    }()) {
      return this__9582.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9584 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9584.start + n * this__9584.step
  }else {
    if(function() {
      var and__3822__auto____9585 = this__9584.start > this__9584.end;
      if(and__3822__auto____9585) {
        return this__9584.step === 0
      }else {
        return and__3822__auto____9585
      }
    }()) {
      return this__9584.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9586 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9586.meta)
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
    var temp__3974__auto____9589 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9589) {
      var s__9590 = temp__3974__auto____9589;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9590), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9590)))
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
    var temp__3974__auto____9597 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9597) {
      var s__9598 = temp__3974__auto____9597;
      var fst__9599 = cljs.core.first.call(null, s__9598);
      var fv__9600 = f.call(null, fst__9599);
      var run__9601 = cljs.core.cons.call(null, fst__9599, cljs.core.take_while.call(null, function(p1__9591_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9600, f.call(null, p1__9591_SHARP_))
      }, cljs.core.next.call(null, s__9598)));
      return cljs.core.cons.call(null, run__9601, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9601), s__9598))))
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
      var temp__3971__auto____9616 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9616) {
        var s__9617 = temp__3971__auto____9616;
        return reductions.call(null, f, cljs.core.first.call(null, s__9617), cljs.core.rest.call(null, s__9617))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9618 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9618) {
        var s__9619 = temp__3974__auto____9618;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9619)), cljs.core.rest.call(null, s__9619))
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
      var G__9622 = null;
      var G__9622__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9622__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9622__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9622__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9622__4 = function() {
        var G__9623__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9623 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9623__delegate.call(this, x, y, z, args)
        };
        G__9623.cljs$lang$maxFixedArity = 3;
        G__9623.cljs$lang$applyTo = function(arglist__9624) {
          var x = cljs.core.first(arglist__9624);
          var y = cljs.core.first(cljs.core.next(arglist__9624));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9624)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9624)));
          return G__9623__delegate(x, y, z, args)
        };
        G__9623.cljs$lang$arity$variadic = G__9623__delegate;
        return G__9623
      }();
      G__9622 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9622__0.call(this);
          case 1:
            return G__9622__1.call(this, x);
          case 2:
            return G__9622__2.call(this, x, y);
          case 3:
            return G__9622__3.call(this, x, y, z);
          default:
            return G__9622__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9622.cljs$lang$maxFixedArity = 3;
      G__9622.cljs$lang$applyTo = G__9622__4.cljs$lang$applyTo;
      return G__9622
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9625 = null;
      var G__9625__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9625__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9625__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9625__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9625__4 = function() {
        var G__9626__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9626 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9626__delegate.call(this, x, y, z, args)
        };
        G__9626.cljs$lang$maxFixedArity = 3;
        G__9626.cljs$lang$applyTo = function(arglist__9627) {
          var x = cljs.core.first(arglist__9627);
          var y = cljs.core.first(cljs.core.next(arglist__9627));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9627)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9627)));
          return G__9626__delegate(x, y, z, args)
        };
        G__9626.cljs$lang$arity$variadic = G__9626__delegate;
        return G__9626
      }();
      G__9625 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9625__0.call(this);
          case 1:
            return G__9625__1.call(this, x);
          case 2:
            return G__9625__2.call(this, x, y);
          case 3:
            return G__9625__3.call(this, x, y, z);
          default:
            return G__9625__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9625.cljs$lang$maxFixedArity = 3;
      G__9625.cljs$lang$applyTo = G__9625__4.cljs$lang$applyTo;
      return G__9625
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9628 = null;
      var G__9628__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9628__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9628__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9628__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9628__4 = function() {
        var G__9629__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9629 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9629__delegate.call(this, x, y, z, args)
        };
        G__9629.cljs$lang$maxFixedArity = 3;
        G__9629.cljs$lang$applyTo = function(arglist__9630) {
          var x = cljs.core.first(arglist__9630);
          var y = cljs.core.first(cljs.core.next(arglist__9630));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9630)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9630)));
          return G__9629__delegate(x, y, z, args)
        };
        G__9629.cljs$lang$arity$variadic = G__9629__delegate;
        return G__9629
      }();
      G__9628 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9628__0.call(this);
          case 1:
            return G__9628__1.call(this, x);
          case 2:
            return G__9628__2.call(this, x, y);
          case 3:
            return G__9628__3.call(this, x, y, z);
          default:
            return G__9628__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9628.cljs$lang$maxFixedArity = 3;
      G__9628.cljs$lang$applyTo = G__9628__4.cljs$lang$applyTo;
      return G__9628
    }()
  };
  var juxt__4 = function() {
    var G__9631__delegate = function(f, g, h, fs) {
      var fs__9621 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9632 = null;
        var G__9632__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9602_SHARP_, p2__9603_SHARP_) {
            return cljs.core.conj.call(null, p1__9602_SHARP_, p2__9603_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9621)
        };
        var G__9632__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9604_SHARP_, p2__9605_SHARP_) {
            return cljs.core.conj.call(null, p1__9604_SHARP_, p2__9605_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9621)
        };
        var G__9632__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9606_SHARP_, p2__9607_SHARP_) {
            return cljs.core.conj.call(null, p1__9606_SHARP_, p2__9607_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9621)
        };
        var G__9632__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9608_SHARP_, p2__9609_SHARP_) {
            return cljs.core.conj.call(null, p1__9608_SHARP_, p2__9609_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9621)
        };
        var G__9632__4 = function() {
          var G__9633__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9610_SHARP_, p2__9611_SHARP_) {
              return cljs.core.conj.call(null, p1__9610_SHARP_, cljs.core.apply.call(null, p2__9611_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9621)
          };
          var G__9633 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9633__delegate.call(this, x, y, z, args)
          };
          G__9633.cljs$lang$maxFixedArity = 3;
          G__9633.cljs$lang$applyTo = function(arglist__9634) {
            var x = cljs.core.first(arglist__9634);
            var y = cljs.core.first(cljs.core.next(arglist__9634));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9634)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9634)));
            return G__9633__delegate(x, y, z, args)
          };
          G__9633.cljs$lang$arity$variadic = G__9633__delegate;
          return G__9633
        }();
        G__9632 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9632__0.call(this);
            case 1:
              return G__9632__1.call(this, x);
            case 2:
              return G__9632__2.call(this, x, y);
            case 3:
              return G__9632__3.call(this, x, y, z);
            default:
              return G__9632__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9632.cljs$lang$maxFixedArity = 3;
        G__9632.cljs$lang$applyTo = G__9632__4.cljs$lang$applyTo;
        return G__9632
      }()
    };
    var G__9631 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9631__delegate.call(this, f, g, h, fs)
    };
    G__9631.cljs$lang$maxFixedArity = 3;
    G__9631.cljs$lang$applyTo = function(arglist__9635) {
      var f = cljs.core.first(arglist__9635);
      var g = cljs.core.first(cljs.core.next(arglist__9635));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9635)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9635)));
      return G__9631__delegate(f, g, h, fs)
    };
    G__9631.cljs$lang$arity$variadic = G__9631__delegate;
    return G__9631
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
        var G__9638 = cljs.core.next.call(null, coll);
        coll = G__9638;
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
        var and__3822__auto____9637 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____9637) {
          return n > 0
        }else {
          return and__3822__auto____9637
        }
      }())) {
        var G__9639 = n - 1;
        var G__9640 = cljs.core.next.call(null, coll);
        n = G__9639;
        coll = G__9640;
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
  var matches__9642 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9642), s)) {
    if(cljs.core.count.call(null, matches__9642) === 1) {
      return cljs.core.first.call(null, matches__9642)
    }else {
      return cljs.core.vec.call(null, matches__9642)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9644 = re.exec(s);
  if(matches__9644 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9644) === 1) {
      return cljs.core.first.call(null, matches__9644)
    }else {
      return cljs.core.vec.call(null, matches__9644)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9649 = cljs.core.re_find.call(null, re, s);
  var match_idx__9650 = s.search(re);
  var match_str__9651 = cljs.core.coll_QMARK_.call(null, match_data__9649) ? cljs.core.first.call(null, match_data__9649) : match_data__9649;
  var post_match__9652 = cljs.core.subs.call(null, s, match_idx__9650 + cljs.core.count.call(null, match_str__9651));
  if(cljs.core.truth_(match_data__9649)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9649, re_seq.call(null, re, post_match__9652))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9659__9660 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9661 = cljs.core.nth.call(null, vec__9659__9660, 0, null);
  var flags__9662 = cljs.core.nth.call(null, vec__9659__9660, 1, null);
  var pattern__9663 = cljs.core.nth.call(null, vec__9659__9660, 2, null);
  return new RegExp(pattern__9663, flags__9662)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9653_SHARP_) {
    return print_one.call(null, p1__9653_SHARP_, opts)
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
          var and__3822__auto____9673 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9673)) {
            var and__3822__auto____9677 = function() {
              var G__9674__9675 = obj;
              if(G__9674__9675) {
                if(function() {
                  var or__3824__auto____9676 = G__9674__9675.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9676) {
                    return or__3824__auto____9676
                  }else {
                    return G__9674__9675.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9674__9675.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9674__9675)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9674__9675)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9677)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____9677
            }
          }else {
            return and__3822__auto____9673
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____9678 = !(obj == null);
          if(and__3822__auto____9678) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9678
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9679__9680 = obj;
          if(G__9679__9680) {
            if(function() {
              var or__3824__auto____9681 = G__9679__9680.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9681) {
                return or__3824__auto____9681
              }else {
                return G__9679__9680.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9679__9680.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9679__9680)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9679__9680)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9701 = new goog.string.StringBuffer;
  var G__9702__9703 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9702__9703) {
    var string__9704 = cljs.core.first.call(null, G__9702__9703);
    var G__9702__9705 = G__9702__9703;
    while(true) {
      sb__9701.append(string__9704);
      var temp__3974__auto____9706 = cljs.core.next.call(null, G__9702__9705);
      if(temp__3974__auto____9706) {
        var G__9702__9707 = temp__3974__auto____9706;
        var G__9720 = cljs.core.first.call(null, G__9702__9707);
        var G__9721 = G__9702__9707;
        string__9704 = G__9720;
        G__9702__9705 = G__9721;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9708__9709 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9708__9709) {
    var obj__9710 = cljs.core.first.call(null, G__9708__9709);
    var G__9708__9711 = G__9708__9709;
    while(true) {
      sb__9701.append(" ");
      var G__9712__9713 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9710, opts));
      if(G__9712__9713) {
        var string__9714 = cljs.core.first.call(null, G__9712__9713);
        var G__9712__9715 = G__9712__9713;
        while(true) {
          sb__9701.append(string__9714);
          var temp__3974__auto____9716 = cljs.core.next.call(null, G__9712__9715);
          if(temp__3974__auto____9716) {
            var G__9712__9717 = temp__3974__auto____9716;
            var G__9722 = cljs.core.first.call(null, G__9712__9717);
            var G__9723 = G__9712__9717;
            string__9714 = G__9722;
            G__9712__9715 = G__9723;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9718 = cljs.core.next.call(null, G__9708__9711);
      if(temp__3974__auto____9718) {
        var G__9708__9719 = temp__3974__auto____9718;
        var G__9724 = cljs.core.first.call(null, G__9708__9719);
        var G__9725 = G__9708__9719;
        obj__9710 = G__9724;
        G__9708__9711 = G__9725;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9701
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9727 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9727.append("\n");
  return[cljs.core.str(sb__9727)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9746__9747 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9746__9747) {
    var string__9748 = cljs.core.first.call(null, G__9746__9747);
    var G__9746__9749 = G__9746__9747;
    while(true) {
      cljs.core.string_print.call(null, string__9748);
      var temp__3974__auto____9750 = cljs.core.next.call(null, G__9746__9749);
      if(temp__3974__auto____9750) {
        var G__9746__9751 = temp__3974__auto____9750;
        var G__9764 = cljs.core.first.call(null, G__9746__9751);
        var G__9765 = G__9746__9751;
        string__9748 = G__9764;
        G__9746__9749 = G__9765;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9752__9753 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9752__9753) {
    var obj__9754 = cljs.core.first.call(null, G__9752__9753);
    var G__9752__9755 = G__9752__9753;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9756__9757 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9754, opts));
      if(G__9756__9757) {
        var string__9758 = cljs.core.first.call(null, G__9756__9757);
        var G__9756__9759 = G__9756__9757;
        while(true) {
          cljs.core.string_print.call(null, string__9758);
          var temp__3974__auto____9760 = cljs.core.next.call(null, G__9756__9759);
          if(temp__3974__auto____9760) {
            var G__9756__9761 = temp__3974__auto____9760;
            var G__9766 = cljs.core.first.call(null, G__9756__9761);
            var G__9767 = G__9756__9761;
            string__9758 = G__9766;
            G__9756__9759 = G__9767;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9762 = cljs.core.next.call(null, G__9752__9755);
      if(temp__3974__auto____9762) {
        var G__9752__9763 = temp__3974__auto____9762;
        var G__9768 = cljs.core.first.call(null, G__9752__9763);
        var G__9769 = G__9752__9763;
        obj__9754 = G__9768;
        G__9752__9755 = G__9769;
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
  pr_str.cljs$lang$applyTo = function(arglist__9770) {
    var objs = cljs.core.seq(arglist__9770);
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
  prn_str.cljs$lang$applyTo = function(arglist__9771) {
    var objs = cljs.core.seq(arglist__9771);
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
  pr.cljs$lang$applyTo = function(arglist__9772) {
    var objs = cljs.core.seq(arglist__9772);
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
  cljs_core_print.cljs$lang$applyTo = function(arglist__9773) {
    var objs = cljs.core.seq(arglist__9773);
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
  print_str.cljs$lang$applyTo = function(arglist__9774) {
    var objs = cljs.core.seq(arglist__9774);
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
  println.cljs$lang$applyTo = function(arglist__9775) {
    var objs = cljs.core.seq(arglist__9775);
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
  println_str.cljs$lang$applyTo = function(arglist__9776) {
    var objs = cljs.core.seq(arglist__9776);
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
  prn.cljs$lang$applyTo = function(arglist__9777) {
    var objs = cljs.core.seq(arglist__9777);
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
  printf.cljs$lang$applyTo = function(arglist__9778) {
    var fmt = cljs.core.first(arglist__9778);
    var args = cljs.core.rest(arglist__9778);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9779 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9779, "{", ", ", "}", opts, coll)
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
  var pr_pair__9780 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9780, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9781 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9781, "{", ", ", "}", opts, coll)
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
      var temp__3974__auto____9782 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____9782)) {
        var nspc__9783 = temp__3974__auto____9782;
        return[cljs.core.str(nspc__9783), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____9784 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____9784)) {
          var nspc__9785 = temp__3974__auto____9784;
          return[cljs.core.str(nspc__9785), cljs.core.str("/")].join("")
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
  var pr_pair__9786 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9786, "{", ", ", "}", opts, coll)
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
  var normalize__9788 = function(n, len) {
    var ns__9787 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9787) < len) {
        var G__9790 = [cljs.core.str("0"), cljs.core.str(ns__9787)].join("");
        ns__9787 = G__9790;
        continue
      }else {
        return ns__9787
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9788.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9788.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9788.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9788.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9788.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9788.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
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
  var pr_pair__9789 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9789, "{", ", ", "}", opts, coll)
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
  var this__9791 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9792 = this;
  var G__9793__9794 = cljs.core.seq.call(null, this__9792.watches);
  if(G__9793__9794) {
    var G__9796__9798 = cljs.core.first.call(null, G__9793__9794);
    var vec__9797__9799 = G__9796__9798;
    var key__9800 = cljs.core.nth.call(null, vec__9797__9799, 0, null);
    var f__9801 = cljs.core.nth.call(null, vec__9797__9799, 1, null);
    var G__9793__9802 = G__9793__9794;
    var G__9796__9803 = G__9796__9798;
    var G__9793__9804 = G__9793__9802;
    while(true) {
      var vec__9805__9806 = G__9796__9803;
      var key__9807 = cljs.core.nth.call(null, vec__9805__9806, 0, null);
      var f__9808 = cljs.core.nth.call(null, vec__9805__9806, 1, null);
      var G__9793__9809 = G__9793__9804;
      f__9808.call(null, key__9807, this$, oldval, newval);
      var temp__3974__auto____9810 = cljs.core.next.call(null, G__9793__9809);
      if(temp__3974__auto____9810) {
        var G__9793__9811 = temp__3974__auto____9810;
        var G__9818 = cljs.core.first.call(null, G__9793__9811);
        var G__9819 = G__9793__9811;
        G__9796__9803 = G__9818;
        G__9793__9804 = G__9819;
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
  var this__9812 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9812.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9813 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9813.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9814 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9814.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9815 = this;
  return this__9815.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9816 = this;
  return this__9816.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9817 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9831__delegate = function(x, p__9820) {
      var map__9826__9827 = p__9820;
      var map__9826__9828 = cljs.core.seq_QMARK_.call(null, map__9826__9827) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9826__9827) : map__9826__9827;
      var validator__9829 = cljs.core._lookup.call(null, map__9826__9828, "\ufdd0'validator", null);
      var meta__9830 = cljs.core._lookup.call(null, map__9826__9828, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9830, validator__9829, null)
    };
    var G__9831 = function(x, var_args) {
      var p__9820 = null;
      if(goog.isDef(var_args)) {
        p__9820 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9831__delegate.call(this, x, p__9820)
    };
    G__9831.cljs$lang$maxFixedArity = 1;
    G__9831.cljs$lang$applyTo = function(arglist__9832) {
      var x = cljs.core.first(arglist__9832);
      var p__9820 = cljs.core.rest(arglist__9832);
      return G__9831__delegate(x, p__9820)
    };
    G__9831.cljs$lang$arity$variadic = G__9831__delegate;
    return G__9831
  }();
  atom = function(x, var_args) {
    var p__9820 = var_args;
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
  var temp__3974__auto____9836 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9836)) {
    var validate__9837 = temp__3974__auto____9836;
    if(cljs.core.truth_(validate__9837.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__9838 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9838, new_value);
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
    var G__9839__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9839 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9839__delegate.call(this, a, f, x, y, z, more)
    };
    G__9839.cljs$lang$maxFixedArity = 5;
    G__9839.cljs$lang$applyTo = function(arglist__9840) {
      var a = cljs.core.first(arglist__9840);
      var f = cljs.core.first(cljs.core.next(arglist__9840));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9840)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9840))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9840)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9840)))));
      return G__9839__delegate(a, f, x, y, z, more)
    };
    G__9839.cljs$lang$arity$variadic = G__9839__delegate;
    return G__9839
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
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9841) {
    var iref = cljs.core.first(arglist__9841);
    var f = cljs.core.first(cljs.core.next(arglist__9841));
    var args = cljs.core.rest(cljs.core.next(arglist__9841));
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
  var this__9842 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9842.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9843 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9843.state, function(p__9844) {
    var map__9845__9846 = p__9844;
    var map__9845__9847 = cljs.core.seq_QMARK_.call(null, map__9845__9846) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9845__9846) : map__9845__9846;
    var curr_state__9848 = map__9845__9847;
    var done__9849 = cljs.core._lookup.call(null, map__9845__9847, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9849)) {
      return curr_state__9848
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9843.f.call(null)})
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
    var map__9870__9871 = options;
    var map__9870__9872 = cljs.core.seq_QMARK_.call(null, map__9870__9871) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9870__9871) : map__9870__9871;
    var keywordize_keys__9873 = cljs.core._lookup.call(null, map__9870__9872, "\ufdd0'keywordize-keys", null);
    var keyfn__9874 = cljs.core.truth_(keywordize_keys__9873) ? cljs.core.keyword : cljs.core.str;
    var f__9889 = function thisfn(x) {
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
                var iter__2490__auto____9888 = function iter__9882(s__9883) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9883__9886 = s__9883;
                    while(true) {
                      if(cljs.core.seq.call(null, s__9883__9886)) {
                        var k__9887 = cljs.core.first.call(null, s__9883__9886);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9874.call(null, k__9887), thisfn.call(null, x[k__9887])], true), iter__9882.call(null, cljs.core.rest.call(null, s__9883__9886)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2490__auto____9888.call(null, cljs.core.js_keys.call(null, x))
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
    return f__9889.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9890) {
    var x = cljs.core.first(arglist__9890);
    var options = cljs.core.rest(arglist__9890);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9895 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9899__delegate = function(args) {
      var temp__3971__auto____9896 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9895), args, null);
      if(cljs.core.truth_(temp__3971__auto____9896)) {
        var v__9897 = temp__3971__auto____9896;
        return v__9897
      }else {
        var ret__9898 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9895, cljs.core.assoc, args, ret__9898);
        return ret__9898
      }
    };
    var G__9899 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9899__delegate.call(this, args)
    };
    G__9899.cljs$lang$maxFixedArity = 0;
    G__9899.cljs$lang$applyTo = function(arglist__9900) {
      var args = cljs.core.seq(arglist__9900);
      return G__9899__delegate(args)
    };
    G__9899.cljs$lang$arity$variadic = G__9899__delegate;
    return G__9899
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9902 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9902)) {
        var G__9903 = ret__9902;
        f = G__9903;
        continue
      }else {
        return ret__9902
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9904__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9904 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9904__delegate.call(this, f, args)
    };
    G__9904.cljs$lang$maxFixedArity = 1;
    G__9904.cljs$lang$applyTo = function(arglist__9905) {
      var f = cljs.core.first(arglist__9905);
      var args = cljs.core.rest(arglist__9905);
      return G__9904__delegate(f, args)
    };
    G__9904.cljs$lang$arity$variadic = G__9904__delegate;
    return G__9904
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
    var k__9907 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9907, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9907, cljs.core.PersistentVector.EMPTY), x))
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
    var or__3824__auto____9916 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____9916) {
      return or__3824__auto____9916
    }else {
      var or__3824__auto____9917 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9917) {
        return or__3824__auto____9917
      }else {
        var and__3822__auto____9918 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____9918) {
          var and__3822__auto____9919 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____9919) {
            var and__3822__auto____9920 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____9920) {
              var ret__9921 = true;
              var i__9922 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9923 = cljs.core.not.call(null, ret__9921);
                  if(or__3824__auto____9923) {
                    return or__3824__auto____9923
                  }else {
                    return i__9922 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9921
                }else {
                  var G__9924 = isa_QMARK_.call(null, h, child.call(null, i__9922), parent.call(null, i__9922));
                  var G__9925 = i__9922 + 1;
                  ret__9921 = G__9924;
                  i__9922 = G__9925;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9920
            }
          }else {
            return and__3822__auto____9919
          }
        }else {
          return and__3822__auto____9918
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
    var tp__9934 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9935 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9936 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9937 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____9938 = cljs.core.contains_QMARK_.call(null, tp__9934.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9936.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9936.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9934, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9937.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9935, parent, ta__9936), "\ufdd0'descendants":tf__9937.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9936, tag, td__9935)})
    }();
    if(cljs.core.truth_(or__3824__auto____9938)) {
      return or__3824__auto____9938
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
    var parentMap__9943 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9944 = cljs.core.truth_(parentMap__9943.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9943.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9945 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9944)) ? cljs.core.assoc.call(null, parentMap__9943, tag, childsParents__9944) : cljs.core.dissoc.call(null, parentMap__9943, tag);
    var deriv_seq__9946 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9926_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9926_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9926_SHARP_), cljs.core.second.call(null, p1__9926_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9945)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9943.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9927_SHARP_, p2__9928_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9927_SHARP_, p2__9928_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9946))
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
  var xprefs__9954 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____9956 = cljs.core.truth_(function() {
    var and__3822__auto____9955 = xprefs__9954;
    if(cljs.core.truth_(and__3822__auto____9955)) {
      return xprefs__9954.call(null, y)
    }else {
      return and__3822__auto____9955
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____9956)) {
    return or__3824__auto____9956
  }else {
    var or__3824__auto____9958 = function() {
      var ps__9957 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9957) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9957), prefer_table))) {
          }else {
          }
          var G__9961 = cljs.core.rest.call(null, ps__9957);
          ps__9957 = G__9961;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____9958)) {
      return or__3824__auto____9958
    }else {
      var or__3824__auto____9960 = function() {
        var ps__9959 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9959) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9959), y, prefer_table))) {
            }else {
            }
            var G__9962 = cljs.core.rest.call(null, ps__9959);
            ps__9959 = G__9962;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____9960)) {
        return or__3824__auto____9960
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____9964 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____9964)) {
    return or__3824__auto____9964
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9982 = cljs.core.reduce.call(null, function(be, p__9974) {
    var vec__9975__9976 = p__9974;
    var k__9977 = cljs.core.nth.call(null, vec__9975__9976, 0, null);
    var ___9978 = cljs.core.nth.call(null, vec__9975__9976, 1, null);
    var e__9979 = vec__9975__9976;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9977)) {
      var be2__9981 = cljs.core.truth_(function() {
        var or__3824__auto____9980 = be == null;
        if(or__3824__auto____9980) {
          return or__3824__auto____9980
        }else {
          return cljs.core.dominates.call(null, k__9977, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9979 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9981), k__9977, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9977), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9981)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9981
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9982)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9982));
      return cljs.core.second.call(null, best_entry__9982)
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
    var and__3822__auto____9987 = mf;
    if(and__3822__auto____9987) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____9987
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2391__auto____9988 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9989 = cljs.core._reset[goog.typeOf(x__2391__auto____9988)];
      if(or__3824__auto____9989) {
        return or__3824__auto____9989
      }else {
        var or__3824__auto____9990 = cljs.core._reset["_"];
        if(or__3824__auto____9990) {
          return or__3824__auto____9990
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____9995 = mf;
    if(and__3822__auto____9995) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____9995
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2391__auto____9996 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____9997 = cljs.core._add_method[goog.typeOf(x__2391__auto____9996)];
      if(or__3824__auto____9997) {
        return or__3824__auto____9997
      }else {
        var or__3824__auto____9998 = cljs.core._add_method["_"];
        if(or__3824__auto____9998) {
          return or__3824__auto____9998
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10003 = mf;
    if(and__3822__auto____10003) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10003
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10004 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10005 = cljs.core._remove_method[goog.typeOf(x__2391__auto____10004)];
      if(or__3824__auto____10005) {
        return or__3824__auto____10005
      }else {
        var or__3824__auto____10006 = cljs.core._remove_method["_"];
        if(or__3824__auto____10006) {
          return or__3824__auto____10006
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10011 = mf;
    if(and__3822__auto____10011) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10011
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2391__auto____10012 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10013 = cljs.core._prefer_method[goog.typeOf(x__2391__auto____10012)];
      if(or__3824__auto____10013) {
        return or__3824__auto____10013
      }else {
        var or__3824__auto____10014 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10014) {
          return or__3824__auto____10014
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10019 = mf;
    if(and__3822__auto____10019) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10019
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10020 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10021 = cljs.core._get_method[goog.typeOf(x__2391__auto____10020)];
      if(or__3824__auto____10021) {
        return or__3824__auto____10021
      }else {
        var or__3824__auto____10022 = cljs.core._get_method["_"];
        if(or__3824__auto____10022) {
          return or__3824__auto____10022
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10027 = mf;
    if(and__3822__auto____10027) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10027
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2391__auto____10028 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10029 = cljs.core._methods[goog.typeOf(x__2391__auto____10028)];
      if(or__3824__auto____10029) {
        return or__3824__auto____10029
      }else {
        var or__3824__auto____10030 = cljs.core._methods["_"];
        if(or__3824__auto____10030) {
          return or__3824__auto____10030
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10035 = mf;
    if(and__3822__auto____10035) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10035
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2391__auto____10036 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10037 = cljs.core._prefers[goog.typeOf(x__2391__auto____10036)];
      if(or__3824__auto____10037) {
        return or__3824__auto____10037
      }else {
        var or__3824__auto____10038 = cljs.core._prefers["_"];
        if(or__3824__auto____10038) {
          return or__3824__auto____10038
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10043 = mf;
    if(and__3822__auto____10043) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10043
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2391__auto____10044 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10045 = cljs.core._dispatch[goog.typeOf(x__2391__auto____10044)];
      if(or__3824__auto____10045) {
        return or__3824__auto____10045
      }else {
        var or__3824__auto____10046 = cljs.core._dispatch["_"];
        if(or__3824__auto____10046) {
          return or__3824__auto____10046
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10049 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10050 = cljs.core._get_method.call(null, mf, dispatch_val__10049);
  if(cljs.core.truth_(target_fn__10050)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10049)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10050, args)
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
  var this__10051 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10052 = this;
  cljs.core.swap_BANG_.call(null, this__10052.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10052.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10052.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10052.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10053 = this;
  cljs.core.swap_BANG_.call(null, this__10053.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10053.method_cache, this__10053.method_table, this__10053.cached_hierarchy, this__10053.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10054 = this;
  cljs.core.swap_BANG_.call(null, this__10054.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10054.method_cache, this__10054.method_table, this__10054.cached_hierarchy, this__10054.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10055 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10055.cached_hierarchy), cljs.core.deref.call(null, this__10055.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10055.method_cache, this__10055.method_table, this__10055.cached_hierarchy, this__10055.hierarchy)
  }
  var temp__3971__auto____10056 = cljs.core.deref.call(null, this__10055.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10056)) {
    var target_fn__10057 = temp__3971__auto____10056;
    return target_fn__10057
  }else {
    var temp__3971__auto____10058 = cljs.core.find_and_cache_best_method.call(null, this__10055.name, dispatch_val, this__10055.hierarchy, this__10055.method_table, this__10055.prefer_table, this__10055.method_cache, this__10055.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10058)) {
      var target_fn__10059 = temp__3971__auto____10058;
      return target_fn__10059
    }else {
      return cljs.core.deref.call(null, this__10055.method_table).call(null, this__10055.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10060 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10060.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10060.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10060.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10060.method_cache, this__10060.method_table, this__10060.cached_hierarchy, this__10060.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10061 = this;
  return cljs.core.deref.call(null, this__10061.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10062 = this;
  return cljs.core.deref.call(null, this__10062.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10063 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10063.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10065__delegate = function(_, args) {
    var self__10064 = this;
    return cljs.core._dispatch.call(null, self__10064, args)
  };
  var G__10065 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10065__delegate.call(this, _, args)
  };
  G__10065.cljs$lang$maxFixedArity = 1;
  G__10065.cljs$lang$applyTo = function(arglist__10066) {
    var _ = cljs.core.first(arglist__10066);
    var args = cljs.core.rest(arglist__10066);
    return G__10065__delegate(_, args)
  };
  G__10065.cljs$lang$arity$variadic = G__10065__delegate;
  return G__10065
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10067 = this;
  return cljs.core._dispatch.call(null, self__10067, args)
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
  var this__10068 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10070, _) {
  var this__10069 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10069.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10071 = this;
  var and__3822__auto____10072 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10072) {
    return this__10071.uuid === other.uuid
  }else {
    return and__3822__auto____10072
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10073 = this;
  var this__10074 = this;
  return cljs.core.pr_str.call(null, this__10074)
};
cljs.core.UUID;
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
goog.provide("client.core");
goog.require("cljs.core");
goog.require("vertx");
client.core.mainEveneHandller = function mainEveneHandller(event) {
  return cljs.core.List.EMPTY
};
client.core.main = function main() {
  var eb__6132 = new vertx.EventBus;
  var G__6133__6134 = eb__6132;
  G__6133__6134.open(function() {
    return cljs.core.List.EMPTY
  });
  G__6133__6134;
  return eb__6132
};
goog.exportSymbol("client.core.main", client.core.main);
