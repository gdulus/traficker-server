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
  var x__6184 = x == null ? null : x;
  if(p[goog.typeOf(x__6184)]) {
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
    return make_array.cljs$lang$arity$1(size)
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
    var G__6185__delegate = function(array, i, idxs) {
      return cljs.core.apply.cljs$lang$arity$3(aget, aget.cljs$lang$arity$2(array, i), idxs)
    };
    var G__6185 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6185__delegate.call(this, array, i, idxs)
    };
    G__6185.cljs$lang$maxFixedArity = 2;
    G__6185.cljs$lang$applyTo = function(arglist__6186) {
      var array = cljs.core.first(arglist__6186);
      var i = cljs.core.first(cljs.core.next(arglist__6186));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6186));
      return G__6185__delegate(array, i, idxs)
    };
    G__6185.cljs$lang$arity$variadic = G__6185__delegate;
    return G__6185
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
    return into_array.cljs$lang$arity$2(null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.cljs$lang$arity$3(function(a, x) {
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
      var and__3822__auto____6271 = this$;
      if(and__3822__auto____6271) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6271
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6275 = this$;
      if(and__3822__auto____6275) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6275
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6279 = this$;
      if(and__3822__auto____6279) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6279
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6283 = this$;
      if(and__3822__auto____6283) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6283
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6287 = this$;
      if(and__3822__auto____6287) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6287
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6291 = this$;
      if(and__3822__auto____6291) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6291
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6295 = this$;
      if(and__3822__auto____6295) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6295
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6299 = this$;
      if(and__3822__auto____6299) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6299
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6303 = this$;
      if(and__3822__auto____6303) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6303
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
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
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6307 = this$;
      if(and__3822__auto____6307) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6307
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2391__auto____6308 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6309 = cljs.core._invoke[goog.typeOf(x__2391__auto____6308)];
        if(or__3824__auto____6309) {
          return or__3824__auto____6309
        }else {
          var or__3824__auto____6310 = cljs.core._invoke["_"];
          if(or__3824__auto____6310) {
            return or__3824__auto____6310
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6311 = this$;
      if(and__3822__auto____6311) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6311
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2391__auto____6312 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6313 = cljs.core._invoke[goog.typeOf(x__2391__auto____6312)];
        if(or__3824__auto____6313) {
          return or__3824__auto____6313
        }else {
          var or__3824__auto____6314 = cljs.core._invoke["_"];
          if(or__3824__auto____6314) {
            return or__3824__auto____6314
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6315 = this$;
      if(and__3822__auto____6315) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6315
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2391__auto____6316 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6317 = cljs.core._invoke[goog.typeOf(x__2391__auto____6316)];
        if(or__3824__auto____6317) {
          return or__3824__auto____6317
        }else {
          var or__3824__auto____6318 = cljs.core._invoke["_"];
          if(or__3824__auto____6318) {
            return or__3824__auto____6318
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6319 = this$;
      if(and__3822__auto____6319) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6319
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2391__auto____6320 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6321 = cljs.core._invoke[goog.typeOf(x__2391__auto____6320)];
        if(or__3824__auto____6321) {
          return or__3824__auto____6321
        }else {
          var or__3824__auto____6322 = cljs.core._invoke["_"];
          if(or__3824__auto____6322) {
            return or__3824__auto____6322
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6323 = this$;
      if(and__3822__auto____6323) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6323
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2391__auto____6324 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6325 = cljs.core._invoke[goog.typeOf(x__2391__auto____6324)];
        if(or__3824__auto____6325) {
          return or__3824__auto____6325
        }else {
          var or__3824__auto____6326 = cljs.core._invoke["_"];
          if(or__3824__auto____6326) {
            return or__3824__auto____6326
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6327 = this$;
      if(and__3822__auto____6327) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6327
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2391__auto____6328 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6329 = cljs.core._invoke[goog.typeOf(x__2391__auto____6328)];
        if(or__3824__auto____6329) {
          return or__3824__auto____6329
        }else {
          var or__3824__auto____6330 = cljs.core._invoke["_"];
          if(or__3824__auto____6330) {
            return or__3824__auto____6330
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6331 = this$;
      if(and__3822__auto____6331) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6331
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2391__auto____6332 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6333 = cljs.core._invoke[goog.typeOf(x__2391__auto____6332)];
        if(or__3824__auto____6333) {
          return or__3824__auto____6333
        }else {
          var or__3824__auto____6334 = cljs.core._invoke["_"];
          if(or__3824__auto____6334) {
            return or__3824__auto____6334
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6335 = this$;
      if(and__3822__auto____6335) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6335
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2391__auto____6336 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6337 = cljs.core._invoke[goog.typeOf(x__2391__auto____6336)];
        if(or__3824__auto____6337) {
          return or__3824__auto____6337
        }else {
          var or__3824__auto____6338 = cljs.core._invoke["_"];
          if(or__3824__auto____6338) {
            return or__3824__auto____6338
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6339 = this$;
      if(and__3822__auto____6339) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6339
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2391__auto____6340 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6341 = cljs.core._invoke[goog.typeOf(x__2391__auto____6340)];
        if(or__3824__auto____6341) {
          return or__3824__auto____6341
        }else {
          var or__3824__auto____6342 = cljs.core._invoke["_"];
          if(or__3824__auto____6342) {
            return or__3824__auto____6342
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6343 = this$;
      if(and__3822__auto____6343) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6343
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2391__auto____6344 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6345 = cljs.core._invoke[goog.typeOf(x__2391__auto____6344)];
        if(or__3824__auto____6345) {
          return or__3824__auto____6345
        }else {
          var or__3824__auto____6346 = cljs.core._invoke["_"];
          if(or__3824__auto____6346) {
            return or__3824__auto____6346
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6347 = this$;
      if(and__3822__auto____6347) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6347
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2391__auto____6348 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6349 = cljs.core._invoke[goog.typeOf(x__2391__auto____6348)];
        if(or__3824__auto____6349) {
          return or__3824__auto____6349
        }else {
          var or__3824__auto____6350 = cljs.core._invoke["_"];
          if(or__3824__auto____6350) {
            return or__3824__auto____6350
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6351 = this$;
      if(and__3822__auto____6351) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6351
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2391__auto____6352 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6353 = cljs.core._invoke[goog.typeOf(x__2391__auto____6352)];
        if(or__3824__auto____6353) {
          return or__3824__auto____6353
        }else {
          var or__3824__auto____6354 = cljs.core._invoke["_"];
          if(or__3824__auto____6354) {
            return or__3824__auto____6354
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
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
    var and__3822__auto____6359 = coll;
    if(and__3822__auto____6359) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6359
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2391__auto____6360 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6361 = cljs.core._count[goog.typeOf(x__2391__auto____6360)];
      if(or__3824__auto____6361) {
        return or__3824__auto____6361
      }else {
        var or__3824__auto____6362 = cljs.core._count["_"];
        if(or__3824__auto____6362) {
          return or__3824__auto____6362
        }else {
          throw cljs.core.missing_protocol("ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6367 = coll;
    if(and__3822__auto____6367) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6367
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2391__auto____6368 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6369 = cljs.core._empty[goog.typeOf(x__2391__auto____6368)];
      if(or__3824__auto____6369) {
        return or__3824__auto____6369
      }else {
        var or__3824__auto____6370 = cljs.core._empty["_"];
        if(or__3824__auto____6370) {
          return or__3824__auto____6370
        }else {
          throw cljs.core.missing_protocol("IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6375 = coll;
    if(and__3822__auto____6375) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6375
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2391__auto____6376 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6377 = cljs.core._conj[goog.typeOf(x__2391__auto____6376)];
      if(or__3824__auto____6377) {
        return or__3824__auto____6377
      }else {
        var or__3824__auto____6378 = cljs.core._conj["_"];
        if(or__3824__auto____6378) {
          return or__3824__auto____6378
        }else {
          throw cljs.core.missing_protocol("ICollection.-conj", coll);
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
      var and__3822__auto____6387 = coll;
      if(and__3822__auto____6387) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6387
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2391__auto____6388 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6389 = cljs.core._nth[goog.typeOf(x__2391__auto____6388)];
        if(or__3824__auto____6389) {
          return or__3824__auto____6389
        }else {
          var or__3824__auto____6390 = cljs.core._nth["_"];
          if(or__3824__auto____6390) {
            return or__3824__auto____6390
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6391 = coll;
      if(and__3822__auto____6391) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6391
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2391__auto____6392 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6393 = cljs.core._nth[goog.typeOf(x__2391__auto____6392)];
        if(or__3824__auto____6393) {
          return or__3824__auto____6393
        }else {
          var or__3824__auto____6394 = cljs.core._nth["_"];
          if(or__3824__auto____6394) {
            return or__3824__auto____6394
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
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
    var and__3822__auto____6399 = coll;
    if(and__3822__auto____6399) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6399
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2391__auto____6400 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6401 = cljs.core._first[goog.typeOf(x__2391__auto____6400)];
      if(or__3824__auto____6401) {
        return or__3824__auto____6401
      }else {
        var or__3824__auto____6402 = cljs.core._first["_"];
        if(or__3824__auto____6402) {
          return or__3824__auto____6402
        }else {
          throw cljs.core.missing_protocol("ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6407 = coll;
    if(and__3822__auto____6407) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6407
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2391__auto____6408 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6409 = cljs.core._rest[goog.typeOf(x__2391__auto____6408)];
      if(or__3824__auto____6409) {
        return or__3824__auto____6409
      }else {
        var or__3824__auto____6410 = cljs.core._rest["_"];
        if(or__3824__auto____6410) {
          return or__3824__auto____6410
        }else {
          throw cljs.core.missing_protocol("ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6415 = coll;
    if(and__3822__auto____6415) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6415
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2391__auto____6416 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6417 = cljs.core._next[goog.typeOf(x__2391__auto____6416)];
      if(or__3824__auto____6417) {
        return or__3824__auto____6417
      }else {
        var or__3824__auto____6418 = cljs.core._next["_"];
        if(or__3824__auto____6418) {
          return or__3824__auto____6418
        }else {
          throw cljs.core.missing_protocol("INext.-next", coll);
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
      var and__3822__auto____6427 = o;
      if(and__3822__auto____6427) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6427
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2391__auto____6428 = o == null ? null : o;
      return function() {
        var or__3824__auto____6429 = cljs.core._lookup[goog.typeOf(x__2391__auto____6428)];
        if(or__3824__auto____6429) {
          return or__3824__auto____6429
        }else {
          var or__3824__auto____6430 = cljs.core._lookup["_"];
          if(or__3824__auto____6430) {
            return or__3824__auto____6430
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6431 = o;
      if(and__3822__auto____6431) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6431
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2391__auto____6432 = o == null ? null : o;
      return function() {
        var or__3824__auto____6433 = cljs.core._lookup[goog.typeOf(x__2391__auto____6432)];
        if(or__3824__auto____6433) {
          return or__3824__auto____6433
        }else {
          var or__3824__auto____6434 = cljs.core._lookup["_"];
          if(or__3824__auto____6434) {
            return or__3824__auto____6434
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
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
    var and__3822__auto____6439 = coll;
    if(and__3822__auto____6439) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6439
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2391__auto____6440 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6441 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2391__auto____6440)];
      if(or__3824__auto____6441) {
        return or__3824__auto____6441
      }else {
        var or__3824__auto____6442 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6442) {
          return or__3824__auto____6442
        }else {
          throw cljs.core.missing_protocol("IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6447 = coll;
    if(and__3822__auto____6447) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6447
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2391__auto____6448 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6449 = cljs.core._assoc[goog.typeOf(x__2391__auto____6448)];
      if(or__3824__auto____6449) {
        return or__3824__auto____6449
      }else {
        var or__3824__auto____6450 = cljs.core._assoc["_"];
        if(or__3824__auto____6450) {
          return or__3824__auto____6450
        }else {
          throw cljs.core.missing_protocol("IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6455 = coll;
    if(and__3822__auto____6455) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6455
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2391__auto____6456 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6457 = cljs.core._dissoc[goog.typeOf(x__2391__auto____6456)];
      if(or__3824__auto____6457) {
        return or__3824__auto____6457
      }else {
        var or__3824__auto____6458 = cljs.core._dissoc["_"];
        if(or__3824__auto____6458) {
          return or__3824__auto____6458
        }else {
          throw cljs.core.missing_protocol("IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6463 = coll;
    if(and__3822__auto____6463) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6463
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2391__auto____6464 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6465 = cljs.core._key[goog.typeOf(x__2391__auto____6464)];
      if(or__3824__auto____6465) {
        return or__3824__auto____6465
      }else {
        var or__3824__auto____6466 = cljs.core._key["_"];
        if(or__3824__auto____6466) {
          return or__3824__auto____6466
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6471 = coll;
    if(and__3822__auto____6471) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6471
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2391__auto____6472 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6473 = cljs.core._val[goog.typeOf(x__2391__auto____6472)];
      if(or__3824__auto____6473) {
        return or__3824__auto____6473
      }else {
        var or__3824__auto____6474 = cljs.core._val["_"];
        if(or__3824__auto____6474) {
          return or__3824__auto____6474
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6479 = coll;
    if(and__3822__auto____6479) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6479
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2391__auto____6480 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6481 = cljs.core._disjoin[goog.typeOf(x__2391__auto____6480)];
      if(or__3824__auto____6481) {
        return or__3824__auto____6481
      }else {
        var or__3824__auto____6482 = cljs.core._disjoin["_"];
        if(or__3824__auto____6482) {
          return or__3824__auto____6482
        }else {
          throw cljs.core.missing_protocol("ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6487 = coll;
    if(and__3822__auto____6487) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6487
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2391__auto____6488 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6489 = cljs.core._peek[goog.typeOf(x__2391__auto____6488)];
      if(or__3824__auto____6489) {
        return or__3824__auto____6489
      }else {
        var or__3824__auto____6490 = cljs.core._peek["_"];
        if(or__3824__auto____6490) {
          return or__3824__auto____6490
        }else {
          throw cljs.core.missing_protocol("IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6495 = coll;
    if(and__3822__auto____6495) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6495
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2391__auto____6496 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6497 = cljs.core._pop[goog.typeOf(x__2391__auto____6496)];
      if(or__3824__auto____6497) {
        return or__3824__auto____6497
      }else {
        var or__3824__auto____6498 = cljs.core._pop["_"];
        if(or__3824__auto____6498) {
          return or__3824__auto____6498
        }else {
          throw cljs.core.missing_protocol("IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6503 = coll;
    if(and__3822__auto____6503) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6503
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2391__auto____6504 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6505 = cljs.core._assoc_n[goog.typeOf(x__2391__auto____6504)];
      if(or__3824__auto____6505) {
        return or__3824__auto____6505
      }else {
        var or__3824__auto____6506 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6506) {
          return or__3824__auto____6506
        }else {
          throw cljs.core.missing_protocol("IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6511 = o;
    if(and__3822__auto____6511) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6511
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2391__auto____6512 = o == null ? null : o;
    return function() {
      var or__3824__auto____6513 = cljs.core._deref[goog.typeOf(x__2391__auto____6512)];
      if(or__3824__auto____6513) {
        return or__3824__auto____6513
      }else {
        var or__3824__auto____6514 = cljs.core._deref["_"];
        if(or__3824__auto____6514) {
          return or__3824__auto____6514
        }else {
          throw cljs.core.missing_protocol("IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6519 = o;
    if(and__3822__auto____6519) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6519
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2391__auto____6520 = o == null ? null : o;
    return function() {
      var or__3824__auto____6521 = cljs.core._deref_with_timeout[goog.typeOf(x__2391__auto____6520)];
      if(or__3824__auto____6521) {
        return or__3824__auto____6521
      }else {
        var or__3824__auto____6522 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6522) {
          return or__3824__auto____6522
        }else {
          throw cljs.core.missing_protocol("IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6527 = o;
    if(and__3822__auto____6527) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6527
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2391__auto____6528 = o == null ? null : o;
    return function() {
      var or__3824__auto____6529 = cljs.core._meta[goog.typeOf(x__2391__auto____6528)];
      if(or__3824__auto____6529) {
        return or__3824__auto____6529
      }else {
        var or__3824__auto____6530 = cljs.core._meta["_"];
        if(or__3824__auto____6530) {
          return or__3824__auto____6530
        }else {
          throw cljs.core.missing_protocol("IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6535 = o;
    if(and__3822__auto____6535) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6535
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2391__auto____6536 = o == null ? null : o;
    return function() {
      var or__3824__auto____6537 = cljs.core._with_meta[goog.typeOf(x__2391__auto____6536)];
      if(or__3824__auto____6537) {
        return or__3824__auto____6537
      }else {
        var or__3824__auto____6538 = cljs.core._with_meta["_"];
        if(or__3824__auto____6538) {
          return or__3824__auto____6538
        }else {
          throw cljs.core.missing_protocol("IWithMeta.-with-meta", o);
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
      var and__3822__auto____6547 = coll;
      if(and__3822__auto____6547) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6547
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2391__auto____6548 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6549 = cljs.core._reduce[goog.typeOf(x__2391__auto____6548)];
        if(or__3824__auto____6549) {
          return or__3824__auto____6549
        }else {
          var or__3824__auto____6550 = cljs.core._reduce["_"];
          if(or__3824__auto____6550) {
            return or__3824__auto____6550
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6551 = coll;
      if(and__3822__auto____6551) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6551
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2391__auto____6552 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6553 = cljs.core._reduce[goog.typeOf(x__2391__auto____6552)];
        if(or__3824__auto____6553) {
          return or__3824__auto____6553
        }else {
          var or__3824__auto____6554 = cljs.core._reduce["_"];
          if(or__3824__auto____6554) {
            return or__3824__auto____6554
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
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
    var and__3822__auto____6559 = coll;
    if(and__3822__auto____6559) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6559
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2391__auto____6560 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6561 = cljs.core._kv_reduce[goog.typeOf(x__2391__auto____6560)];
      if(or__3824__auto____6561) {
        return or__3824__auto____6561
      }else {
        var or__3824__auto____6562 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6562) {
          return or__3824__auto____6562
        }else {
          throw cljs.core.missing_protocol("IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6567 = o;
    if(and__3822__auto____6567) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6567
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2391__auto____6568 = o == null ? null : o;
    return function() {
      var or__3824__auto____6569 = cljs.core._equiv[goog.typeOf(x__2391__auto____6568)];
      if(or__3824__auto____6569) {
        return or__3824__auto____6569
      }else {
        var or__3824__auto____6570 = cljs.core._equiv["_"];
        if(or__3824__auto____6570) {
          return or__3824__auto____6570
        }else {
          throw cljs.core.missing_protocol("IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6575 = o;
    if(and__3822__auto____6575) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6575
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2391__auto____6576 = o == null ? null : o;
    return function() {
      var or__3824__auto____6577 = cljs.core._hash[goog.typeOf(x__2391__auto____6576)];
      if(or__3824__auto____6577) {
        return or__3824__auto____6577
      }else {
        var or__3824__auto____6578 = cljs.core._hash["_"];
        if(or__3824__auto____6578) {
          return or__3824__auto____6578
        }else {
          throw cljs.core.missing_protocol("IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6583 = o;
    if(and__3822__auto____6583) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6583
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2391__auto____6584 = o == null ? null : o;
    return function() {
      var or__3824__auto____6585 = cljs.core._seq[goog.typeOf(x__2391__auto____6584)];
      if(or__3824__auto____6585) {
        return or__3824__auto____6585
      }else {
        var or__3824__auto____6586 = cljs.core._seq["_"];
        if(or__3824__auto____6586) {
          return or__3824__auto____6586
        }else {
          throw cljs.core.missing_protocol("ISeqable.-seq", o);
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
    var and__3822__auto____6591 = coll;
    if(and__3822__auto____6591) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6591
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2391__auto____6592 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6593 = cljs.core._rseq[goog.typeOf(x__2391__auto____6592)];
      if(or__3824__auto____6593) {
        return or__3824__auto____6593
      }else {
        var or__3824__auto____6594 = cljs.core._rseq["_"];
        if(or__3824__auto____6594) {
          return or__3824__auto____6594
        }else {
          throw cljs.core.missing_protocol("IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6599 = coll;
    if(and__3822__auto____6599) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6599
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2391__auto____6600 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6601 = cljs.core._sorted_seq[goog.typeOf(x__2391__auto____6600)];
      if(or__3824__auto____6601) {
        return or__3824__auto____6601
      }else {
        var or__3824__auto____6602 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6602) {
          return or__3824__auto____6602
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6607 = coll;
    if(and__3822__auto____6607) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6607
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2391__auto____6608 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6609 = cljs.core._sorted_seq_from[goog.typeOf(x__2391__auto____6608)];
      if(or__3824__auto____6609) {
        return or__3824__auto____6609
      }else {
        var or__3824__auto____6610 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6610) {
          return or__3824__auto____6610
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6615 = coll;
    if(and__3822__auto____6615) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6615
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2391__auto____6616 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6617 = cljs.core._entry_key[goog.typeOf(x__2391__auto____6616)];
      if(or__3824__auto____6617) {
        return or__3824__auto____6617
      }else {
        var or__3824__auto____6618 = cljs.core._entry_key["_"];
        if(or__3824__auto____6618) {
          return or__3824__auto____6618
        }else {
          throw cljs.core.missing_protocol("ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6623 = coll;
    if(and__3822__auto____6623) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6623
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2391__auto____6624 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6625 = cljs.core._comparator[goog.typeOf(x__2391__auto____6624)];
      if(or__3824__auto____6625) {
        return or__3824__auto____6625
      }else {
        var or__3824__auto____6626 = cljs.core._comparator["_"];
        if(or__3824__auto____6626) {
          return or__3824__auto____6626
        }else {
          throw cljs.core.missing_protocol("ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6631 = o;
    if(and__3822__auto____6631) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6631
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2391__auto____6632 = o == null ? null : o;
    return function() {
      var or__3824__auto____6633 = cljs.core._pr_seq[goog.typeOf(x__2391__auto____6632)];
      if(or__3824__auto____6633) {
        return or__3824__auto____6633
      }else {
        var or__3824__auto____6634 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6634) {
          return or__3824__auto____6634
        }else {
          throw cljs.core.missing_protocol("IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6639 = d;
    if(and__3822__auto____6639) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6639
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2391__auto____6640 = d == null ? null : d;
    return function() {
      var or__3824__auto____6641 = cljs.core._realized_QMARK_[goog.typeOf(x__2391__auto____6640)];
      if(or__3824__auto____6641) {
        return or__3824__auto____6641
      }else {
        var or__3824__auto____6642 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6642) {
          return or__3824__auto____6642
        }else {
          throw cljs.core.missing_protocol("IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6647 = this$;
    if(and__3822__auto____6647) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6647
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2391__auto____6648 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6649 = cljs.core._notify_watches[goog.typeOf(x__2391__auto____6648)];
      if(or__3824__auto____6649) {
        return or__3824__auto____6649
      }else {
        var or__3824__auto____6650 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6650) {
          return or__3824__auto____6650
        }else {
          throw cljs.core.missing_protocol("IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6655 = this$;
    if(and__3822__auto____6655) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6655
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2391__auto____6656 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6657 = cljs.core._add_watch[goog.typeOf(x__2391__auto____6656)];
      if(or__3824__auto____6657) {
        return or__3824__auto____6657
      }else {
        var or__3824__auto____6658 = cljs.core._add_watch["_"];
        if(or__3824__auto____6658) {
          return or__3824__auto____6658
        }else {
          throw cljs.core.missing_protocol("IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6663 = this$;
    if(and__3822__auto____6663) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6663
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2391__auto____6664 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6665 = cljs.core._remove_watch[goog.typeOf(x__2391__auto____6664)];
      if(or__3824__auto____6665) {
        return or__3824__auto____6665
      }else {
        var or__3824__auto____6666 = cljs.core._remove_watch["_"];
        if(or__3824__auto____6666) {
          return or__3824__auto____6666
        }else {
          throw cljs.core.missing_protocol("IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____6671 = coll;
    if(and__3822__auto____6671) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____6671
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2391__auto____6672 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6673 = cljs.core._as_transient[goog.typeOf(x__2391__auto____6672)];
      if(or__3824__auto____6673) {
        return or__3824__auto____6673
      }else {
        var or__3824__auto____6674 = cljs.core._as_transient["_"];
        if(or__3824__auto____6674) {
          return or__3824__auto____6674
        }else {
          throw cljs.core.missing_protocol("IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____6679 = tcoll;
    if(and__3822__auto____6679) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____6679
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2391__auto____6680 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6681 = cljs.core._conj_BANG_[goog.typeOf(x__2391__auto____6680)];
      if(or__3824__auto____6681) {
        return or__3824__auto____6681
      }else {
        var or__3824__auto____6682 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____6682) {
          return or__3824__auto____6682
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6687 = tcoll;
    if(and__3822__auto____6687) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____6687
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6688 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6689 = cljs.core._persistent_BANG_[goog.typeOf(x__2391__auto____6688)];
      if(or__3824__auto____6689) {
        return or__3824__auto____6689
      }else {
        var or__3824__auto____6690 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____6690) {
          return or__3824__auto____6690
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____6695 = tcoll;
    if(and__3822__auto____6695) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____6695
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2391__auto____6696 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6697 = cljs.core._assoc_BANG_[goog.typeOf(x__2391__auto____6696)];
      if(or__3824__auto____6697) {
        return or__3824__auto____6697
      }else {
        var or__3824__auto____6698 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____6698) {
          return or__3824__auto____6698
        }else {
          throw cljs.core.missing_protocol("ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____6703 = tcoll;
    if(and__3822__auto____6703) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____6703
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2391__auto____6704 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6705 = cljs.core._dissoc_BANG_[goog.typeOf(x__2391__auto____6704)];
      if(or__3824__auto____6705) {
        return or__3824__auto____6705
      }else {
        var or__3824__auto____6706 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____6706) {
          return or__3824__auto____6706
        }else {
          throw cljs.core.missing_protocol("ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____6711 = tcoll;
    if(and__3822__auto____6711) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____6711
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2391__auto____6712 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6713 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2391__auto____6712)];
      if(or__3824__auto____6713) {
        return or__3824__auto____6713
      }else {
        var or__3824__auto____6714 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____6714) {
          return or__3824__auto____6714
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____6719 = tcoll;
    if(and__3822__auto____6719) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____6719
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2391__auto____6720 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6721 = cljs.core._pop_BANG_[goog.typeOf(x__2391__auto____6720)];
      if(or__3824__auto____6721) {
        return or__3824__auto____6721
      }else {
        var or__3824__auto____6722 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____6722) {
          return or__3824__auto____6722
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____6727 = tcoll;
    if(and__3822__auto____6727) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____6727
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2391__auto____6728 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____6729 = cljs.core._disjoin_BANG_[goog.typeOf(x__2391__auto____6728)];
      if(or__3824__auto____6729) {
        return or__3824__auto____6729
      }else {
        var or__3824__auto____6730 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____6730) {
          return or__3824__auto____6730
        }else {
          throw cljs.core.missing_protocol("ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____6735 = x;
    if(and__3822__auto____6735) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____6735
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2391__auto____6736 = x == null ? null : x;
    return function() {
      var or__3824__auto____6737 = cljs.core._compare[goog.typeOf(x__2391__auto____6736)];
      if(or__3824__auto____6737) {
        return or__3824__auto____6737
      }else {
        var or__3824__auto____6738 = cljs.core._compare["_"];
        if(or__3824__auto____6738) {
          return or__3824__auto____6738
        }else {
          throw cljs.core.missing_protocol("IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____6743 = coll;
    if(and__3822__auto____6743) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____6743
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2391__auto____6744 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6745 = cljs.core._drop_first[goog.typeOf(x__2391__auto____6744)];
      if(or__3824__auto____6745) {
        return or__3824__auto____6745
      }else {
        var or__3824__auto____6746 = cljs.core._drop_first["_"];
        if(or__3824__auto____6746) {
          return or__3824__auto____6746
        }else {
          throw cljs.core.missing_protocol("IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____6751 = coll;
    if(and__3822__auto____6751) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____6751
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2391__auto____6752 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6753 = cljs.core._chunked_first[goog.typeOf(x__2391__auto____6752)];
      if(or__3824__auto____6753) {
        return or__3824__auto____6753
      }else {
        var or__3824__auto____6754 = cljs.core._chunked_first["_"];
        if(or__3824__auto____6754) {
          return or__3824__auto____6754
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____6759 = coll;
    if(and__3822__auto____6759) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____6759
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2391__auto____6760 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6761 = cljs.core._chunked_rest[goog.typeOf(x__2391__auto____6760)];
      if(or__3824__auto____6761) {
        return or__3824__auto____6761
      }else {
        var or__3824__auto____6762 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____6762) {
          return or__3824__auto____6762
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____6767 = coll;
    if(and__3822__auto____6767) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____6767
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2391__auto____6768 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6769 = cljs.core._chunked_next[goog.typeOf(x__2391__auto____6768)];
      if(or__3824__auto____6769) {
        return or__3824__auto____6769
      }else {
        var or__3824__auto____6770 = cljs.core._chunked_next["_"];
        if(or__3824__auto____6770) {
          return or__3824__auto____6770
        }else {
          throw cljs.core.missing_protocol("IChunkedNext.-chunked-next", coll);
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
    var or__3824__auto____6772 = x === y;
    if(or__3824__auto____6772) {
      return or__3824__auto____6772
    }else {
      return cljs.core._equiv(x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6773__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.cljs$lang$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__6774 = y;
            var G__6775 = cljs.core.first(more);
            var G__6776 = cljs.core.next(more);
            x = G__6774;
            y = G__6775;
            more = G__6776;
            continue
          }else {
            return _EQ_.cljs$lang$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6773 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6773__delegate.call(this, x, y, more)
    };
    G__6773.cljs$lang$maxFixedArity = 2;
    G__6773.cljs$lang$applyTo = function(arglist__6777) {
      var x = cljs.core.first(arglist__6777);
      var y = cljs.core.first(cljs.core.next(arglist__6777));
      var more = cljs.core.rest(cljs.core.next(arglist__6777));
      return G__6773__delegate(x, y, more)
    };
    G__6773.cljs$lang$arity$variadic = G__6773__delegate;
    return G__6773
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
  var G__6778 = null;
  var G__6778__2 = function(o, k) {
    return null
  };
  var G__6778__3 = function(o, k, not_found) {
    return not_found
  };
  G__6778 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6778__2.call(this, o, k);
      case 3:
        return G__6778__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6778
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.cljs$lang$arity$variadic(cljs.core.array_seq([k, v], 0))
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.cljs$lang$arity$1(o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6779 = null;
  var G__6779__2 = function(_, f) {
    return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
  };
  var G__6779__3 = function(_, f, start) {
    return start
  };
  G__6779 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6779__2.call(this, _, f);
      case 3:
        return G__6779__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6779
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.cljs$lang$arity$1("nil")
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
  return cljs.core.list.cljs$lang$arity$0()
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
  var G__6780 = null;
  var G__6780__2 = function(_, n) {
    return null
  };
  var G__6780__3 = function(_, n, not_found) {
    return not_found
  };
  G__6780 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6780__2.call(this, _, n);
      case 3:
        return G__6780__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6780
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
  var and__3822__auto____6781 = cljs.core.instance_QMARK_(Date, other);
  if(and__3822__auto____6781) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____6781
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
    var cnt__6794 = cljs.core._count(cicoll);
    if(cnt__6794 === 0) {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }else {
      var val__6795 = cljs.core._nth.cljs$lang$arity$2(cicoll, 0);
      var n__6796 = 1;
      while(true) {
        if(n__6796 < cnt__6794) {
          var nval__6797 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6795, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6796)) : f.call(null, val__6795, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6796));
          if(cljs.core.reduced_QMARK_(nval__6797)) {
            return cljs.core.deref(nval__6797)
          }else {
            var G__6806 = nval__6797;
            var G__6807 = n__6796 + 1;
            val__6795 = G__6806;
            n__6796 = G__6807;
            continue
          }
        }else {
          return val__6795
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6798 = cljs.core._count(cicoll);
    var val__6799 = val;
    var n__6800 = 0;
    while(true) {
      if(n__6800 < cnt__6798) {
        var nval__6801 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6799, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6800)) : f.call(null, val__6799, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6800));
        if(cljs.core.reduced_QMARK_(nval__6801)) {
          return cljs.core.deref(nval__6801)
        }else {
          var G__6808 = nval__6801;
          var G__6809 = n__6800 + 1;
          val__6799 = G__6808;
          n__6800 = G__6809;
          continue
        }
      }else {
        return val__6799
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6802 = cljs.core._count(cicoll);
    var val__6803 = val;
    var n__6804 = idx;
    while(true) {
      if(n__6804 < cnt__6802) {
        var nval__6805 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6803, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6804)) : f.call(null, val__6803, cljs.core._nth.cljs$lang$arity$2(cicoll, n__6804));
        if(cljs.core.reduced_QMARK_(nval__6805)) {
          return cljs.core.deref(nval__6805)
        }else {
          var G__6810 = nval__6805;
          var G__6811 = n__6804 + 1;
          val__6803 = G__6810;
          n__6804 = G__6811;
          continue
        }
      }else {
        return val__6803
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
    var cnt__6824 = arr.length;
    if(arr.length === 0) {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }else {
      var val__6825 = arr[0];
      var n__6826 = 1;
      while(true) {
        if(n__6826 < cnt__6824) {
          var nval__6827 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6825, arr[n__6826]) : f.call(null, val__6825, arr[n__6826]);
          if(cljs.core.reduced_QMARK_(nval__6827)) {
            return cljs.core.deref(nval__6827)
          }else {
            var G__6836 = nval__6827;
            var G__6837 = n__6826 + 1;
            val__6825 = G__6836;
            n__6826 = G__6837;
            continue
          }
        }else {
          return val__6825
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6828 = arr.length;
    var val__6829 = val;
    var n__6830 = 0;
    while(true) {
      if(n__6830 < cnt__6828) {
        var nval__6831 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6829, arr[n__6830]) : f.call(null, val__6829, arr[n__6830]);
        if(cljs.core.reduced_QMARK_(nval__6831)) {
          return cljs.core.deref(nval__6831)
        }else {
          var G__6838 = nval__6831;
          var G__6839 = n__6830 + 1;
          val__6829 = G__6838;
          n__6830 = G__6839;
          continue
        }
      }else {
        return val__6829
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6832 = arr.length;
    var val__6833 = val;
    var n__6834 = idx;
    while(true) {
      if(n__6834 < cnt__6832) {
        var nval__6835 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__6833, arr[n__6834]) : f.call(null, val__6833, arr[n__6834]);
        if(cljs.core.reduced_QMARK_(nval__6835)) {
          return cljs.core.deref(nval__6835)
        }else {
          var G__6840 = nval__6835;
          var G__6841 = n__6834 + 1;
          val__6833 = G__6840;
          n__6834 = G__6841;
          continue
        }
      }else {
        return val__6833
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6842 = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6843 = this;
  if(this__6843.i + 1 < this__6843.a.length) {
    return new cljs.core.IndexedSeq(this__6843.a, this__6843.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6844 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6845 = this;
  var c__6846 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6846 > 0) {
    return new cljs.core.RSeq(coll, c__6846 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6847 = this;
  var this__6848 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__6848], 0))
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6849 = this;
  if(cljs.core.counted_QMARK_(this__6849.a)) {
    return cljs.core.ci_reduce.cljs$lang$arity$4(this__6849.a, f, this__6849.a[this__6849.i], this__6849.i + 1)
  }else {
    return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, this__6849.a[this__6849.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6850 = this;
  if(cljs.core.counted_QMARK_(this__6850.a)) {
    return cljs.core.ci_reduce.cljs$lang$arity$4(this__6850.a, f, start, this__6850.i)
  }else {
    return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6851 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6852 = this;
  return this__6852.a.length - this__6852.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6853 = this;
  return this__6853.a[this__6853.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6854 = this;
  if(this__6854.i + 1 < this__6854.a.length) {
    return new cljs.core.IndexedSeq(this__6854.a, this__6854.i + 1)
  }else {
    return cljs.core.list.cljs$lang$arity$0()
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6855 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6856 = this;
  var i__6857 = n + this__6856.i;
  if(i__6857 < this__6856.a.length) {
    return this__6856.a[i__6857]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6858 = this;
  var i__6859 = n + this__6858.i;
  if(i__6859 < this__6858.a.length) {
    return this__6858.a[i__6859]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.cljs$lang$arity$2(prim, 0)
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
    return cljs.core.prim_seq.cljs$lang$arity$2(array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.cljs$lang$arity$2(array, i)
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
  var G__6860 = null;
  var G__6860__2 = function(array, f) {
    return cljs.core.ci_reduce.cljs$lang$arity$2(array, f)
  };
  var G__6860__3 = function(array, f, start) {
    return cljs.core.ci_reduce.cljs$lang$arity$3(array, f, start)
  };
  G__6860 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6860__2.call(this, array, f);
      case 3:
        return G__6860__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6860
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6861 = null;
  var G__6861__2 = function(array, k) {
    return array[k]
  };
  var G__6861__3 = function(array, k, not_found) {
    return cljs.core._nth.cljs$lang$arity$3(array, k, not_found)
  };
  G__6861 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6861__2.call(this, array, k);
      case 3:
        return G__6861__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6861
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6862 = null;
  var G__6862__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6862__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6862 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6862__2.call(this, array, n);
      case 3:
        return G__6862__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6862
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.cljs$lang$arity$2(array, 0)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6863 = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6864 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6865 = this;
  var this__6866 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__6866], 0))
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6867 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6868 = this;
  return this__6868.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6869 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__6869.ci, this__6869.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6870 = this;
  if(this__6870.i > 0) {
    return new cljs.core.RSeq(this__6870.ci, this__6870.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6871 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6872 = this;
  return new cljs.core.RSeq(this__6872.ci, this__6872.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6873 = this;
  return this__6873.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6877__6878 = coll;
      if(G__6877__6878) {
        if(function() {
          var or__3824__auto____6879 = G__6877__6878.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____6879) {
            return or__3824__auto____6879
          }else {
            return G__6877__6878.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6877__6878.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ASeq, G__6877__6878)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ASeq, G__6877__6878)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq(coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6884__6885 = coll;
      if(G__6884__6885) {
        if(function() {
          var or__3824__auto____6886 = G__6884__6885.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6886) {
            return or__3824__auto____6886
          }else {
            return G__6884__6885.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6884__6885.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__6884__6885)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__6884__6885)
      }
    }()) {
      return cljs.core._first(coll)
    }else {
      var s__6887 = cljs.core.seq(coll);
      if(s__6887 == null) {
        return null
      }else {
        return cljs.core._first(s__6887)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6892__6893 = coll;
      if(G__6892__6893) {
        if(function() {
          var or__3824__auto____6894 = G__6892__6893.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____6894) {
            return or__3824__auto____6894
          }else {
            return G__6892__6893.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6892__6893.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__6892__6893)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__6892__6893)
      }
    }()) {
      return cljs.core._rest(coll)
    }else {
      var s__6895 = cljs.core.seq(coll);
      if(!(s__6895 == null)) {
        return cljs.core._rest(s__6895)
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
      var G__6899__6900 = coll;
      if(G__6899__6900) {
        if(function() {
          var or__3824__auto____6901 = G__6899__6900.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____6901) {
            return or__3824__auto____6901
          }else {
            return G__6899__6900.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6899__6900.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.INext, G__6899__6900)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.INext, G__6899__6900)
      }
    }()) {
      return cljs.core._next(coll)
    }else {
      return cljs.core.seq(cljs.core.rest(coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first(cljs.core.first(coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next(cljs.core.first(coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next(cljs.core.next(coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6903 = cljs.core.next(s);
    if(!(sn__6903 == null)) {
      var G__6904 = sn__6903;
      s = G__6904;
      continue
    }else {
      return cljs.core.first(s)
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
    return cljs.core._conj(coll, x)
  };
  var conj__3 = function() {
    var G__6905__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6906 = conj.cljs$lang$arity$2(coll, x);
          var G__6907 = cljs.core.first(xs);
          var G__6908 = cljs.core.next(xs);
          coll = G__6906;
          x = G__6907;
          xs = G__6908;
          continue
        }else {
          return conj.cljs$lang$arity$2(coll, x)
        }
        break
      }
    };
    var G__6905 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6905__delegate.call(this, coll, x, xs)
    };
    G__6905.cljs$lang$maxFixedArity = 2;
    G__6905.cljs$lang$applyTo = function(arglist__6909) {
      var coll = cljs.core.first(arglist__6909);
      var x = cljs.core.first(cljs.core.next(arglist__6909));
      var xs = cljs.core.rest(cljs.core.next(arglist__6909));
      return G__6905__delegate(coll, x, xs)
    };
    G__6905.cljs$lang$arity$variadic = G__6905__delegate;
    return G__6905
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
  return cljs.core._empty(coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6912 = cljs.core.seq(coll);
  var acc__6913 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_(s__6912)) {
      return acc__6913 + cljs.core._count(s__6912)
    }else {
      var G__6914 = cljs.core.next(s__6912);
      var G__6915 = acc__6913 + 1;
      s__6912 = G__6914;
      acc__6913 = G__6915;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_(coll)) {
    return cljs.core._count(coll)
  }else {
    return cljs.core.accumulating_seq_count(coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq(coll)) {
          return cljs.core.first(coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_(coll)) {
          return cljs.core._nth.cljs$lang$arity$2(coll, n)
        }else {
          if(cljs.core.seq(coll)) {
            return linear_traversal_nth.cljs$lang$arity$2(cljs.core.next(coll), n - 1)
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
        if(cljs.core.seq(coll)) {
          return cljs.core.first(coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_(coll)) {
          return cljs.core._nth.cljs$lang$arity$3(coll, n, not_found)
        }else {
          if(cljs.core.seq(coll)) {
            return linear_traversal_nth.cljs$lang$arity$3(cljs.core.next(coll), n - 1, not_found)
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
        var G__6922__6923 = coll;
        if(G__6922__6923) {
          if(function() {
            var or__3824__auto____6924 = G__6922__6923.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6924) {
              return or__3824__auto____6924
            }else {
              return G__6922__6923.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6922__6923.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6922__6923)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6922__6923)
        }
      }()) {
        return cljs.core._nth.cljs$lang$arity$2(coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.cljs$lang$arity$2(coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6925__6926 = coll;
        if(G__6925__6926) {
          if(function() {
            var or__3824__auto____6927 = G__6925__6926.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____6927) {
              return or__3824__auto____6927
            }else {
              return G__6925__6926.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6925__6926.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6925__6926)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6925__6926)
        }
      }()) {
        return cljs.core._nth.cljs$lang$arity$3(coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.cljs$lang$arity$3(coll, Math.floor(n), not_found)
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
    return cljs.core._lookup.cljs$lang$arity$2(o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.cljs$lang$arity$3(o, k, not_found)
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
    return cljs.core._assoc(coll, k, v)
  };
  var assoc__4 = function() {
    var G__6930__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6929 = assoc.cljs$lang$arity$3(coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6931 = ret__6929;
          var G__6932 = cljs.core.first(kvs);
          var G__6933 = cljs.core.second(kvs);
          var G__6934 = cljs.core.nnext(kvs);
          coll = G__6931;
          k = G__6932;
          v = G__6933;
          kvs = G__6934;
          continue
        }else {
          return ret__6929
        }
        break
      }
    };
    var G__6930 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6930__delegate.call(this, coll, k, v, kvs)
    };
    G__6930.cljs$lang$maxFixedArity = 3;
    G__6930.cljs$lang$applyTo = function(arglist__6935) {
      var coll = cljs.core.first(arglist__6935);
      var k = cljs.core.first(cljs.core.next(arglist__6935));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6935)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6935)));
      return G__6930__delegate(coll, k, v, kvs)
    };
    G__6930.cljs$lang$arity$variadic = G__6930__delegate;
    return G__6930
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
    return cljs.core._dissoc(coll, k)
  };
  var dissoc__3 = function() {
    var G__6938__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6937 = dissoc.cljs$lang$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6939 = ret__6937;
          var G__6940 = cljs.core.first(ks);
          var G__6941 = cljs.core.next(ks);
          coll = G__6939;
          k = G__6940;
          ks = G__6941;
          continue
        }else {
          return ret__6937
        }
        break
      }
    };
    var G__6938 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6938__delegate.call(this, coll, k, ks)
    };
    G__6938.cljs$lang$maxFixedArity = 2;
    G__6938.cljs$lang$applyTo = function(arglist__6942) {
      var coll = cljs.core.first(arglist__6942);
      var k = cljs.core.first(cljs.core.next(arglist__6942));
      var ks = cljs.core.rest(cljs.core.next(arglist__6942));
      return G__6938__delegate(coll, k, ks)
    };
    G__6938.cljs$lang$arity$variadic = G__6938__delegate;
    return G__6938
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
  return cljs.core._with_meta(o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6946__6947 = o;
    if(G__6946__6947) {
      if(function() {
        var or__3824__auto____6948 = G__6946__6947.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____6948) {
          return or__3824__auto____6948
        }else {
          return G__6946__6947.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6946__6947.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMeta, G__6946__6947)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMeta, G__6946__6947)
    }
  }()) {
    return cljs.core._meta(o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek(coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop(coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin(coll, k)
  };
  var disj__3 = function() {
    var G__6951__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6950 = disj.cljs$lang$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6952 = ret__6950;
          var G__6953 = cljs.core.first(ks);
          var G__6954 = cljs.core.next(ks);
          coll = G__6952;
          k = G__6953;
          ks = G__6954;
          continue
        }else {
          return ret__6950
        }
        break
      }
    };
    var G__6951 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6951__delegate.call(this, coll, k, ks)
    };
    G__6951.cljs$lang$maxFixedArity = 2;
    G__6951.cljs$lang$applyTo = function(arglist__6955) {
      var coll = cljs.core.first(arglist__6955);
      var k = cljs.core.first(cljs.core.next(arglist__6955));
      var ks = cljs.core.rest(cljs.core.next(arglist__6955));
      return G__6951__delegate(coll, k, ks)
    };
    G__6951.cljs$lang$arity$variadic = G__6951__delegate;
    return G__6951
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
  var h__6957 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6957;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6957
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6959 = cljs.core.string_hash_cache[k];
  if(!(h__6959 == null)) {
    return h__6959
  }else {
    return cljs.core.add_to_string_hash_cache(k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.cljs$lang$arity$2(o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____6961 = goog.isString(o);
      if(and__3822__auto____6961) {
        return check_cache
      }else {
        return and__3822__auto____6961
      }
    }()) {
      return cljs.core.check_string_hash_cache(o)
    }else {
      return cljs.core._hash(o)
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
  return cljs.core.not(cljs.core.seq(coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6965__6966 = x;
    if(G__6965__6966) {
      if(function() {
        var or__3824__auto____6967 = G__6965__6966.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____6967) {
          return or__3824__auto____6967
        }else {
          return G__6965__6966.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6965__6966.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ICollection, G__6965__6966)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ICollection, G__6965__6966)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6971__6972 = x;
    if(G__6971__6972) {
      if(function() {
        var or__3824__auto____6973 = G__6971__6972.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____6973) {
          return or__3824__auto____6973
        }else {
          return G__6971__6972.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6971__6972.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISet, G__6971__6972)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISet, G__6971__6972)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6977__6978 = x;
  if(G__6977__6978) {
    if(function() {
      var or__3824__auto____6979 = G__6977__6978.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____6979) {
        return or__3824__auto____6979
      }else {
        return G__6977__6978.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6977__6978.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IAssociative, G__6977__6978)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IAssociative, G__6977__6978)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6983__6984 = x;
  if(G__6983__6984) {
    if(function() {
      var or__3824__auto____6985 = G__6983__6984.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____6985) {
        return or__3824__auto____6985
      }else {
        return G__6983__6984.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6983__6984.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISequential, G__6983__6984)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISequential, G__6983__6984)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6989__6990 = x;
  if(G__6989__6990) {
    if(function() {
      var or__3824__auto____6991 = G__6989__6990.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____6991) {
        return or__3824__auto____6991
      }else {
        return G__6989__6990.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6989__6990.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ICounted, G__6989__6990)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ICounted, G__6989__6990)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6995__6996 = x;
  if(G__6995__6996) {
    if(function() {
      var or__3824__auto____6997 = G__6995__6996.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____6997) {
        return or__3824__auto____6997
      }else {
        return G__6995__6996.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6995__6996.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6995__6996)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IIndexed, G__6995__6996)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7001__7002 = x;
  if(G__7001__7002) {
    if(function() {
      var or__3824__auto____7003 = G__7001__7002.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7003) {
        return or__3824__auto____7003
      }else {
        return G__7001__7002.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7001__7002.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__7001__7002)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReduce, G__7001__7002)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7007__7008 = x;
    if(G__7007__7008) {
      if(function() {
        var or__3824__auto____7009 = G__7007__7008.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7009) {
          return or__3824__auto____7009
        }else {
          return G__7007__7008.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7007__7008.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMap, G__7007__7008)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMap, G__7007__7008)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7013__7014 = x;
  if(G__7013__7014) {
    if(function() {
      var or__3824__auto____7015 = G__7013__7014.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7015) {
        return or__3824__auto____7015
      }else {
        return G__7013__7014.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7013__7014.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IVector, G__7013__7014)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IVector, G__7013__7014)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7019__7020 = x;
  if(G__7019__7020) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7021 = null;
      if(cljs.core.truth_(or__3824__auto____7021)) {
        return or__3824__auto____7021
      }else {
        return G__7019__7020.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7019__7020.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_(cljs.core.IChunkedSeq, G__7019__7020)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IChunkedSeq, G__7019__7020)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7022__delegate = function(keyvals) {
      return cljs.core.apply.cljs$lang$arity$2(goog.object.create, keyvals)
    };
    var G__7022 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7022__delegate.call(this, keyvals)
    };
    G__7022.cljs$lang$maxFixedArity = 0;
    G__7022.cljs$lang$applyTo = function(arglist__7023) {
      var keyvals = cljs.core.seq(arglist__7023);
      return G__7022__delegate(keyvals)
    };
    G__7022.cljs$lang$arity$variadic = G__7022__delegate;
    return G__7022
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
  var keys__7025 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7025.push(key)
  });
  return keys__7025
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7029 = i;
  var j__7030 = j;
  var len__7031 = len;
  while(true) {
    if(len__7031 === 0) {
      return to
    }else {
      to[j__7030] = from[i__7029];
      var G__7032 = i__7029 + 1;
      var G__7033 = j__7030 + 1;
      var G__7034 = len__7031 - 1;
      i__7029 = G__7032;
      j__7030 = G__7033;
      len__7031 = G__7034;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7038 = i + (len - 1);
  var j__7039 = j + (len - 1);
  var len__7040 = len;
  while(true) {
    if(len__7040 === 0) {
      return to
    }else {
      to[j__7039] = from[i__7038];
      var G__7041 = i__7038 - 1;
      var G__7042 = j__7039 - 1;
      var G__7043 = len__7040 - 1;
      i__7038 = G__7041;
      j__7039 = G__7042;
      len__7040 = G__7043;
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
    var G__7047__7048 = s;
    if(G__7047__7048) {
      if(function() {
        var or__3824__auto____7049 = G__7047__7048.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7049) {
          return or__3824__auto____7049
        }else {
          return G__7047__7048.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7047__7048.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISeq, G__7047__7048)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISeq, G__7047__7048)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7053__7054 = s;
  if(G__7053__7054) {
    if(function() {
      var or__3824__auto____7055 = G__7053__7054.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7055) {
        return or__3824__auto____7055
      }else {
        return G__7053__7054.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7053__7054.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISeqable, G__7053__7054)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISeqable, G__7053__7054)
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
  var and__3822__auto____7058 = goog.isString(x);
  if(and__3822__auto____7058) {
    return!function() {
      var or__3824__auto____7059 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7059) {
        return or__3824__auto____7059
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7058
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7061 = goog.isString(x);
  if(and__3822__auto____7061) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7061
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7063 = goog.isString(x);
  if(and__3822__auto____7063) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7063
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7068 = cljs.core.fn_QMARK_(f);
  if(or__3824__auto____7068) {
    return or__3824__auto____7068
  }else {
    var G__7069__7070 = f;
    if(G__7069__7070) {
      if(function() {
        var or__3824__auto____7071 = G__7069__7070.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7071) {
          return or__3824__auto____7071
        }else {
          return G__7069__7070.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7069__7070.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IFn, G__7069__7070)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IFn, G__7069__7070)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7073 = cljs.core.number_QMARK_(n);
  if(and__3822__auto____7073) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7073
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.cljs$lang$arity$3(coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7076 = coll;
    if(cljs.core.truth_(and__3822__auto____7076)) {
      var and__3822__auto____7077 = cljs.core.associative_QMARK_(coll);
      if(and__3822__auto____7077) {
        return cljs.core.contains_QMARK_(coll, k)
      }else {
        return and__3822__auto____7077
      }
    }else {
      return and__3822__auto____7076
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.cljs$lang$arity$2(coll, k)], true)
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
    return!cljs.core._EQ_.cljs$lang$arity$2(x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7086__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.cljs$lang$arity$2(x, y)) {
        var s__7082 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7083 = more;
        while(true) {
          var x__7084 = cljs.core.first(xs__7083);
          var etc__7085 = cljs.core.next(xs__7083);
          if(cljs.core.truth_(xs__7083)) {
            if(cljs.core.contains_QMARK_(s__7082, x__7084)) {
              return false
            }else {
              var G__7087 = cljs.core.conj.cljs$lang$arity$2(s__7082, x__7084);
              var G__7088 = etc__7085;
              s__7082 = G__7087;
              xs__7083 = G__7088;
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
    var G__7086 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7086__delegate.call(this, x, y, more)
    };
    G__7086.cljs$lang$maxFixedArity = 2;
    G__7086.cljs$lang$applyTo = function(arglist__7089) {
      var x = cljs.core.first(arglist__7089);
      var y = cljs.core.first(cljs.core.next(arglist__7089));
      var more = cljs.core.rest(cljs.core.next(arglist__7089));
      return G__7086__delegate(x, y, more)
    };
    G__7086.cljs$lang$arity$variadic = G__7086__delegate;
    return G__7086
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
        if(cljs.core.type(x) === cljs.core.type(y)) {
          if(function() {
            var G__7093__7094 = x;
            if(G__7093__7094) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7095 = null;
                if(cljs.core.truth_(or__3824__auto____7095)) {
                  return or__3824__auto____7095
                }else {
                  return G__7093__7094.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7093__7094.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_(cljs.core.IComparable, G__7093__7094)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_(cljs.core.IComparable, G__7093__7094)
            }
          }()) {
            return cljs.core._compare(x, y)
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
    var xl__7100 = cljs.core.count(xs);
    var yl__7101 = cljs.core.count(ys);
    if(xl__7100 < yl__7101) {
      return-1
    }else {
      if(xl__7100 > yl__7101) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.cljs$lang$arity$4(xs, ys, xl__7100, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7102 = cljs.core.compare(cljs.core.nth.cljs$lang$arity$2(xs, n), cljs.core.nth.cljs$lang$arity$2(ys, n));
      if(function() {
        var and__3822__auto____7103 = d__7102 === 0;
        if(and__3822__auto____7103) {
          return n + 1 < len
        }else {
          return and__3822__auto____7103
        }
      }()) {
        var G__7104 = xs;
        var G__7105 = ys;
        var G__7106 = len;
        var G__7107 = n + 1;
        xs = G__7104;
        ys = G__7105;
        len = G__7106;
        n = G__7107;
        continue
      }else {
        return d__7102
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
  if(cljs.core._EQ_.cljs$lang$arity$2(f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7109 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y);
      if(cljs.core.number_QMARK_(r__7109)) {
        return r__7109
      }else {
        if(cljs.core.truth_(r__7109)) {
          return-1
        }else {
          if(cljs.core.truth_(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(y, x) : f.call(null, y, x))) {
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
    return sort.cljs$lang$arity$2(cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq(coll)) {
      var a__7111 = cljs.core.to_array(coll);
      goog.array.stableSort(a__7111, cljs.core.fn__GT_comparator(comp));
      return cljs.core.seq(a__7111)
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
    return sort_by.cljs$lang$arity$3(keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.cljs$lang$arity$2(function(x, y) {
      return cljs.core.fn__GT_comparator(comp).call(null, keyfn.cljs$lang$arity$1 ? keyfn.cljs$lang$arity$1(x) : keyfn.call(null, x), keyfn.cljs$lang$arity$1 ? keyfn.cljs$lang$arity$1(y) : keyfn.call(null, y))
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
    var temp__3971__auto____7117 = cljs.core.seq(coll);
    if(temp__3971__auto____7117) {
      var s__7118 = temp__3971__auto____7117;
      return cljs.core.reduce.cljs$lang$arity$3(f, cljs.core.first(s__7118), cljs.core.next(s__7118))
    }else {
      return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7119 = val;
    var coll__7120 = cljs.core.seq(coll);
    while(true) {
      if(coll__7120) {
        var nval__7121 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(val__7119, cljs.core.first(coll__7120)) : f.call(null, val__7119, cljs.core.first(coll__7120));
        if(cljs.core.reduced_QMARK_(nval__7121)) {
          return cljs.core.deref(nval__7121)
        }else {
          var G__7122 = nval__7121;
          var G__7123 = cljs.core.next(coll__7120);
          val__7119 = G__7122;
          coll__7120 = G__7123;
          continue
        }
      }else {
        return val__7119
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
  var a__7125 = cljs.core.to_array(coll);
  goog.array.shuffle(a__7125);
  return cljs.core.vec(a__7125)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7132__7133 = coll;
      if(G__7132__7133) {
        if(function() {
          var or__3824__auto____7134 = G__7132__7133.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7134) {
            return or__3824__auto____7134
          }else {
            return G__7132__7133.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7132__7133.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IReduce, G__7132__7133)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__7132__7133)
      }
    }()) {
      return cljs.core._reduce.cljs$lang$arity$2(coll, f)
    }else {
      return cljs.core.seq_reduce.cljs$lang$arity$2(f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7135__7136 = coll;
      if(G__7135__7136) {
        if(function() {
          var or__3824__auto____7137 = G__7135__7136.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7137) {
            return or__3824__auto____7137
          }else {
            return G__7135__7136.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7135__7136.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IReduce, G__7135__7136)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__7135__7136)
      }
    }()) {
      return cljs.core._reduce.cljs$lang$arity$3(coll, f, val)
    }else {
      return cljs.core.seq_reduce.cljs$lang$arity$3(f, val, coll)
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
  return cljs.core._kv_reduce(coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7138 = this;
  return this__7138.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_(cljs.core.Reduced, r)
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
    var G__7139__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_PLUS_, x + y, more)
    };
    var G__7139 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7139__delegate.call(this, x, y, more)
    };
    G__7139.cljs$lang$maxFixedArity = 2;
    G__7139.cljs$lang$applyTo = function(arglist__7140) {
      var x = cljs.core.first(arglist__7140);
      var y = cljs.core.first(cljs.core.next(arglist__7140));
      var more = cljs.core.rest(cljs.core.next(arglist__7140));
      return G__7139__delegate(x, y, more)
    };
    G__7139.cljs$lang$arity$variadic = G__7139__delegate;
    return G__7139
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
    var G__7141__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_, x - y, more)
    };
    var G__7141 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7141__delegate.call(this, x, y, more)
    };
    G__7141.cljs$lang$maxFixedArity = 2;
    G__7141.cljs$lang$applyTo = function(arglist__7142) {
      var x = cljs.core.first(arglist__7142);
      var y = cljs.core.first(cljs.core.next(arglist__7142));
      var more = cljs.core.rest(cljs.core.next(arglist__7142));
      return G__7141__delegate(x, y, more)
    };
    G__7141.cljs$lang$arity$variadic = G__7141__delegate;
    return G__7141
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
    var G__7143__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_STAR_, x * y, more)
    };
    var G__7143 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7143__delegate.call(this, x, y, more)
    };
    G__7143.cljs$lang$maxFixedArity = 2;
    G__7143.cljs$lang$applyTo = function(arglist__7144) {
      var x = cljs.core.first(arglist__7144);
      var y = cljs.core.first(cljs.core.next(arglist__7144));
      var more = cljs.core.rest(cljs.core.next(arglist__7144));
      return G__7143__delegate(x, y, more)
    };
    G__7143.cljs$lang$arity$variadic = G__7143__delegate;
    return G__7143
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
    return _SLASH_.cljs$lang$arity$2(1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7145__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(_SLASH_, _SLASH_.cljs$lang$arity$2(x, y), more)
    };
    var G__7145 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7145__delegate.call(this, x, y, more)
    };
    G__7145.cljs$lang$maxFixedArity = 2;
    G__7145.cljs$lang$applyTo = function(arglist__7146) {
      var x = cljs.core.first(arglist__7146);
      var y = cljs.core.first(cljs.core.next(arglist__7146));
      var more = cljs.core.rest(cljs.core.next(arglist__7146));
      return G__7145__delegate(x, y, more)
    };
    G__7145.cljs$lang$arity$variadic = G__7145__delegate;
    return G__7145
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
    var G__7147__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next(more)) {
            var G__7148 = y;
            var G__7149 = cljs.core.first(more);
            var G__7150 = cljs.core.next(more);
            x = G__7148;
            y = G__7149;
            more = G__7150;
            continue
          }else {
            return y < cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7147 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7147__delegate.call(this, x, y, more)
    };
    G__7147.cljs$lang$maxFixedArity = 2;
    G__7147.cljs$lang$applyTo = function(arglist__7151) {
      var x = cljs.core.first(arglist__7151);
      var y = cljs.core.first(cljs.core.next(arglist__7151));
      var more = cljs.core.rest(cljs.core.next(arglist__7151));
      return G__7147__delegate(x, y, more)
    };
    G__7147.cljs$lang$arity$variadic = G__7147__delegate;
    return G__7147
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
    var G__7152__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next(more)) {
            var G__7153 = y;
            var G__7154 = cljs.core.first(more);
            var G__7155 = cljs.core.next(more);
            x = G__7153;
            y = G__7154;
            more = G__7155;
            continue
          }else {
            return y <= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7152 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7152__delegate.call(this, x, y, more)
    };
    G__7152.cljs$lang$maxFixedArity = 2;
    G__7152.cljs$lang$applyTo = function(arglist__7156) {
      var x = cljs.core.first(arglist__7156);
      var y = cljs.core.first(cljs.core.next(arglist__7156));
      var more = cljs.core.rest(cljs.core.next(arglist__7156));
      return G__7152__delegate(x, y, more)
    };
    G__7152.cljs$lang$arity$variadic = G__7152__delegate;
    return G__7152
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
    var G__7157__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next(more)) {
            var G__7158 = y;
            var G__7159 = cljs.core.first(more);
            var G__7160 = cljs.core.next(more);
            x = G__7158;
            y = G__7159;
            more = G__7160;
            continue
          }else {
            return y > cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7157__delegate.call(this, x, y, more)
    };
    G__7157.cljs$lang$maxFixedArity = 2;
    G__7157.cljs$lang$applyTo = function(arglist__7161) {
      var x = cljs.core.first(arglist__7161);
      var y = cljs.core.first(cljs.core.next(arglist__7161));
      var more = cljs.core.rest(cljs.core.next(arglist__7161));
      return G__7157__delegate(x, y, more)
    };
    G__7157.cljs$lang$arity$variadic = G__7157__delegate;
    return G__7157
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
    var G__7162__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next(more)) {
            var G__7163 = y;
            var G__7164 = cljs.core.first(more);
            var G__7165 = cljs.core.next(more);
            x = G__7163;
            y = G__7164;
            more = G__7165;
            continue
          }else {
            return y >= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7162 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7162__delegate.call(this, x, y, more)
    };
    G__7162.cljs$lang$maxFixedArity = 2;
    G__7162.cljs$lang$applyTo = function(arglist__7166) {
      var x = cljs.core.first(arglist__7166);
      var y = cljs.core.first(cljs.core.next(arglist__7166));
      var more = cljs.core.rest(cljs.core.next(arglist__7166));
      return G__7162__delegate(x, y, more)
    };
    G__7162.cljs$lang$arity$variadic = G__7162__delegate;
    return G__7162
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
    var G__7167__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(max, x > y ? x : y, more)
    };
    var G__7167 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7167__delegate.call(this, x, y, more)
    };
    G__7167.cljs$lang$maxFixedArity = 2;
    G__7167.cljs$lang$applyTo = function(arglist__7168) {
      var x = cljs.core.first(arglist__7168);
      var y = cljs.core.first(cljs.core.next(arglist__7168));
      var more = cljs.core.rest(cljs.core.next(arglist__7168));
      return G__7167__delegate(x, y, more)
    };
    G__7167.cljs$lang$arity$variadic = G__7167__delegate;
    return G__7167
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
    var G__7169__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(min, x < y ? x : y, more)
    };
    var G__7169 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7169__delegate.call(this, x, y, more)
    };
    G__7169.cljs$lang$maxFixedArity = 2;
    G__7169.cljs$lang$applyTo = function(arglist__7170) {
      var x = cljs.core.first(arglist__7170);
      var y = cljs.core.first(cljs.core.next(arglist__7170));
      var more = cljs.core.rest(cljs.core.next(arglist__7170));
      return G__7169__delegate(x, y, more)
    };
    G__7169.cljs$lang$arity$variadic = G__7169__delegate;
    return G__7169
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
    return Math.floor.cljs$lang$arity$1 ? Math.floor.cljs$lang$arity$1(q) : Math.floor.call(null, q)
  }else {
    return Math.ceil.cljs$lang$arity$1 ? Math.ceil.cljs$lang$arity$1(q) : Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix(x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix(x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7172 = n % d;
  return cljs.core.fix((n - rem__7172) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7174 = cljs.core.quot(n, d);
  return n - d * q__7174
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.cljs$lang$arity$0()
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
  return cljs.core.fix(cljs.core.rand.cljs$lang$arity$1(n))
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
  var v__7177 = v - (v >> 1 & 1431655765);
  var v__7178 = (v__7177 & 858993459) + (v__7177 >> 2 & 858993459);
  return(v__7178 + (v__7178 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv(x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7179__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.cljs$lang$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__7180 = y;
            var G__7181 = cljs.core.first(more);
            var G__7182 = cljs.core.next(more);
            x = G__7180;
            y = G__7181;
            more = G__7182;
            continue
          }else {
            return _EQ__EQ_.cljs$lang$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7179 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7179__delegate.call(this, x, y, more)
    };
    G__7179.cljs$lang$maxFixedArity = 2;
    G__7179.cljs$lang$applyTo = function(arglist__7183) {
      var x = cljs.core.first(arglist__7183);
      var y = cljs.core.first(cljs.core.next(arglist__7183));
      var more = cljs.core.rest(cljs.core.next(arglist__7183));
      return G__7179__delegate(x, y, more)
    };
    G__7179.cljs$lang$arity$variadic = G__7179__delegate;
    return G__7179
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
  var n__7187 = n;
  var xs__7188 = cljs.core.seq(coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7189 = xs__7188;
      if(and__3822__auto____7189) {
        return n__7187 > 0
      }else {
        return and__3822__auto____7189
      }
    }())) {
      var G__7190 = n__7187 - 1;
      var G__7191 = cljs.core.next(xs__7188);
      n__7187 = G__7190;
      xs__7188 = G__7191;
      continue
    }else {
      return xs__7188
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
    var G__7192__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7193 = sb.append(str_STAR_.cljs$lang$arity$1(cljs.core.first(more)));
            var G__7194 = cljs.core.next(more);
            sb = G__7193;
            more = G__7194;
            continue
          }else {
            return str_STAR_.cljs$lang$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.cljs$lang$arity$1(x)), ys)
    };
    var G__7192 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7192__delegate.call(this, x, ys)
    };
    G__7192.cljs$lang$maxFixedArity = 1;
    G__7192.cljs$lang$applyTo = function(arglist__7195) {
      var x = cljs.core.first(arglist__7195);
      var ys = cljs.core.rest(arglist__7195);
      return G__7192__delegate(x, ys)
    };
    G__7192.cljs$lang$arity$variadic = G__7192__delegate;
    return G__7192
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
    if(cljs.core.symbol_QMARK_(x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_(x)) {
        return cljs.core.str_STAR_.cljs$lang$arity$variadic(":", cljs.core.array_seq([x.substring(2, x.length)], 0))
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
    var G__7196__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7197 = sb.append(str.cljs$lang$arity$1(cljs.core.first(more)));
            var G__7198 = cljs.core.next(more);
            sb = G__7197;
            more = G__7198;
            continue
          }else {
            return cljs.core.str_STAR_.cljs$lang$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.cljs$lang$arity$1(x)), ys)
    };
    var G__7196 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7196__delegate.call(this, x, ys)
    };
    G__7196.cljs$lang$maxFixedArity = 1;
    G__7196.cljs$lang$applyTo = function(arglist__7199) {
      var x = cljs.core.first(arglist__7199);
      var ys = cljs.core.rest(arglist__7199);
      return G__7196__delegate(x, ys)
    };
    G__7196.cljs$lang$arity$variadic = G__7196__delegate;
    return G__7196
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
    return cljs.core.apply.cljs$lang$arity$3(goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7200) {
    var fmt = cljs.core.first(arglist__7200);
    var args = cljs.core.rest(arglist__7200);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_(name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_(name)) {
        cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd1", cljs.core.array_seq(["'", cljs.core.subs.cljs$lang$arity$2(name, 2)], 0))
      }else {
      }
    }
    return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd1", cljs.core.array_seq(["'", name], 0))
  };
  var symbol__2 = function(ns, name) {
    return symbol.cljs$lang$arity$1(cljs.core.str_STAR_.cljs$lang$arity$variadic(ns, cljs.core.array_seq(["/", name], 0)))
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
    if(cljs.core.keyword_QMARK_(name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_(name)) {
        return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd0", cljs.core.array_seq(["'", cljs.core.subs.cljs$lang$arity$2(name, 2)], 0))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.cljs$lang$arity$variadic("\ufdd0", cljs.core.array_seq(["'", name], 0))
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.cljs$lang$arity$1(cljs.core.str_STAR_.cljs$lang$arity$variadic(ns, cljs.core.array_seq(["/", name], 0)))
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
  return cljs.core.boolean$(cljs.core.sequential_QMARK_(y) ? function() {
    var xs__7203 = cljs.core.seq(x);
    var ys__7204 = cljs.core.seq(y);
    while(true) {
      if(xs__7203 == null) {
        return ys__7204 == null
      }else {
        if(ys__7204 == null) {
          return false
        }else {
          if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.first(xs__7203), cljs.core.first(ys__7204))) {
            var G__7205 = cljs.core.next(xs__7203);
            var G__7206 = cljs.core.next(ys__7204);
            xs__7203 = G__7205;
            ys__7204 = G__7206;
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
  return cljs.core.reduce.cljs$lang$arity$3(function(p1__7207_SHARP_, p2__7208_SHARP_) {
    return cljs.core.hash_combine(p1__7207_SHARP_, cljs.core.hash.cljs$lang$arity$2(p2__7208_SHARP_, false))
  }, cljs.core.hash.cljs$lang$arity$2(cljs.core.first(coll), false), cljs.core.next(coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7212 = 0;
  var s__7213 = cljs.core.seq(m);
  while(true) {
    if(s__7213) {
      var e__7214 = cljs.core.first(s__7213);
      var G__7215 = (h__7212 + (cljs.core.hash.cljs$lang$arity$1(cljs.core.key(e__7214)) ^ cljs.core.hash.cljs$lang$arity$1(cljs.core.val(e__7214)))) % 4503599627370496;
      var G__7216 = cljs.core.next(s__7213);
      h__7212 = G__7215;
      s__7213 = G__7216;
      continue
    }else {
      return h__7212
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7220 = 0;
  var s__7221 = cljs.core.seq(s);
  while(true) {
    if(s__7221) {
      var e__7222 = cljs.core.first(s__7221);
      var G__7223 = (h__7220 + cljs.core.hash.cljs$lang$arity$1(e__7222)) % 4503599627370496;
      var G__7224 = cljs.core.next(s__7221);
      h__7220 = G__7223;
      s__7221 = G__7224;
      continue
    }else {
      return h__7220
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7245__7246 = cljs.core.seq(fn_map);
  if(G__7245__7246) {
    var G__7248__7250 = cljs.core.first(G__7245__7246);
    var vec__7249__7251 = G__7248__7250;
    var key_name__7252 = cljs.core.nth.cljs$lang$arity$3(vec__7249__7251, 0, null);
    var f__7253 = cljs.core.nth.cljs$lang$arity$3(vec__7249__7251, 1, null);
    var G__7245__7254 = G__7245__7246;
    var G__7248__7255 = G__7248__7250;
    var G__7245__7256 = G__7245__7254;
    while(true) {
      var vec__7257__7258 = G__7248__7255;
      var key_name__7259 = cljs.core.nth.cljs$lang$arity$3(vec__7257__7258, 0, null);
      var f__7260 = cljs.core.nth.cljs$lang$arity$3(vec__7257__7258, 1, null);
      var G__7245__7261 = G__7245__7256;
      var str_name__7262 = cljs.core.name(key_name__7259);
      obj[str_name__7262] = f__7260;
      var temp__3974__auto____7263 = cljs.core.next(G__7245__7261);
      if(temp__3974__auto____7263) {
        var G__7245__7264 = temp__3974__auto____7263;
        var G__7265 = cljs.core.first(G__7245__7264);
        var G__7266 = G__7245__7264;
        G__7248__7255 = G__7265;
        G__7245__7256 = G__7266;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7267 = this;
  var h__2220__auto____7268 = this__7267.__hash;
  if(!(h__2220__auto____7268 == null)) {
    return h__2220__auto____7268
  }else {
    var h__2220__auto____7269 = cljs.core.hash_coll(coll);
    this__7267.__hash = h__2220__auto____7269;
    return h__2220__auto____7269
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7270 = this;
  if(this__7270.count === 1) {
    return null
  }else {
    return this__7270.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7271 = this;
  return new cljs.core.List(this__7271.meta, o, coll, this__7271.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7272 = this;
  var this__7273 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7273], 0))
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7274 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7275 = this;
  return this__7275.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7276 = this;
  return this__7276.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7277 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7278 = this;
  return this__7278.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7279 = this;
  if(this__7279.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7279.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7280 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7281 = this;
  return new cljs.core.List(meta, this__7281.first, this__7281.rest, this__7281.count, this__7281.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7282 = this;
  return this__7282.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7283 = this;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7284 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7285 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7286 = this;
  return new cljs.core.List(this__7286.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7287 = this;
  var this__7288 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7288], 0))
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7289 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7290 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7291 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7292 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7293 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7294 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7295 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7296 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7297 = this;
  return this__7297.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7298 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7302__7303 = coll;
  if(G__7302__7303) {
    if(function() {
      var or__3824__auto____7304 = G__7302__7303.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7304) {
        return or__3824__auto____7304
      }else {
        return G__7302__7303.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7302__7303.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReversible, G__7302__7303)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReversible, G__7302__7303)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq(coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_(coll)) {
    return cljs.core.rseq(coll)
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.cljs$lang$arity$2(cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.cljs$lang$arity$2(list.cljs$lang$arity$1(y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.cljs$lang$arity$2(list.cljs$lang$arity$2(y, z), x)
  };
  var list__4 = function() {
    var G__7305__delegate = function(x, y, z, items) {
      return cljs.core.conj.cljs$lang$arity$2(cljs.core.conj.cljs$lang$arity$2(cljs.core.conj.cljs$lang$arity$2(cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse(items)), z), y), x)
    };
    var G__7305 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7305__delegate.call(this, x, y, z, items)
    };
    G__7305.cljs$lang$maxFixedArity = 3;
    G__7305.cljs$lang$applyTo = function(arglist__7306) {
      var x = cljs.core.first(arglist__7306);
      var y = cljs.core.first(cljs.core.next(arglist__7306));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7306)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7306)));
      return G__7305__delegate(x, y, z, items)
    };
    G__7305.cljs$lang$arity$variadic = G__7305__delegate;
    return G__7305
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7307 = this;
  var h__2220__auto____7308 = this__7307.__hash;
  if(!(h__2220__auto____7308 == null)) {
    return h__2220__auto____7308
  }else {
    var h__2220__auto____7309 = cljs.core.hash_coll(coll);
    this__7307.__hash = h__2220__auto____7309;
    return h__2220__auto____7309
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7310 = this;
  if(this__7310.rest == null) {
    return null
  }else {
    return cljs.core._seq(this__7310.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7311 = this;
  return new cljs.core.Cons(null, o, coll, this__7311.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7312 = this;
  var this__7313 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7313], 0))
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7314 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7315 = this;
  return this__7315.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7316 = this;
  if(this__7316.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7316.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7317 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7318 = this;
  return new cljs.core.Cons(meta, this__7318.first, this__7318.rest, this__7318.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7319 = this;
  return this__7319.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7320 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__7320.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7325 = coll == null;
    if(or__3824__auto____7325) {
      return or__3824__auto____7325
    }else {
      var G__7326__7327 = coll;
      if(G__7326__7327) {
        if(function() {
          var or__3824__auto____7328 = G__7326__7327.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7328) {
            return or__3824__auto____7328
          }else {
            return G__7326__7327.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7326__7327.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.ISeq, G__7326__7327)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.ISeq, G__7326__7327)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq(coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7332__7333 = x;
  if(G__7332__7333) {
    if(function() {
      var or__3824__auto____7334 = G__7332__7333.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7334) {
        return or__3824__auto____7334
      }else {
        return G__7332__7333.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7332__7333.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IList, G__7332__7333)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IList, G__7332__7333)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7335 = null;
  var G__7335__2 = function(string, f) {
    return cljs.core.ci_reduce.cljs$lang$arity$2(string, f)
  };
  var G__7335__3 = function(string, f, start) {
    return cljs.core.ci_reduce.cljs$lang$arity$3(string, f, start)
  };
  G__7335 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7335__2.call(this, string, f);
      case 3:
        return G__7335__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7335
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7336 = null;
  var G__7336__2 = function(string, k) {
    return cljs.core._nth.cljs$lang$arity$2(string, k)
  };
  var G__7336__3 = function(string, k, not_found) {
    return cljs.core._nth.cljs$lang$arity$3(string, k, not_found)
  };
  G__7336 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7336__2.call(this, string, k);
      case 3:
        return G__7336__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7336
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7337 = null;
  var G__7337__2 = function(string, n) {
    if(n < cljs.core._count(string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7337__3 = function(string, n, not_found) {
    if(n < cljs.core._count(string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7337 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7337__2.call(this, string, n);
      case 3:
        return G__7337__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7337
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.cljs$lang$arity$2(string, 0)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7349 = null;
  var G__7349__2 = function(this_sym7340, coll) {
    var this__7342 = this;
    var this_sym7340__7343 = this;
    var ___7344 = this_sym7340__7343;
    if(coll == null) {
      return null
    }else {
      var strobj__7345 = coll.strobj;
      if(strobj__7345 == null) {
        return cljs.core._lookup.cljs$lang$arity$3(coll, this__7342.k, null)
      }else {
        return strobj__7345[this__7342.k]
      }
    }
  };
  var G__7349__3 = function(this_sym7341, coll, not_found) {
    var this__7342 = this;
    var this_sym7341__7346 = this;
    var ___7347 = this_sym7341__7346;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.cljs$lang$arity$3(coll, this__7342.k, not_found)
    }
  };
  G__7349 = function(this_sym7341, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7349__2.call(this, this_sym7341, coll);
      case 3:
        return G__7349__3.call(this, this_sym7341, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7349
}();
cljs.core.Keyword.prototype.apply = function(this_sym7338, args7339) {
  var this__7348 = this;
  return this_sym7338.call.apply(this_sym7338, [this_sym7338].concat(args7339.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7358 = null;
  var G__7358__2 = function(this_sym7352, coll) {
    var this_sym7352__7354 = this;
    var this__7355 = this_sym7352__7354;
    return cljs.core._lookup.cljs$lang$arity$3(coll, this__7355.toString(), null)
  };
  var G__7358__3 = function(this_sym7353, coll, not_found) {
    var this_sym7353__7356 = this;
    var this__7357 = this_sym7353__7356;
    return cljs.core._lookup.cljs$lang$arity$3(coll, this__7357.toString(), not_found)
  };
  G__7358 = function(this_sym7353, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7358__2.call(this, this_sym7353, coll);
      case 3:
        return G__7358__3.call(this, this_sym7353, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7358
}();
String.prototype.apply = function(this_sym7350, args7351) {
  return this_sym7350.call.apply(this_sym7350, [this_sym7350].concat(args7351.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count(args) < 2) {
    return cljs.core._lookup.cljs$lang$arity$3(args[0], s, null)
  }else {
    return cljs.core._lookup.cljs$lang$arity$3(args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7360 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7360
  }else {
    lazy_seq.x = x__7360.cljs$lang$arity$0 ? x__7360.cljs$lang$arity$0() : x__7360.call(null);
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7361 = this;
  var h__2220__auto____7362 = this__7361.__hash;
  if(!(h__2220__auto____7362 == null)) {
    return h__2220__auto____7362
  }else {
    var h__2220__auto____7363 = cljs.core.hash_coll(coll);
    this__7361.__hash = h__2220__auto____7363;
    return h__2220__auto____7363
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7364 = this;
  return cljs.core._seq(coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7365 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7366 = this;
  var this__7367 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__7367], 0))
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7368 = this;
  return cljs.core.seq(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7369 = this;
  return cljs.core.first(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7370 = this;
  return cljs.core.rest(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7371 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7372 = this;
  return new cljs.core.LazySeq(meta, this__7372.realized, this__7372.x, this__7372.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7373 = this;
  return this__7373.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7374 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__7374.meta)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7375 = this;
  return this__7375.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7376 = this;
  var ___7377 = this;
  this__7376.buf[this__7376.end] = o;
  return this__7376.end = this__7376.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7378 = this;
  var ___7379 = this;
  var ret__7380 = new cljs.core.ArrayChunk(this__7378.buf, 0, this__7378.end);
  this__7378.buf = null;
  return ret__7380
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.cljs$lang$arity$1(capacity), 0)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7381 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, this__7381.arr[this__7381.off], this__7381.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7382 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$4(coll, f, start, this__7382.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7383 = this;
  if(this__7383.off === this__7383.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7383.arr, this__7383.off + 1, this__7383.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7384 = this;
  return this__7384.arr[this__7384.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7385 = this;
  if(function() {
    var and__3822__auto____7386 = i >= 0;
    if(and__3822__auto____7386) {
      return i < this__7385.end - this__7385.off
    }else {
      return and__3822__auto____7386
    }
  }()) {
    return this__7385.arr[this__7385.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7387 = this;
  return this__7387.end - this__7387.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.cljs$lang$arity$3(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.cljs$lang$arity$3(arr, off, arr.length)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7388 = this;
  return cljs.core.cons(o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7389 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7390 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__7390.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7391 = this;
  if(cljs.core._count(this__7391.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first(this__7391.chunk), this__7391.more, this__7391.meta)
  }else {
    if(this__7391.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7391.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7392 = this;
  if(this__7392.more == null) {
    return null
  }else {
    return this__7392.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7393 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7394 = this;
  return new cljs.core.ChunkedCons(this__7394.chunk, this__7394.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7395 = this;
  return this__7395.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7396 = this;
  return this__7396.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7397 = this;
  if(this__7397.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7397.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count(chunk) === 0) {
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
  return cljs.core._chunked_first(s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest(s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7401__7402 = s;
    if(G__7401__7402) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7403 = null;
        if(cljs.core.truth_(or__3824__auto____7403)) {
          return or__3824__auto____7403
        }else {
          return G__7401__7402.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7401__7402.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_(cljs.core.IChunkedNext, G__7401__7402)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IChunkedNext, G__7401__7402)
    }
  }()) {
    return cljs.core._chunked_next(s)
  }else {
    return cljs.core.seq(cljs.core._chunked_rest(s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7406 = [];
  var s__7407 = s;
  while(true) {
    if(cljs.core.seq(s__7407)) {
      ary__7406.push(cljs.core.first(s__7407));
      var G__7408 = cljs.core.next(s__7407);
      s__7407 = G__7408;
      continue
    }else {
      return ary__7406
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7412 = cljs.core.make_array.cljs$lang$arity$1(cljs.core.count(coll));
  var i__7413 = 0;
  var xs__7414 = cljs.core.seq(coll);
  while(true) {
    if(xs__7414) {
      ret__7412[i__7413] = cljs.core.to_array(cljs.core.first(xs__7414));
      var G__7415 = i__7413 + 1;
      var G__7416 = cljs.core.next(xs__7414);
      i__7413 = G__7415;
      xs__7414 = G__7416;
      continue
    }else {
    }
    break
  }
  return ret__7412
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return long_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
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
    var a__7424 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7425 = cljs.core.seq(init_val_or_seq);
      var i__7426 = 0;
      var s__7427 = s__7425;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7428 = s__7427;
          if(and__3822__auto____7428) {
            return i__7426 < size
          }else {
            return and__3822__auto____7428
          }
        }())) {
          a__7424[i__7426] = cljs.core.first(s__7427);
          var G__7431 = i__7426 + 1;
          var G__7432 = cljs.core.next(s__7427);
          i__7426 = G__7431;
          s__7427 = G__7432;
          continue
        }else {
          return a__7424
        }
        break
      }
    }else {
      var n__2555__auto____7429 = size;
      var i__7430 = 0;
      while(true) {
        if(i__7430 < n__2555__auto____7429) {
          a__7424[i__7430] = init_val_or_seq;
          var G__7433 = i__7430 + 1;
          i__7430 = G__7433;
          continue
        }else {
        }
        break
      }
      return a__7424
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
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return double_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
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
    var a__7441 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7442 = cljs.core.seq(init_val_or_seq);
      var i__7443 = 0;
      var s__7444 = s__7442;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7445 = s__7444;
          if(and__3822__auto____7445) {
            return i__7443 < size
          }else {
            return and__3822__auto____7445
          }
        }())) {
          a__7441[i__7443] = cljs.core.first(s__7444);
          var G__7448 = i__7443 + 1;
          var G__7449 = cljs.core.next(s__7444);
          i__7443 = G__7448;
          s__7444 = G__7449;
          continue
        }else {
          return a__7441
        }
        break
      }
    }else {
      var n__2555__auto____7446 = size;
      var i__7447 = 0;
      while(true) {
        if(i__7447 < n__2555__auto____7446) {
          a__7441[i__7447] = init_val_or_seq;
          var G__7450 = i__7447 + 1;
          i__7447 = G__7450;
          continue
        }else {
        }
        break
      }
      return a__7441
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
    if(cljs.core.number_QMARK_(size_or_seq)) {
      return object_array.cljs$lang$arity$2(size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_(size_or_seq)) {
        return cljs.core.into_array.cljs$lang$arity$1(size_or_seq)
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
    var a__7458 = cljs.core.make_array.cljs$lang$arity$1(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s__7459 = cljs.core.seq(init_val_or_seq);
      var i__7460 = 0;
      var s__7461 = s__7459;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7462 = s__7461;
          if(and__3822__auto____7462) {
            return i__7460 < size
          }else {
            return and__3822__auto____7462
          }
        }())) {
          a__7458[i__7460] = cljs.core.first(s__7461);
          var G__7465 = i__7460 + 1;
          var G__7466 = cljs.core.next(s__7461);
          i__7460 = G__7465;
          s__7461 = G__7466;
          continue
        }else {
          return a__7458
        }
        break
      }
    }else {
      var n__2555__auto____7463 = size;
      var i__7464 = 0;
      while(true) {
        if(i__7464 < n__2555__auto____7463) {
          a__7458[i__7464] = init_val_or_seq;
          var G__7467 = i__7464 + 1;
          i__7464 = G__7467;
          continue
        }else {
        }
        break
      }
      return a__7458
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
  if(cljs.core.counted_QMARK_(s)) {
    return cljs.core.count(s)
  }else {
    var s__7472 = s;
    var i__7473 = n;
    var sum__7474 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7475 = i__7473 > 0;
        if(and__3822__auto____7475) {
          return cljs.core.seq(s__7472)
        }else {
          return and__3822__auto____7475
        }
      }())) {
        var G__7476 = cljs.core.next(s__7472);
        var G__7477 = i__7473 - 1;
        var G__7478 = sum__7474 + 1;
        s__7472 = G__7476;
        i__7473 = G__7477;
        sum__7474 = G__7478;
        continue
      }else {
        return sum__7474
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next(arglist) == null) {
      return cljs.core.seq(cljs.core.first(arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons(cljs.core.first(arglist), spread(cljs.core.next(arglist)))
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
      var s__7483 = cljs.core.seq(x);
      if(s__7483) {
        if(cljs.core.chunked_seq_QMARK_(s__7483)) {
          return cljs.core.chunk_cons(cljs.core.chunk_first(s__7483), concat.cljs$lang$arity$2(cljs.core.chunk_rest(s__7483), y))
        }else {
          return cljs.core.cons(cljs.core.first(s__7483), concat.cljs$lang$arity$2(cljs.core.rest(s__7483), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7487__delegate = function(x, y, zs) {
      var cat__7486 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7485 = cljs.core.seq(xys);
          if(xys__7485) {
            if(cljs.core.chunked_seq_QMARK_(xys__7485)) {
              return cljs.core.chunk_cons(cljs.core.chunk_first(xys__7485), cat(cljs.core.chunk_rest(xys__7485), zs))
            }else {
              return cljs.core.cons(cljs.core.first(xys__7485), cat(cljs.core.rest(xys__7485), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat(cljs.core.first(zs), cljs.core.next(zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7486.cljs$lang$arity$2 ? cat__7486.cljs$lang$arity$2(concat.cljs$lang$arity$2(x, y), zs) : cat__7486.call(null, concat.cljs$lang$arity$2(x, y), zs)
    };
    var G__7487 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7487__delegate.call(this, x, y, zs)
    };
    G__7487.cljs$lang$maxFixedArity = 2;
    G__7487.cljs$lang$applyTo = function(arglist__7488) {
      var x = cljs.core.first(arglist__7488);
      var y = cljs.core.first(cljs.core.next(arglist__7488));
      var zs = cljs.core.rest(cljs.core.next(arglist__7488));
      return G__7487__delegate(x, y, zs)
    };
    G__7487.cljs$lang$arity$variadic = G__7487__delegate;
    return G__7487
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
    return cljs.core.seq(args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons(a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons(a, cljs.core.cons(b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, args)))
  };
  var list_STAR___5 = function() {
    var G__7489__delegate = function(a, b, c, d, more) {
      return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(more)))))
    };
    var G__7489 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7489__delegate.call(this, a, b, c, d, more)
    };
    G__7489.cljs$lang$maxFixedArity = 4;
    G__7489.cljs$lang$applyTo = function(arglist__7490) {
      var a = cljs.core.first(arglist__7490);
      var b = cljs.core.first(cljs.core.next(arglist__7490));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7490)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7490))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7490))));
      return G__7489__delegate(a, b, c, d, more)
    };
    G__7489.cljs$lang$arity$variadic = G__7489__delegate;
    return G__7489
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
  return cljs.core._as_transient(coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_(tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_(tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_(tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_(tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_(tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_(tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7532 = cljs.core.seq(args);
  if(argc === 0) {
    return f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)
  }else {
    var a__7533 = cljs.core._first(args__7532);
    var args__7534 = cljs.core._rest(args__7532);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7533)
      }else {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a__7533) : f.call(null, a__7533)
      }
    }else {
      var b__7535 = cljs.core._first(args__7534);
      var args__7536 = cljs.core._rest(args__7534);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7533, b__7535)
        }else {
          return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a__7533, b__7535) : f.call(null, a__7533, b__7535)
        }
      }else {
        var c__7537 = cljs.core._first(args__7536);
        var args__7538 = cljs.core._rest(args__7536);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7533, b__7535, c__7537)
          }else {
            return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a__7533, b__7535, c__7537) : f.call(null, a__7533, b__7535, c__7537)
          }
        }else {
          var d__7539 = cljs.core._first(args__7538);
          var args__7540 = cljs.core._rest(args__7538);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7533, b__7535, c__7537, d__7539)
            }else {
              return f.cljs$lang$arity$4 ? f.cljs$lang$arity$4(a__7533, b__7535, c__7537, d__7539) : f.call(null, a__7533, b__7535, c__7537, d__7539)
            }
          }else {
            var e__7541 = cljs.core._first(args__7540);
            var args__7542 = cljs.core._rest(args__7540);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7533, b__7535, c__7537, d__7539, e__7541)
              }else {
                return f.cljs$lang$arity$5 ? f.cljs$lang$arity$5(a__7533, b__7535, c__7537, d__7539, e__7541) : f.call(null, a__7533, b__7535, c__7537, d__7539, e__7541)
              }
            }else {
              var f__7543 = cljs.core._first(args__7542);
              var args__7544 = cljs.core._rest(args__7542);
              if(argc === 6) {
                if(f__7543.cljs$lang$arity$6) {
                  return f__7543.cljs$lang$arity$6(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543)
                }else {
                  return f__7543.cljs$lang$arity$6 ? f__7543.cljs$lang$arity$6(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543)
                }
              }else {
                var g__7545 = cljs.core._first(args__7544);
                var args__7546 = cljs.core._rest(args__7544);
                if(argc === 7) {
                  if(f__7543.cljs$lang$arity$7) {
                    return f__7543.cljs$lang$arity$7(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545)
                  }else {
                    return f__7543.cljs$lang$arity$7 ? f__7543.cljs$lang$arity$7(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545)
                  }
                }else {
                  var h__7547 = cljs.core._first(args__7546);
                  var args__7548 = cljs.core._rest(args__7546);
                  if(argc === 8) {
                    if(f__7543.cljs$lang$arity$8) {
                      return f__7543.cljs$lang$arity$8(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547)
                    }else {
                      return f__7543.cljs$lang$arity$8 ? f__7543.cljs$lang$arity$8(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547)
                    }
                  }else {
                    var i__7549 = cljs.core._first(args__7548);
                    var args__7550 = cljs.core._rest(args__7548);
                    if(argc === 9) {
                      if(f__7543.cljs$lang$arity$9) {
                        return f__7543.cljs$lang$arity$9(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549)
                      }else {
                        return f__7543.cljs$lang$arity$9 ? f__7543.cljs$lang$arity$9(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549)
                      }
                    }else {
                      var j__7551 = cljs.core._first(args__7550);
                      var args__7552 = cljs.core._rest(args__7550);
                      if(argc === 10) {
                        if(f__7543.cljs$lang$arity$10) {
                          return f__7543.cljs$lang$arity$10(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551)
                        }else {
                          return f__7543.cljs$lang$arity$10 ? f__7543.cljs$lang$arity$10(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551)
                        }
                      }else {
                        var k__7553 = cljs.core._first(args__7552);
                        var args__7554 = cljs.core._rest(args__7552);
                        if(argc === 11) {
                          if(f__7543.cljs$lang$arity$11) {
                            return f__7543.cljs$lang$arity$11(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553)
                          }else {
                            return f__7543.cljs$lang$arity$11 ? f__7543.cljs$lang$arity$11(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553)
                          }
                        }else {
                          var l__7555 = cljs.core._first(args__7554);
                          var args__7556 = cljs.core._rest(args__7554);
                          if(argc === 12) {
                            if(f__7543.cljs$lang$arity$12) {
                              return f__7543.cljs$lang$arity$12(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555)
                            }else {
                              return f__7543.cljs$lang$arity$12 ? f__7543.cljs$lang$arity$12(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555)
                            }
                          }else {
                            var m__7557 = cljs.core._first(args__7556);
                            var args__7558 = cljs.core._rest(args__7556);
                            if(argc === 13) {
                              if(f__7543.cljs$lang$arity$13) {
                                return f__7543.cljs$lang$arity$13(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557)
                              }else {
                                return f__7543.cljs$lang$arity$13 ? f__7543.cljs$lang$arity$13(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557)
                              }
                            }else {
                              var n__7559 = cljs.core._first(args__7558);
                              var args__7560 = cljs.core._rest(args__7558);
                              if(argc === 14) {
                                if(f__7543.cljs$lang$arity$14) {
                                  return f__7543.cljs$lang$arity$14(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559)
                                }else {
                                  return f__7543.cljs$lang$arity$14 ? f__7543.cljs$lang$arity$14(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559)
                                }
                              }else {
                                var o__7561 = cljs.core._first(args__7560);
                                var args__7562 = cljs.core._rest(args__7560);
                                if(argc === 15) {
                                  if(f__7543.cljs$lang$arity$15) {
                                    return f__7543.cljs$lang$arity$15(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561)
                                  }else {
                                    return f__7543.cljs$lang$arity$15 ? f__7543.cljs$lang$arity$15(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561)
                                  }
                                }else {
                                  var p__7563 = cljs.core._first(args__7562);
                                  var args__7564 = cljs.core._rest(args__7562);
                                  if(argc === 16) {
                                    if(f__7543.cljs$lang$arity$16) {
                                      return f__7543.cljs$lang$arity$16(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563)
                                    }else {
                                      return f__7543.cljs$lang$arity$16 ? f__7543.cljs$lang$arity$16(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563)
                                    }
                                  }else {
                                    var q__7565 = cljs.core._first(args__7564);
                                    var args__7566 = cljs.core._rest(args__7564);
                                    if(argc === 17) {
                                      if(f__7543.cljs$lang$arity$17) {
                                        return f__7543.cljs$lang$arity$17(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565)
                                      }else {
                                        return f__7543.cljs$lang$arity$17 ? f__7543.cljs$lang$arity$17(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565)
                                      }
                                    }else {
                                      var r__7567 = cljs.core._first(args__7566);
                                      var args__7568 = cljs.core._rest(args__7566);
                                      if(argc === 18) {
                                        if(f__7543.cljs$lang$arity$18) {
                                          return f__7543.cljs$lang$arity$18(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567)
                                        }else {
                                          return f__7543.cljs$lang$arity$18 ? f__7543.cljs$lang$arity$18(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567)
                                        }
                                      }else {
                                        var s__7569 = cljs.core._first(args__7568);
                                        var args__7570 = cljs.core._rest(args__7568);
                                        if(argc === 19) {
                                          if(f__7543.cljs$lang$arity$19) {
                                            return f__7543.cljs$lang$arity$19(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569)
                                          }else {
                                            return f__7543.cljs$lang$arity$19 ? f__7543.cljs$lang$arity$19(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569)
                                          }
                                        }else {
                                          var t__7571 = cljs.core._first(args__7570);
                                          var args__7572 = cljs.core._rest(args__7570);
                                          if(argc === 20) {
                                            if(f__7543.cljs$lang$arity$20) {
                                              return f__7543.cljs$lang$arity$20(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569, t__7571)
                                            }else {
                                              return f__7543.cljs$lang$arity$20 ? f__7543.cljs$lang$arity$20(a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569, t__7571) : f__7543.call(null, a__7533, b__7535, c__7537, d__7539, e__7541, f__7543, g__7545, h__7547, i__7549, j__7551, k__7553, l__7555, m__7557, n__7559, o__7561, p__7563, q__7565, r__7567, s__7569, t__7571)
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
    var fixed_arity__7587 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7588 = cljs.core.bounded_count(args, fixed_arity__7587 + 1);
      if(bc__7588 <= fixed_arity__7587) {
        return cljs.core.apply_to(f, bc__7588, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array(args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7589 = cljs.core.list_STAR_.cljs$lang$arity$2(x, args);
    var fixed_arity__7590 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7591 = cljs.core.bounded_count(arglist__7589, fixed_arity__7590 + 1);
      if(bc__7591 <= fixed_arity__7590) {
        return cljs.core.apply_to(f, bc__7591, arglist__7589)
      }else {
        return f.cljs$lang$applyTo(arglist__7589)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7589))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7592 = cljs.core.list_STAR_.cljs$lang$arity$3(x, y, args);
    var fixed_arity__7593 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7594 = cljs.core.bounded_count(arglist__7592, fixed_arity__7593 + 1);
      if(bc__7594 <= fixed_arity__7593) {
        return cljs.core.apply_to(f, bc__7594, arglist__7592)
      }else {
        return f.cljs$lang$applyTo(arglist__7592)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7592))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7595 = cljs.core.list_STAR_.cljs$lang$arity$4(x, y, z, args);
    var fixed_arity__7596 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7597 = cljs.core.bounded_count(arglist__7595, fixed_arity__7596 + 1);
      if(bc__7597 <= fixed_arity__7596) {
        return cljs.core.apply_to(f, bc__7597, arglist__7595)
      }else {
        return f.cljs$lang$applyTo(arglist__7595)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist__7595))
    }
  };
  var apply__6 = function() {
    var G__7601__delegate = function(f, a, b, c, d, args) {
      var arglist__7598 = cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(args)))));
      var fixed_arity__7599 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7600 = cljs.core.bounded_count(arglist__7598, fixed_arity__7599 + 1);
        if(bc__7600 <= fixed_arity__7599) {
          return cljs.core.apply_to(f, bc__7600, arglist__7598)
        }else {
          return f.cljs$lang$applyTo(arglist__7598)
        }
      }else {
        return f.apply(f, cljs.core.to_array(arglist__7598))
      }
    };
    var G__7601 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7601__delegate.call(this, f, a, b, c, d, args)
    };
    G__7601.cljs$lang$maxFixedArity = 5;
    G__7601.cljs$lang$applyTo = function(arglist__7602) {
      var f = cljs.core.first(arglist__7602);
      var a = cljs.core.first(cljs.core.next(arglist__7602));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7602)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7602))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7602)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7602)))));
      return G__7601__delegate(f, a, b, c, d, args)
    };
    G__7601.cljs$lang$arity$variadic = G__7601__delegate;
    return G__7601
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
    return cljs.core.with_meta(obj, cljs.core.apply.cljs$lang$arity$3(f, cljs.core.meta(obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7603) {
    var obj = cljs.core.first(arglist__7603);
    var f = cljs.core.first(cljs.core.next(arglist__7603));
    var args = cljs.core.rest(cljs.core.next(arglist__7603));
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
    return!cljs.core._EQ_.cljs$lang$arity$2(x, y)
  };
  var not_EQ___3 = function() {
    var G__7604__delegate = function(x, y, more) {
      return cljs.core.not(cljs.core.apply.cljs$lang$arity$4(cljs.core._EQ_, x, y, more))
    };
    var G__7604 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7604__delegate.call(this, x, y, more)
    };
    G__7604.cljs$lang$maxFixedArity = 2;
    G__7604.cljs$lang$applyTo = function(arglist__7605) {
      var x = cljs.core.first(arglist__7605);
      var y = cljs.core.first(cljs.core.next(arglist__7605));
      var more = cljs.core.rest(cljs.core.next(arglist__7605));
      return G__7604__delegate(x, y, more)
    };
    G__7604.cljs$lang$arity$variadic = G__7604__delegate;
    return G__7604
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
  if(cljs.core.seq(coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll)))) {
        var G__7606 = pred;
        var G__7607 = cljs.core.next(coll);
        pred = G__7606;
        coll = G__7607;
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
  return!cljs.core.every_QMARK_(pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll)) {
      var or__3824__auto____7609 = pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll));
      if(cljs.core.truth_(or__3824__auto____7609)) {
        return or__3824__auto____7609
      }else {
        var G__7610 = pred;
        var G__7611 = cljs.core.next(coll);
        pred = G__7610;
        coll = G__7611;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not(cljs.core.some(pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_(n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_(n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7612 = null;
    var G__7612__0 = function() {
      return cljs.core.not(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null))
    };
    var G__7612__1 = function(x) {
      return cljs.core.not(f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x))
    };
    var G__7612__2 = function(x, y) {
      return cljs.core.not(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y))
    };
    var G__7612__3 = function() {
      var G__7613__delegate = function(x, y, zs) {
        return cljs.core.not(cljs.core.apply.cljs$lang$arity$4(f, x, y, zs))
      };
      var G__7613 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7613__delegate.call(this, x, y, zs)
      };
      G__7613.cljs$lang$maxFixedArity = 2;
      G__7613.cljs$lang$applyTo = function(arglist__7614) {
        var x = cljs.core.first(arglist__7614);
        var y = cljs.core.first(cljs.core.next(arglist__7614));
        var zs = cljs.core.rest(cljs.core.next(arglist__7614));
        return G__7613__delegate(x, y, zs)
      };
      G__7613.cljs$lang$arity$variadic = G__7613__delegate;
      return G__7613
    }();
    G__7612 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7612__0.call(this);
        case 1:
          return G__7612__1.call(this, x);
        case 2:
          return G__7612__2.call(this, x, y);
        default:
          return G__7612__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7612.cljs$lang$maxFixedArity = 2;
    G__7612.cljs$lang$applyTo = G__7612__3.cljs$lang$applyTo;
    return G__7612
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7615__delegate = function(args) {
      return x
    };
    var G__7615 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7615__delegate.call(this, args)
    };
    G__7615.cljs$lang$maxFixedArity = 0;
    G__7615.cljs$lang$applyTo = function(arglist__7616) {
      var args = cljs.core.seq(arglist__7616);
      return G__7615__delegate(args)
    };
    G__7615.cljs$lang$arity$variadic = G__7615__delegate;
    return G__7615
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
      var G__7623 = null;
      var G__7623__0 = function() {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null)) : f.call(null, g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null))
      };
      var G__7623__1 = function(x) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x)) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x))
      };
      var G__7623__2 = function(x, y) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y)) : f.call(null, g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y))
      };
      var G__7623__3 = function(x, y, z) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z)) : f.call(null, g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z))
      };
      var G__7623__4 = function() {
        var G__7624__delegate = function(x, y, z, args) {
          return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args)) : f.call(null, cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args))
        };
        var G__7624 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7624__delegate.call(this, x, y, z, args)
        };
        G__7624.cljs$lang$maxFixedArity = 3;
        G__7624.cljs$lang$applyTo = function(arglist__7625) {
          var x = cljs.core.first(arglist__7625);
          var y = cljs.core.first(cljs.core.next(arglist__7625));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7625)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7625)));
          return G__7624__delegate(x, y, z, args)
        };
        G__7624.cljs$lang$arity$variadic = G__7624__delegate;
        return G__7624
      }();
      G__7623 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7623__0.call(this);
          case 1:
            return G__7623__1.call(this, x);
          case 2:
            return G__7623__2.call(this, x, y);
          case 3:
            return G__7623__3.call(this, x, y, z);
          default:
            return G__7623__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7623.cljs$lang$maxFixedArity = 3;
      G__7623.cljs$lang$applyTo = G__7623__4.cljs$lang$applyTo;
      return G__7623
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7626 = null;
      var G__7626__0 = function() {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)) : g.call(null, h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)) : g.call(null, h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)))
      };
      var G__7626__1 = function(x) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)) : g.call(null, h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)) : g.call(null, h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)))
      };
      var G__7626__2 = function(x, y) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)) : g.call(null, h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)) : g.call(null, h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)))
      };
      var G__7626__3 = function(x, y, z) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)))
      };
      var G__7626__4 = function() {
        var G__7627__delegate = function(x, y, z, args) {
          return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args))) : f.call(null, g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)))
        };
        var G__7627 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7627__delegate.call(this, x, y, z, args)
        };
        G__7627.cljs$lang$maxFixedArity = 3;
        G__7627.cljs$lang$applyTo = function(arglist__7628) {
          var x = cljs.core.first(arglist__7628);
          var y = cljs.core.first(cljs.core.next(arglist__7628));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7628)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7628)));
          return G__7627__delegate(x, y, z, args)
        };
        G__7627.cljs$lang$arity$variadic = G__7627__delegate;
        return G__7627
      }();
      G__7626 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7626__0.call(this);
          case 1:
            return G__7626__1.call(this, x);
          case 2:
            return G__7626__2.call(this, x, y);
          case 3:
            return G__7626__3.call(this, x, y, z);
          default:
            return G__7626__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7626.cljs$lang$maxFixedArity = 3;
      G__7626.cljs$lang$applyTo = G__7626__4.cljs$lang$applyTo;
      return G__7626
    }()
  };
  var comp__4 = function() {
    var G__7629__delegate = function(f1, f2, f3, fs) {
      var fs__7620 = cljs.core.reverse(cljs.core.list_STAR_.cljs$lang$arity$4(f1, f2, f3, fs));
      return function() {
        var G__7630__delegate = function(args) {
          var ret__7621 = cljs.core.apply.cljs$lang$arity$2(cljs.core.first(fs__7620), args);
          var fs__7622 = cljs.core.next(fs__7620);
          while(true) {
            if(fs__7622) {
              var G__7631 = cljs.core.first(fs__7622).call(null, ret__7621);
              var G__7632 = cljs.core.next(fs__7622);
              ret__7621 = G__7631;
              fs__7622 = G__7632;
              continue
            }else {
              return ret__7621
            }
            break
          }
        };
        var G__7630 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7630__delegate.call(this, args)
        };
        G__7630.cljs$lang$maxFixedArity = 0;
        G__7630.cljs$lang$applyTo = function(arglist__7633) {
          var args = cljs.core.seq(arglist__7633);
          return G__7630__delegate(args)
        };
        G__7630.cljs$lang$arity$variadic = G__7630__delegate;
        return G__7630
      }()
    };
    var G__7629 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7629__delegate.call(this, f1, f2, f3, fs)
    };
    G__7629.cljs$lang$maxFixedArity = 3;
    G__7629.cljs$lang$applyTo = function(arglist__7634) {
      var f1 = cljs.core.first(arglist__7634);
      var f2 = cljs.core.first(cljs.core.next(arglist__7634));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7634)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7634)));
      return G__7629__delegate(f1, f2, f3, fs)
    };
    G__7629.cljs$lang$arity$variadic = G__7629__delegate;
    return G__7629
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
      var G__7635__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$3(f, arg1, args)
      };
      var G__7635 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7635__delegate.call(this, args)
      };
      G__7635.cljs$lang$maxFixedArity = 0;
      G__7635.cljs$lang$applyTo = function(arglist__7636) {
        var args = cljs.core.seq(arglist__7636);
        return G__7635__delegate(args)
      };
      G__7635.cljs$lang$arity$variadic = G__7635__delegate;
      return G__7635
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7637__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$4(f, arg1, arg2, args)
      };
      var G__7637 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7637__delegate.call(this, args)
      };
      G__7637.cljs$lang$maxFixedArity = 0;
      G__7637.cljs$lang$applyTo = function(arglist__7638) {
        var args = cljs.core.seq(arglist__7638);
        return G__7637__delegate(args)
      };
      G__7637.cljs$lang$arity$variadic = G__7637__delegate;
      return G__7637
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7639__delegate = function(args) {
        return cljs.core.apply.cljs$lang$arity$5(f, arg1, arg2, arg3, args)
      };
      var G__7639 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7639__delegate.call(this, args)
      };
      G__7639.cljs$lang$maxFixedArity = 0;
      G__7639.cljs$lang$applyTo = function(arglist__7640) {
        var args = cljs.core.seq(arglist__7640);
        return G__7639__delegate(args)
      };
      G__7639.cljs$lang$arity$variadic = G__7639__delegate;
      return G__7639
    }()
  };
  var partial__5 = function() {
    var G__7641__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7642__delegate = function(args) {
          return cljs.core.apply.cljs$lang$arity$5(f, arg1, arg2, arg3, cljs.core.concat.cljs$lang$arity$2(more, args))
        };
        var G__7642 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7642__delegate.call(this, args)
        };
        G__7642.cljs$lang$maxFixedArity = 0;
        G__7642.cljs$lang$applyTo = function(arglist__7643) {
          var args = cljs.core.seq(arglist__7643);
          return G__7642__delegate(args)
        };
        G__7642.cljs$lang$arity$variadic = G__7642__delegate;
        return G__7642
      }()
    };
    var G__7641 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7641__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7641.cljs$lang$maxFixedArity = 4;
    G__7641.cljs$lang$applyTo = function(arglist__7644) {
      var f = cljs.core.first(arglist__7644);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7644));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7644)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7644))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7644))));
      return G__7641__delegate(f, arg1, arg2, arg3, more)
    };
    G__7641.cljs$lang$arity$variadic = G__7641__delegate;
    return G__7641
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
      var G__7645 = null;
      var G__7645__1 = function(a) {
        return f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a == null ? x : a) : f.call(null, a == null ? x : a)
      };
      var G__7645__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b) : f.call(null, a == null ? x : a, b)
      };
      var G__7645__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b, c) : f.call(null, a == null ? x : a, b, c)
      };
      var G__7645__4 = function() {
        var G__7646__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b, c, ds)
        };
        var G__7646 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7646__delegate.call(this, a, b, c, ds)
        };
        G__7646.cljs$lang$maxFixedArity = 3;
        G__7646.cljs$lang$applyTo = function(arglist__7647) {
          var a = cljs.core.first(arglist__7647);
          var b = cljs.core.first(cljs.core.next(arglist__7647));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7647)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7647)));
          return G__7646__delegate(a, b, c, ds)
        };
        G__7646.cljs$lang$arity$variadic = G__7646__delegate;
        return G__7646
      }();
      G__7645 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7645__1.call(this, a);
          case 2:
            return G__7645__2.call(this, a, b);
          case 3:
            return G__7645__3.call(this, a, b, c);
          default:
            return G__7645__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7645.cljs$lang$maxFixedArity = 3;
      G__7645.cljs$lang$applyTo = G__7645__4.cljs$lang$applyTo;
      return G__7645
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7648 = null;
      var G__7648__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7648__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b == null ? y : b, c) : f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7648__4 = function() {
        var G__7649__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7649 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7649__delegate.call(this, a, b, c, ds)
        };
        G__7649.cljs$lang$maxFixedArity = 3;
        G__7649.cljs$lang$applyTo = function(arglist__7650) {
          var a = cljs.core.first(arglist__7650);
          var b = cljs.core.first(cljs.core.next(arglist__7650));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7650)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7650)));
          return G__7649__delegate(a, b, c, ds)
        };
        G__7649.cljs$lang$arity$variadic = G__7649__delegate;
        return G__7649
      }();
      G__7648 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7648__2.call(this, a, b);
          case 3:
            return G__7648__3.call(this, a, b, c);
          default:
            return G__7648__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7648.cljs$lang$maxFixedArity = 3;
      G__7648.cljs$lang$applyTo = G__7648__4.cljs$lang$applyTo;
      return G__7648
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7651 = null;
      var G__7651__2 = function(a, b) {
        return f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7651__3 = function(a, b, c) {
        return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a == null ? x : a, b == null ? y : b, c == null ? z : c) : f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7651__4 = function() {
        var G__7652__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$lang$arity$5(f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7652 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7652__delegate.call(this, a, b, c, ds)
        };
        G__7652.cljs$lang$maxFixedArity = 3;
        G__7652.cljs$lang$applyTo = function(arglist__7653) {
          var a = cljs.core.first(arglist__7653);
          var b = cljs.core.first(cljs.core.next(arglist__7653));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7653)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7653)));
          return G__7652__delegate(a, b, c, ds)
        };
        G__7652.cljs$lang$arity$variadic = G__7652__delegate;
        return G__7652
      }();
      G__7651 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7651__2.call(this, a, b);
          case 3:
            return G__7651__3.call(this, a, b, c);
          default:
            return G__7651__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7651.cljs$lang$maxFixedArity = 3;
      G__7651.cljs$lang$applyTo = G__7651__4.cljs$lang$applyTo;
      return G__7651
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
  var mapi__7669 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7677 = cljs.core.seq(coll);
      if(temp__3974__auto____7677) {
        var s__7678 = temp__3974__auto____7677;
        if(cljs.core.chunked_seq_QMARK_(s__7678)) {
          var c__7679 = cljs.core.chunk_first(s__7678);
          var size__7680 = cljs.core.count(c__7679);
          var b__7681 = cljs.core.chunk_buffer(size__7680);
          var n__2555__auto____7682 = size__7680;
          var i__7683 = 0;
          while(true) {
            if(i__7683 < n__2555__auto____7682) {
              cljs.core.chunk_append(b__7681, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx + i__7683, cljs.core._nth.cljs$lang$arity$2(c__7679, i__7683)) : f.call(null, idx + i__7683, cljs.core._nth.cljs$lang$arity$2(c__7679, i__7683)));
              var G__7684 = i__7683 + 1;
              i__7683 = G__7684;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__7681), mapi(idx + size__7680, cljs.core.chunk_rest(s__7678)))
        }else {
          return cljs.core.cons(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx, cljs.core.first(s__7678)) : f.call(null, idx, cljs.core.first(s__7678)), mapi(idx + 1, cljs.core.rest(s__7678)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7669.cljs$lang$arity$2 ? mapi__7669.cljs$lang$arity$2(0, coll) : mapi__7669.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____7694 = cljs.core.seq(coll);
    if(temp__3974__auto____7694) {
      var s__7695 = temp__3974__auto____7694;
      if(cljs.core.chunked_seq_QMARK_(s__7695)) {
        var c__7696 = cljs.core.chunk_first(s__7695);
        var size__7697 = cljs.core.count(c__7696);
        var b__7698 = cljs.core.chunk_buffer(size__7697);
        var n__2555__auto____7699 = size__7697;
        var i__7700 = 0;
        while(true) {
          if(i__7700 < n__2555__auto____7699) {
            var x__7701 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__7696, i__7700)) : f.call(null, cljs.core._nth.cljs$lang$arity$2(c__7696, i__7700));
            if(x__7701 == null) {
            }else {
              cljs.core.chunk_append(b__7698, x__7701)
            }
            var G__7703 = i__7700 + 1;
            i__7700 = G__7703;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b__7698), keep(f, cljs.core.chunk_rest(s__7695)))
      }else {
        var x__7702 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.first(s__7695)) : f.call(null, cljs.core.first(s__7695));
        if(x__7702 == null) {
          return keep(f, cljs.core.rest(s__7695))
        }else {
          return cljs.core.cons(x__7702, keep(f, cljs.core.rest(s__7695)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7729 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____7739 = cljs.core.seq(coll);
      if(temp__3974__auto____7739) {
        var s__7740 = temp__3974__auto____7739;
        if(cljs.core.chunked_seq_QMARK_(s__7740)) {
          var c__7741 = cljs.core.chunk_first(s__7740);
          var size__7742 = cljs.core.count(c__7741);
          var b__7743 = cljs.core.chunk_buffer(size__7742);
          var n__2555__auto____7744 = size__7742;
          var i__7745 = 0;
          while(true) {
            if(i__7745 < n__2555__auto____7744) {
              var x__7746 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx + i__7745, cljs.core._nth.cljs$lang$arity$2(c__7741, i__7745)) : f.call(null, idx + i__7745, cljs.core._nth.cljs$lang$arity$2(c__7741, i__7745));
              if(x__7746 == null) {
              }else {
                cljs.core.chunk_append(b__7743, x__7746)
              }
              var G__7748 = i__7745 + 1;
              i__7745 = G__7748;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__7743), keepi(idx + size__7742, cljs.core.chunk_rest(s__7740)))
        }else {
          var x__7747 = f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(idx, cljs.core.first(s__7740)) : f.call(null, idx, cljs.core.first(s__7740));
          if(x__7747 == null) {
            return keepi(idx + 1, cljs.core.rest(s__7740))
          }else {
            return cljs.core.cons(x__7747, keepi(idx + 1, cljs.core.rest(s__7740)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7729.cljs$lang$arity$2 ? keepi__7729.cljs$lang$arity$2(0, coll) : keepi__7729.call(null, 0, coll)
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
        return cljs.core.boolean$(p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7834 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7834)) {
            return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y)
          }else {
            return and__3822__auto____7834
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7835 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7835)) {
            var and__3822__auto____7836 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7836)) {
              return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(z) : p.call(null, z)
            }else {
              return and__3822__auto____7836
            }
          }else {
            return and__3822__auto____7835
          }
        }())
      };
      var ep1__4 = function() {
        var G__7905__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7837 = ep1.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7837)) {
              return cljs.core.every_QMARK_(p, args)
            }else {
              return and__3822__auto____7837
            }
          }())
        };
        var G__7905 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7905__delegate.call(this, x, y, z, args)
        };
        G__7905.cljs$lang$maxFixedArity = 3;
        G__7905.cljs$lang$applyTo = function(arglist__7906) {
          var x = cljs.core.first(arglist__7906);
          var y = cljs.core.first(cljs.core.next(arglist__7906));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7906)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7906)));
          return G__7905__delegate(x, y, z, args)
        };
        G__7905.cljs$lang$arity$variadic = G__7905__delegate;
        return G__7905
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
        return cljs.core.boolean$(function() {
          var and__3822__auto____7849 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7849)) {
            return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x)
          }else {
            return and__3822__auto____7849
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7850 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7850)) {
            var and__3822__auto____7851 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7851)) {
              var and__3822__auto____7852 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7852)) {
                return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y)
              }else {
                return and__3822__auto____7852
              }
            }else {
              return and__3822__auto____7851
            }
          }else {
            return and__3822__auto____7850
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7853 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7853)) {
            var and__3822__auto____7854 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____7854)) {
              var and__3822__auto____7855 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____7855)) {
                var and__3822__auto____7856 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____7856)) {
                  var and__3822__auto____7857 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7857)) {
                    return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z)
                  }else {
                    return and__3822__auto____7857
                  }
                }else {
                  return and__3822__auto____7856
                }
              }else {
                return and__3822__auto____7855
              }
            }else {
              return and__3822__auto____7854
            }
          }else {
            return and__3822__auto____7853
          }
        }())
      };
      var ep2__4 = function() {
        var G__7907__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7858 = ep2.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7858)) {
              return cljs.core.every_QMARK_(function(p1__7704_SHARP_) {
                var and__3822__auto____7859 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7704_SHARP_) : p1.call(null, p1__7704_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7859)) {
                  return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7704_SHARP_) : p2.call(null, p1__7704_SHARP_)
                }else {
                  return and__3822__auto____7859
                }
              }, args)
            }else {
              return and__3822__auto____7858
            }
          }())
        };
        var G__7907 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7907__delegate.call(this, x, y, z, args)
        };
        G__7907.cljs$lang$maxFixedArity = 3;
        G__7907.cljs$lang$applyTo = function(arglist__7908) {
          var x = cljs.core.first(arglist__7908);
          var y = cljs.core.first(cljs.core.next(arglist__7908));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7908)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7908)));
          return G__7907__delegate(x, y, z, args)
        };
        G__7907.cljs$lang$arity$variadic = G__7907__delegate;
        return G__7907
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
        return cljs.core.boolean$(function() {
          var and__3822__auto____7878 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7878)) {
            var and__3822__auto____7879 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7879)) {
              return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x)
            }else {
              return and__3822__auto____7879
            }
          }else {
            return and__3822__auto____7878
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7880 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7880)) {
            var and__3822__auto____7881 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7881)) {
              var and__3822__auto____7882 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7882)) {
                var and__3822__auto____7883 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7883)) {
                  var and__3822__auto____7884 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7884)) {
                    return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y)
                  }else {
                    return and__3822__auto____7884
                  }
                }else {
                  return and__3822__auto____7883
                }
              }else {
                return and__3822__auto____7882
              }
            }else {
              return and__3822__auto____7881
            }
          }else {
            return and__3822__auto____7880
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3822__auto____7885 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____7885)) {
            var and__3822__auto____7886 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7886)) {
              var and__3822__auto____7887 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____7887)) {
                var and__3822__auto____7888 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____7888)) {
                  var and__3822__auto____7889 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____7889)) {
                    var and__3822__auto____7890 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____7890)) {
                      var and__3822__auto____7891 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____7891)) {
                        var and__3822__auto____7892 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____7892)) {
                          return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(z) : p3.call(null, z)
                        }else {
                          return and__3822__auto____7892
                        }
                      }else {
                        return and__3822__auto____7891
                      }
                    }else {
                      return and__3822__auto____7890
                    }
                  }else {
                    return and__3822__auto____7889
                  }
                }else {
                  return and__3822__auto____7888
                }
              }else {
                return and__3822__auto____7887
              }
            }else {
              return and__3822__auto____7886
            }
          }else {
            return and__3822__auto____7885
          }
        }())
      };
      var ep3__4 = function() {
        var G__7909__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3822__auto____7893 = ep3.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(and__3822__auto____7893)) {
              return cljs.core.every_QMARK_(function(p1__7705_SHARP_) {
                var and__3822__auto____7894 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7705_SHARP_) : p1.call(null, p1__7705_SHARP_);
                if(cljs.core.truth_(and__3822__auto____7894)) {
                  var and__3822__auto____7895 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7705_SHARP_) : p2.call(null, p1__7705_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____7895)) {
                    return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(p1__7705_SHARP_) : p3.call(null, p1__7705_SHARP_)
                  }else {
                    return and__3822__auto____7895
                  }
                }else {
                  return and__3822__auto____7894
                }
              }, args)
            }else {
              return and__3822__auto____7893
            }
          }())
        };
        var G__7909 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7909__delegate.call(this, x, y, z, args)
        };
        G__7909.cljs$lang$maxFixedArity = 3;
        G__7909.cljs$lang$applyTo = function(arglist__7910) {
          var x = cljs.core.first(arglist__7910);
          var y = cljs.core.first(cljs.core.next(arglist__7910));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7910)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7910)));
          return G__7909__delegate(x, y, z, args)
        };
        G__7909.cljs$lang$arity$variadic = G__7909__delegate;
        return G__7909
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
    var G__7911__delegate = function(p1, p2, p3, ps) {
      var ps__7896 = cljs.core.list_STAR_.cljs$lang$arity$4(p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_(function(p1__7706_SHARP_) {
            return p1__7706_SHARP_.cljs$lang$arity$1 ? p1__7706_SHARP_.cljs$lang$arity$1(x) : p1__7706_SHARP_.call(null, x)
          }, ps__7896)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_(function(p1__7707_SHARP_) {
            var and__3822__auto____7901 = p1__7707_SHARP_.cljs$lang$arity$1 ? p1__7707_SHARP_.cljs$lang$arity$1(x) : p1__7707_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7901)) {
              return p1__7707_SHARP_.cljs$lang$arity$1 ? p1__7707_SHARP_.cljs$lang$arity$1(y) : p1__7707_SHARP_.call(null, y)
            }else {
              return and__3822__auto____7901
            }
          }, ps__7896)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_(function(p1__7708_SHARP_) {
            var and__3822__auto____7902 = p1__7708_SHARP_.cljs$lang$arity$1 ? p1__7708_SHARP_.cljs$lang$arity$1(x) : p1__7708_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____7902)) {
              var and__3822__auto____7903 = p1__7708_SHARP_.cljs$lang$arity$1 ? p1__7708_SHARP_.cljs$lang$arity$1(y) : p1__7708_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____7903)) {
                return p1__7708_SHARP_.cljs$lang$arity$1 ? p1__7708_SHARP_.cljs$lang$arity$1(z) : p1__7708_SHARP_.call(null, z)
              }else {
                return and__3822__auto____7903
              }
            }else {
              return and__3822__auto____7902
            }
          }, ps__7896)
        };
        var epn__4 = function() {
          var G__7912__delegate = function(x, y, z, args) {
            return cljs.core.boolean$(function() {
              var and__3822__auto____7904 = epn.cljs$lang$arity$3(x, y, z);
              if(cljs.core.truth_(and__3822__auto____7904)) {
                return cljs.core.every_QMARK_(function(p1__7709_SHARP_) {
                  return cljs.core.every_QMARK_(p1__7709_SHARP_, args)
                }, ps__7896)
              }else {
                return and__3822__auto____7904
              }
            }())
          };
          var G__7912 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7912__delegate.call(this, x, y, z, args)
          };
          G__7912.cljs$lang$maxFixedArity = 3;
          G__7912.cljs$lang$applyTo = function(arglist__7913) {
            var x = cljs.core.first(arglist__7913);
            var y = cljs.core.first(cljs.core.next(arglist__7913));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7913)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7913)));
            return G__7912__delegate(x, y, z, args)
          };
          G__7912.cljs$lang$arity$variadic = G__7912__delegate;
          return G__7912
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
    var G__7911 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7911__delegate.call(this, p1, p2, p3, ps)
    };
    G__7911.cljs$lang$maxFixedArity = 3;
    G__7911.cljs$lang$applyTo = function(arglist__7914) {
      var p1 = cljs.core.first(arglist__7914);
      var p2 = cljs.core.first(cljs.core.next(arglist__7914));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7914)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7914)));
      return G__7911__delegate(p1, p2, p3, ps)
    };
    G__7911.cljs$lang$arity$variadic = G__7911__delegate;
    return G__7911
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
        return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____7995 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7995)) {
          return or__3824__auto____7995
        }else {
          return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____7996 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____7996)) {
          return or__3824__auto____7996
        }else {
          var or__3824__auto____7997 = p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(y) : p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____7997)) {
            return or__3824__auto____7997
          }else {
            return p.cljs$lang$arity$1 ? p.cljs$lang$arity$1(z) : p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8066__delegate = function(x, y, z, args) {
          var or__3824__auto____7998 = sp1.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____7998)) {
            return or__3824__auto____7998
          }else {
            return cljs.core.some(p, args)
          }
        };
        var G__8066 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8066__delegate.call(this, x, y, z, args)
        };
        G__8066.cljs$lang$maxFixedArity = 3;
        G__8066.cljs$lang$applyTo = function(arglist__8067) {
          var x = cljs.core.first(arglist__8067);
          var y = cljs.core.first(cljs.core.next(arglist__8067));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8067)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8067)));
          return G__8066__delegate(x, y, z, args)
        };
        G__8066.cljs$lang$arity$variadic = G__8066__delegate;
        return G__8066
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
        var or__3824__auto____8010 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8010)) {
          return or__3824__auto____8010
        }else {
          return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8011 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8011)) {
          return or__3824__auto____8011
        }else {
          var or__3824__auto____8012 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8012)) {
            return or__3824__auto____8012
          }else {
            var or__3824__auto____8013 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8013)) {
              return or__3824__auto____8013
            }else {
              return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8014 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8014)) {
          return or__3824__auto____8014
        }else {
          var or__3824__auto____8015 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8015)) {
            return or__3824__auto____8015
          }else {
            var or__3824__auto____8016 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8016)) {
              return or__3824__auto____8016
            }else {
              var or__3824__auto____8017 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8017)) {
                return or__3824__auto____8017
              }else {
                var or__3824__auto____8018 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8018)) {
                  return or__3824__auto____8018
                }else {
                  return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8068__delegate = function(x, y, z, args) {
          var or__3824__auto____8019 = sp2.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____8019)) {
            return or__3824__auto____8019
          }else {
            return cljs.core.some(function(p1__7749_SHARP_) {
              var or__3824__auto____8020 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7749_SHARP_) : p1.call(null, p1__7749_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8020)) {
                return or__3824__auto____8020
              }else {
                return p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7749_SHARP_) : p2.call(null, p1__7749_SHARP_)
              }
            }, args)
          }
        };
        var G__8068 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8068__delegate.call(this, x, y, z, args)
        };
        G__8068.cljs$lang$maxFixedArity = 3;
        G__8068.cljs$lang$applyTo = function(arglist__8069) {
          var x = cljs.core.first(arglist__8069);
          var y = cljs.core.first(cljs.core.next(arglist__8069));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8069)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8069)));
          return G__8068__delegate(x, y, z, args)
        };
        G__8068.cljs$lang$arity$variadic = G__8068__delegate;
        return G__8068
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
        var or__3824__auto____8039 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8039)) {
          return or__3824__auto____8039
        }else {
          var or__3824__auto____8040 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8040)) {
            return or__3824__auto____8040
          }else {
            return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8041 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8041)) {
          return or__3824__auto____8041
        }else {
          var or__3824__auto____8042 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8042)) {
            return or__3824__auto____8042
          }else {
            var or__3824__auto____8043 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8043)) {
              return or__3824__auto____8043
            }else {
              var or__3824__auto____8044 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8044)) {
                return or__3824__auto____8044
              }else {
                var or__3824__auto____8045 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8045)) {
                  return or__3824__auto____8045
                }else {
                  return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8046 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8046)) {
          return or__3824__auto____8046
        }else {
          var or__3824__auto____8047 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8047)) {
            return or__3824__auto____8047
          }else {
            var or__3824__auto____8048 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8048)) {
              return or__3824__auto____8048
            }else {
              var or__3824__auto____8049 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8049)) {
                return or__3824__auto____8049
              }else {
                var or__3824__auto____8050 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8050)) {
                  return or__3824__auto____8050
                }else {
                  var or__3824__auto____8051 = p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(y) : p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8051)) {
                    return or__3824__auto____8051
                  }else {
                    var or__3824__auto____8052 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(z) : p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8052)) {
                      return or__3824__auto____8052
                    }else {
                      var or__3824__auto____8053 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(z) : p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8053)) {
                        return or__3824__auto____8053
                      }else {
                        return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(z) : p3.call(null, z)
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
        var G__8070__delegate = function(x, y, z, args) {
          var or__3824__auto____8054 = sp3.cljs$lang$arity$3(x, y, z);
          if(cljs.core.truth_(or__3824__auto____8054)) {
            return or__3824__auto____8054
          }else {
            return cljs.core.some(function(p1__7750_SHARP_) {
              var or__3824__auto____8055 = p1.cljs$lang$arity$1 ? p1.cljs$lang$arity$1(p1__7750_SHARP_) : p1.call(null, p1__7750_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8055)) {
                return or__3824__auto____8055
              }else {
                var or__3824__auto____8056 = p2.cljs$lang$arity$1 ? p2.cljs$lang$arity$1(p1__7750_SHARP_) : p2.call(null, p1__7750_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8056)) {
                  return or__3824__auto____8056
                }else {
                  return p3.cljs$lang$arity$1 ? p3.cljs$lang$arity$1(p1__7750_SHARP_) : p3.call(null, p1__7750_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8070 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8070__delegate.call(this, x, y, z, args)
        };
        G__8070.cljs$lang$maxFixedArity = 3;
        G__8070.cljs$lang$applyTo = function(arglist__8071) {
          var x = cljs.core.first(arglist__8071);
          var y = cljs.core.first(cljs.core.next(arglist__8071));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8071)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8071)));
          return G__8070__delegate(x, y, z, args)
        };
        G__8070.cljs$lang$arity$variadic = G__8070__delegate;
        return G__8070
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
    var G__8072__delegate = function(p1, p2, p3, ps) {
      var ps__8057 = cljs.core.list_STAR_.cljs$lang$arity$4(p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some(function(p1__7751_SHARP_) {
            return p1__7751_SHARP_.cljs$lang$arity$1 ? p1__7751_SHARP_.cljs$lang$arity$1(x) : p1__7751_SHARP_.call(null, x)
          }, ps__8057)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some(function(p1__7752_SHARP_) {
            var or__3824__auto____8062 = p1__7752_SHARP_.cljs$lang$arity$1 ? p1__7752_SHARP_.cljs$lang$arity$1(x) : p1__7752_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8062)) {
              return or__3824__auto____8062
            }else {
              return p1__7752_SHARP_.cljs$lang$arity$1 ? p1__7752_SHARP_.cljs$lang$arity$1(y) : p1__7752_SHARP_.call(null, y)
            }
          }, ps__8057)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some(function(p1__7753_SHARP_) {
            var or__3824__auto____8063 = p1__7753_SHARP_.cljs$lang$arity$1 ? p1__7753_SHARP_.cljs$lang$arity$1(x) : p1__7753_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8063)) {
              return or__3824__auto____8063
            }else {
              var or__3824__auto____8064 = p1__7753_SHARP_.cljs$lang$arity$1 ? p1__7753_SHARP_.cljs$lang$arity$1(y) : p1__7753_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8064)) {
                return or__3824__auto____8064
              }else {
                return p1__7753_SHARP_.cljs$lang$arity$1 ? p1__7753_SHARP_.cljs$lang$arity$1(z) : p1__7753_SHARP_.call(null, z)
              }
            }
          }, ps__8057)
        };
        var spn__4 = function() {
          var G__8073__delegate = function(x, y, z, args) {
            var or__3824__auto____8065 = spn.cljs$lang$arity$3(x, y, z);
            if(cljs.core.truth_(or__3824__auto____8065)) {
              return or__3824__auto____8065
            }else {
              return cljs.core.some(function(p1__7754_SHARP_) {
                return cljs.core.some(p1__7754_SHARP_, args)
              }, ps__8057)
            }
          };
          var G__8073 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8073__delegate.call(this, x, y, z, args)
          };
          G__8073.cljs$lang$maxFixedArity = 3;
          G__8073.cljs$lang$applyTo = function(arglist__8074) {
            var x = cljs.core.first(arglist__8074);
            var y = cljs.core.first(cljs.core.next(arglist__8074));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8074)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8074)));
            return G__8073__delegate(x, y, z, args)
          };
          G__8073.cljs$lang$arity$variadic = G__8073__delegate;
          return G__8073
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
    var G__8072 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8072__delegate.call(this, p1, p2, p3, ps)
    };
    G__8072.cljs$lang$maxFixedArity = 3;
    G__8072.cljs$lang$applyTo = function(arglist__8075) {
      var p1 = cljs.core.first(arglist__8075);
      var p2 = cljs.core.first(cljs.core.next(arglist__8075));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8075)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8075)));
      return G__8072__delegate(p1, p2, p3, ps)
    };
    G__8072.cljs$lang$arity$variadic = G__8072__delegate;
    return G__8072
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
      var temp__3974__auto____8094 = cljs.core.seq(coll);
      if(temp__3974__auto____8094) {
        var s__8095 = temp__3974__auto____8094;
        if(cljs.core.chunked_seq_QMARK_(s__8095)) {
          var c__8096 = cljs.core.chunk_first(s__8095);
          var size__8097 = cljs.core.count(c__8096);
          var b__8098 = cljs.core.chunk_buffer(size__8097);
          var n__2555__auto____8099 = size__8097;
          var i__8100 = 0;
          while(true) {
            if(i__8100 < n__2555__auto____8099) {
              cljs.core.chunk_append(b__8098, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__8096, i__8100)) : f.call(null, cljs.core._nth.cljs$lang$arity$2(c__8096, i__8100)));
              var G__8112 = i__8100 + 1;
              i__8100 = G__8112;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b__8098), map.cljs$lang$arity$2(f, cljs.core.chunk_rest(s__8095)))
        }else {
          return cljs.core.cons(f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(cljs.core.first(s__8095)) : f.call(null, cljs.core.first(s__8095)), map.cljs$lang$arity$2(f, cljs.core.rest(s__8095)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8101 = cljs.core.seq(c1);
      var s2__8102 = cljs.core.seq(c2);
      if(function() {
        var and__3822__auto____8103 = s1__8101;
        if(and__3822__auto____8103) {
          return s2__8102
        }else {
          return and__3822__auto____8103
        }
      }()) {
        return cljs.core.cons(f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(cljs.core.first(s1__8101), cljs.core.first(s2__8102)) : f.call(null, cljs.core.first(s1__8101), cljs.core.first(s2__8102)), map.cljs$lang$arity$3(f, cljs.core.rest(s1__8101), cljs.core.rest(s2__8102)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8104 = cljs.core.seq(c1);
      var s2__8105 = cljs.core.seq(c2);
      var s3__8106 = cljs.core.seq(c3);
      if(function() {
        var and__3822__auto____8107 = s1__8104;
        if(and__3822__auto____8107) {
          var and__3822__auto____8108 = s2__8105;
          if(and__3822__auto____8108) {
            return s3__8106
          }else {
            return and__3822__auto____8108
          }
        }else {
          return and__3822__auto____8107
        }
      }()) {
        return cljs.core.cons(f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(cljs.core.first(s1__8104), cljs.core.first(s2__8105), cljs.core.first(s3__8106)) : f.call(null, cljs.core.first(s1__8104), cljs.core.first(s2__8105), cljs.core.first(s3__8106)), map.cljs$lang$arity$4(f, cljs.core.rest(s1__8104), cljs.core.rest(s2__8105), cljs.core.rest(s3__8106)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8113__delegate = function(f, c1, c2, c3, colls) {
      var step__8111 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8110 = map.cljs$lang$arity$2(cljs.core.seq, cs);
          if(cljs.core.every_QMARK_(cljs.core.identity, ss__8110)) {
            return cljs.core.cons(map.cljs$lang$arity$2(cljs.core.first, ss__8110), step(map.cljs$lang$arity$2(cljs.core.rest, ss__8110)))
          }else {
            return null
          }
        }, null)
      };
      return map.cljs$lang$arity$2(function(p1__7915_SHARP_) {
        return cljs.core.apply.cljs$lang$arity$2(f, p1__7915_SHARP_)
      }, step__8111.cljs$lang$arity$1 ? step__8111.cljs$lang$arity$1(cljs.core.conj.cljs$lang$arity$variadic(colls, c3, cljs.core.array_seq([c2, c1], 0))) : step__8111.call(null, cljs.core.conj.cljs$lang$arity$variadic(colls, c3, cljs.core.array_seq([c2, c1], 0))))
    };
    var G__8113 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8113__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8113.cljs$lang$maxFixedArity = 4;
    G__8113.cljs$lang$applyTo = function(arglist__8114) {
      var f = cljs.core.first(arglist__8114);
      var c1 = cljs.core.first(cljs.core.next(arglist__8114));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8114)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8114))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8114))));
      return G__8113__delegate(f, c1, c2, c3, colls)
    };
    G__8113.cljs$lang$arity$variadic = G__8113__delegate;
    return G__8113
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
      var temp__3974__auto____8117 = cljs.core.seq(coll);
      if(temp__3974__auto____8117) {
        var s__8118 = temp__3974__auto____8117;
        return cljs.core.cons(cljs.core.first(s__8118), take(n - 1, cljs.core.rest(s__8118)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8124 = function(n, coll) {
    while(true) {
      var s__8122 = cljs.core.seq(coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8123 = n > 0;
        if(and__3822__auto____8123) {
          return s__8122
        }else {
          return and__3822__auto____8123
        }
      }())) {
        var G__8125 = n - 1;
        var G__8126 = cljs.core.rest(s__8122);
        n = G__8125;
        coll = G__8126;
        continue
      }else {
        return s__8122
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8124.cljs$lang$arity$2 ? step__8124.cljs$lang$arity$2(n, coll) : step__8124.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.cljs$lang$arity$2(1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.cljs$lang$arity$3(function(x, _) {
      return x
    }, s, cljs.core.drop(n, s))
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
  var s__8129 = cljs.core.seq(coll);
  var lead__8130 = cljs.core.seq(cljs.core.drop(n, coll));
  while(true) {
    if(lead__8130) {
      var G__8131 = cljs.core.next(s__8129);
      var G__8132 = cljs.core.next(lead__8130);
      s__8129 = G__8131;
      lead__8130 = G__8132;
      continue
    }else {
      return s__8129
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8138 = function(pred, coll) {
    while(true) {
      var s__8136 = cljs.core.seq(coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8137 = s__8136;
        if(and__3822__auto____8137) {
          return pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(s__8136)) : pred.call(null, cljs.core.first(s__8136))
        }else {
          return and__3822__auto____8137
        }
      }())) {
        var G__8139 = pred;
        var G__8140 = cljs.core.rest(s__8136);
        pred = G__8139;
        coll = G__8140;
        continue
      }else {
        return s__8136
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8138.cljs$lang$arity$2 ? step__8138.cljs$lang$arity$2(pred, coll) : step__8138.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8143 = cljs.core.seq(coll);
    if(temp__3974__auto____8143) {
      var s__8144 = temp__3974__auto____8143;
      return cljs.core.concat.cljs$lang$arity$2(s__8144, cycle(s__8144))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take(n, coll), cljs.core.drop(n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(x, repeat.cljs$lang$arity$1(x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take(n, repeat.cljs$lang$arity$1(x))
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
  return cljs.core.take(n, cljs.core.repeat.cljs$lang$arity$1(x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), repeatedly.cljs$lang$arity$1(f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take(n, repeatedly.cljs$lang$arity$1(f))
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
  return cljs.core.cons(x, new cljs.core.LazySeq(null, false, function() {
    return iterate(f, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8149 = cljs.core.seq(c1);
      var s2__8150 = cljs.core.seq(c2);
      if(function() {
        var and__3822__auto____8151 = s1__8149;
        if(and__3822__auto____8151) {
          return s2__8150
        }else {
          return and__3822__auto____8151
        }
      }()) {
        return cljs.core.cons(cljs.core.first(s1__8149), cljs.core.cons(cljs.core.first(s2__8150), interleave.cljs$lang$arity$2(cljs.core.rest(s1__8149), cljs.core.rest(s2__8150))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8153__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8152 = cljs.core.map.cljs$lang$arity$2(cljs.core.seq, cljs.core.conj.cljs$lang$arity$variadic(colls, c2, cljs.core.array_seq([c1], 0)));
        if(cljs.core.every_QMARK_(cljs.core.identity, ss__8152)) {
          return cljs.core.concat.cljs$lang$arity$2(cljs.core.map.cljs$lang$arity$2(cljs.core.first, ss__8152), cljs.core.apply.cljs$lang$arity$2(interleave, cljs.core.map.cljs$lang$arity$2(cljs.core.rest, ss__8152)))
        }else {
          return null
        }
      }, null)
    };
    var G__8153 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8153__delegate.call(this, c1, c2, colls)
    };
    G__8153.cljs$lang$maxFixedArity = 2;
    G__8153.cljs$lang$applyTo = function(arglist__8154) {
      var c1 = cljs.core.first(arglist__8154);
      var c2 = cljs.core.first(cljs.core.next(arglist__8154));
      var colls = cljs.core.rest(cljs.core.next(arglist__8154));
      return G__8153__delegate(c1, c2, colls)
    };
    G__8153.cljs$lang$arity$variadic = G__8153__delegate;
    return G__8153
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
  return cljs.core.drop(1, cljs.core.interleave.cljs$lang$arity$2(cljs.core.repeat.cljs$lang$arity$1(sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8164 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8162 = cljs.core.seq(coll);
      if(temp__3971__auto____8162) {
        var coll__8163 = temp__3971__auto____8162;
        return cljs.core.cons(cljs.core.first(coll__8163), cat(cljs.core.rest(coll__8163), colls))
      }else {
        if(cljs.core.seq(colls)) {
          return cat(cljs.core.first(colls), cljs.core.rest(colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8164.cljs$lang$arity$2 ? cat__8164.cljs$lang$arity$2(null, colls) : cat__8164.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1(cljs.core.map.cljs$lang$arity$2(f, coll))
  };
  var mapcat__3 = function() {
    var G__8165__delegate = function(f, coll, colls) {
      return cljs.core.flatten1(cljs.core.apply.cljs$lang$arity$4(cljs.core.map, f, coll, colls))
    };
    var G__8165 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8165__delegate.call(this, f, coll, colls)
    };
    G__8165.cljs$lang$maxFixedArity = 2;
    G__8165.cljs$lang$applyTo = function(arglist__8166) {
      var f = cljs.core.first(arglist__8166);
      var coll = cljs.core.first(cljs.core.next(arglist__8166));
      var colls = cljs.core.rest(cljs.core.next(arglist__8166));
      return G__8165__delegate(f, coll, colls)
    };
    G__8165.cljs$lang$arity$variadic = G__8165__delegate;
    return G__8165
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
    var temp__3974__auto____8176 = cljs.core.seq(coll);
    if(temp__3974__auto____8176) {
      var s__8177 = temp__3974__auto____8176;
      if(cljs.core.chunked_seq_QMARK_(s__8177)) {
        var c__8178 = cljs.core.chunk_first(s__8177);
        var size__8179 = cljs.core.count(c__8178);
        var b__8180 = cljs.core.chunk_buffer(size__8179);
        var n__2555__auto____8181 = size__8179;
        var i__8182 = 0;
        while(true) {
          if(i__8182 < n__2555__auto____8181) {
            if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core._nth.cljs$lang$arity$2(c__8178, i__8182)) : pred.call(null, cljs.core._nth.cljs$lang$arity$2(c__8178, i__8182)))) {
              cljs.core.chunk_append(b__8180, cljs.core._nth.cljs$lang$arity$2(c__8178, i__8182))
            }else {
            }
            var G__8185 = i__8182 + 1;
            i__8182 = G__8185;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b__8180), filter(pred, cljs.core.chunk_rest(s__8177)))
      }else {
        var f__8183 = cljs.core.first(s__8177);
        var r__8184 = cljs.core.rest(s__8177);
        if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(f__8183) : pred.call(null, f__8183))) {
          return cljs.core.cons(f__8183, filter(pred, r__8184))
        }else {
          return filter(pred, r__8184)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter(cljs.core.complement(pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8188 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(node, cljs.core.truth_(branch_QMARK_.cljs$lang$arity$1 ? branch_QMARK_.cljs$lang$arity$1(node) : branch_QMARK_.call(null, node)) ? cljs.core.mapcat.cljs$lang$arity$2(walk, children.cljs$lang$arity$1 ? children.cljs$lang$arity$1(node) : children.call(null, node)) : null)
    }, null)
  };
  return walk__8188.cljs$lang$arity$1 ? walk__8188.cljs$lang$arity$1(root) : walk__8188.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter(function(p1__8186_SHARP_) {
    return!cljs.core.sequential_QMARK_(p1__8186_SHARP_)
  }, cljs.core.rest(cljs.core.tree_seq(cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8192__8193 = to;
    if(G__8192__8193) {
      if(function() {
        var or__3824__auto____8194 = G__8192__8193.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8194) {
          return or__3824__auto____8194
        }else {
          return G__8192__8193.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8192__8193.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_(cljs.core.IEditableCollection, G__8192__8193)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IEditableCollection, G__8192__8193)
    }
  }()) {
    return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj_BANG_, cljs.core.transient$(to), from))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(v, o) {
      return cljs.core.conj_BANG_(v, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(o) : f.call(null, o))
    }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$lang$arity$3(f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$lang$arity$4(f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8195__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.apply.cljs$lang$arity$variadic(cljs.core.map, f, c1, c2, c3, cljs.core.array_seq([colls], 0)))
    };
    var G__8195 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8195__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8195.cljs$lang$maxFixedArity = 4;
    G__8195.cljs$lang$applyTo = function(arglist__8196) {
      var f = cljs.core.first(arglist__8196);
      var c1 = cljs.core.first(cljs.core.next(arglist__8196));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8196)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8196))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8196))));
      return G__8195__delegate(f, c1, c2, c3, colls)
    };
    G__8195.cljs$lang$arity$variadic = G__8195__delegate;
    return G__8195
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
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(v, o) {
    if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(o) : pred.call(null, o))) {
      return cljs.core.conj_BANG_(v, o)
    }else {
      return v
    }
  }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.cljs$lang$arity$3(n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8203 = cljs.core.seq(coll);
      if(temp__3974__auto____8203) {
        var s__8204 = temp__3974__auto____8203;
        var p__8205 = cljs.core.take(n, s__8204);
        if(n === cljs.core.count(p__8205)) {
          return cljs.core.cons(p__8205, partition.cljs$lang$arity$3(n, step, cljs.core.drop(step, s__8204)))
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
      var temp__3974__auto____8206 = cljs.core.seq(coll);
      if(temp__3974__auto____8206) {
        var s__8207 = temp__3974__auto____8206;
        var p__8208 = cljs.core.take(n, s__8207);
        if(n === cljs.core.count(p__8208)) {
          return cljs.core.cons(p__8208, partition.cljs$lang$arity$4(n, step, pad, cljs.core.drop(step, s__8207)))
        }else {
          return cljs.core.list.cljs$lang$arity$1(cljs.core.take(n, cljs.core.concat.cljs$lang$arity$2(p__8208, pad)))
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
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8213 = cljs.core.lookup_sentinel;
    var m__8214 = m;
    var ks__8215 = cljs.core.seq(ks);
    while(true) {
      if(ks__8215) {
        var m__8216 = cljs.core._lookup.cljs$lang$arity$3(m__8214, cljs.core.first(ks__8215), sentinel__8213);
        if(sentinel__8213 === m__8216) {
          return not_found
        }else {
          var G__8217 = sentinel__8213;
          var G__8218 = m__8216;
          var G__8219 = cljs.core.next(ks__8215);
          sentinel__8213 = G__8217;
          m__8214 = G__8218;
          ks__8215 = G__8219;
          continue
        }
      }else {
        return m__8214
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
cljs.core.assoc_in = function assoc_in(m, p__8220, v) {
  var vec__8225__8226 = p__8220;
  var k__8227 = cljs.core.nth.cljs$lang$arity$3(vec__8225__8226, 0, null);
  var ks__8228 = cljs.core.nthnext(vec__8225__8226, 1);
  if(cljs.core.truth_(ks__8228)) {
    return cljs.core.assoc.cljs$lang$arity$3(m, k__8227, assoc_in(cljs.core._lookup.cljs$lang$arity$3(m, k__8227, null), ks__8228, v))
  }else {
    return cljs.core.assoc.cljs$lang$arity$3(m, k__8227, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8229, f, args) {
    var vec__8234__8235 = p__8229;
    var k__8236 = cljs.core.nth.cljs$lang$arity$3(vec__8234__8235, 0, null);
    var ks__8237 = cljs.core.nthnext(vec__8234__8235, 1);
    if(cljs.core.truth_(ks__8237)) {
      return cljs.core.assoc.cljs$lang$arity$3(m, k__8236, cljs.core.apply.cljs$lang$arity$5(update_in, cljs.core._lookup.cljs$lang$arity$3(m, k__8236, null), ks__8237, f, args))
    }else {
      return cljs.core.assoc.cljs$lang$arity$3(m, k__8236, cljs.core.apply.cljs$lang$arity$3(f, cljs.core._lookup.cljs$lang$arity$3(m, k__8236, null), args))
    }
  };
  var update_in = function(m, p__8229, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8229, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8238) {
    var m = cljs.core.first(arglist__8238);
    var p__8229 = cljs.core.first(cljs.core.next(arglist__8238));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8238)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8238)));
    return update_in__delegate(m, p__8229, f, args)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8241 = this;
  var h__2220__auto____8242 = this__8241.__hash;
  if(!(h__2220__auto____8242 == null)) {
    return h__2220__auto____8242
  }else {
    var h__2220__auto____8243 = cljs.core.hash_coll(coll);
    this__8241.__hash = h__2220__auto____8243;
    return h__2220__auto____8243
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8244 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8245 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8246 = this;
  var new_array__8247 = this__8246.array.slice();
  new_array__8247[k] = v;
  return new cljs.core.Vector(this__8246.meta, new_array__8247, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8278 = null;
  var G__8278__2 = function(this_sym8248, k) {
    var this__8250 = this;
    var this_sym8248__8251 = this;
    var coll__8252 = this_sym8248__8251;
    return coll__8252.cljs$core$ILookup$_lookup$arity$2(coll__8252, k)
  };
  var G__8278__3 = function(this_sym8249, k, not_found) {
    var this__8250 = this;
    var this_sym8249__8253 = this;
    var coll__8254 = this_sym8249__8253;
    return coll__8254.cljs$core$ILookup$_lookup$arity$3(coll__8254, k, not_found)
  };
  G__8278 = function(this_sym8249, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8278__2.call(this, this_sym8249, k);
      case 3:
        return G__8278__3.call(this, this_sym8249, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8278
}();
cljs.core.Vector.prototype.apply = function(this_sym8239, args8240) {
  var this__8255 = this;
  return this_sym8239.call.apply(this_sym8239, [this_sym8239].concat(args8240.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8256 = this;
  var new_array__8257 = this__8256.array.slice();
  new_array__8257.push(o);
  return new cljs.core.Vector(this__8256.meta, new_array__8257, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8258 = this;
  var this__8259 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8259], 0))
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8260 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(this__8260.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8261 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(this__8261.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8262 = this;
  if(this__8262.array.length > 0) {
    var vector_seq__8263 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8262.array.length) {
          return cljs.core.cons(this__8262.array[i], vector_seq(i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8263.cljs$lang$arity$1 ? vector_seq__8263.cljs$lang$arity$1(0) : vector_seq__8263.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8264 = this;
  return this__8264.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8265 = this;
  var count__8266 = this__8265.array.length;
  if(count__8266 > 0) {
    return this__8265.array[count__8266 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8267 = this;
  if(this__8267.array.length > 0) {
    var new_array__8268 = this__8267.array.slice();
    new_array__8268.pop();
    return new cljs.core.Vector(this__8267.meta, new_array__8268, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8269 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8270 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8271 = this;
  return new cljs.core.Vector(meta, this__8271.array, this__8271.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8272 = this;
  return this__8272.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8273 = this;
  if(function() {
    var and__3822__auto____8274 = 0 <= n;
    if(and__3822__auto____8274) {
      return n < this__8273.array.length
    }else {
      return and__3822__auto____8274
    }
  }()) {
    return this__8273.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8275 = this;
  if(function() {
    var and__3822__auto____8276 = 0 <= n;
    if(and__3822__auto____8276) {
      return n < this__8275.array.length
    }else {
      return and__3822__auto____8276
    }
  }()) {
    return this__8275.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8277 = this;
  return cljs.core.with_meta(cljs.core.Vector.EMPTY, this__8277.meta)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.cljs$lang$arity$1(32))
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
  var cnt__8280 = pv.cnt;
  if(cnt__8280 < 32) {
    return 0
  }else {
    return cnt__8280 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8286 = level;
  var ret__8287 = node;
  while(true) {
    if(ll__8286 === 0) {
      return ret__8287
    }else {
      var embed__8288 = ret__8287;
      var r__8289 = cljs.core.pv_fresh_node(edit);
      var ___8290 = cljs.core.pv_aset(r__8289, 0, embed__8288);
      var G__8291 = ll__8286 - 5;
      var G__8292 = r__8289;
      ll__8286 = G__8291;
      ret__8287 = G__8292;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8298 = cljs.core.pv_clone_node(parent);
  var subidx__8299 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset(ret__8298, subidx__8299, tailnode);
    return ret__8298
  }else {
    var child__8300 = cljs.core.pv_aget(parent, subidx__8299);
    if(!(child__8300 == null)) {
      var node_to_insert__8301 = push_tail(pv, level - 5, child__8300, tailnode);
      cljs.core.pv_aset(ret__8298, subidx__8299, node_to_insert__8301);
      return ret__8298
    }else {
      var node_to_insert__8302 = cljs.core.new_path(null, level - 5, tailnode);
      cljs.core.pv_aset(ret__8298, subidx__8299, node_to_insert__8302);
      return ret__8298
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8306 = 0 <= i;
    if(and__3822__auto____8306) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8306
    }
  }()) {
    if(i >= cljs.core.tail_off(pv)) {
      return pv.tail
    }else {
      var node__8307 = pv.root;
      var level__8308 = pv.shift;
      while(true) {
        if(level__8308 > 0) {
          var G__8309 = cljs.core.pv_aget(node__8307, i >>> level__8308 & 31);
          var G__8310 = level__8308 - 5;
          node__8307 = G__8309;
          level__8308 = G__8310;
          continue
        }else {
          return node__8307.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8313 = cljs.core.pv_clone_node(node);
  if(level === 0) {
    cljs.core.pv_aset(ret__8313, i & 31, val);
    return ret__8313
  }else {
    var subidx__8314 = i >>> level & 31;
    cljs.core.pv_aset(ret__8313, subidx__8314, do_assoc(pv, level - 5, cljs.core.pv_aget(node, subidx__8314), i, val));
    return ret__8313
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8320 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8321 = pop_tail(pv, level - 5, cljs.core.pv_aget(node, subidx__8320));
    if(function() {
      var and__3822__auto____8322 = new_child__8321 == null;
      if(and__3822__auto____8322) {
        return subidx__8320 === 0
      }else {
        return and__3822__auto____8322
      }
    }()) {
      return null
    }else {
      var ret__8323 = cljs.core.pv_clone_node(node);
      cljs.core.pv_aset(ret__8323, subidx__8320, new_child__8321);
      return ret__8323
    }
  }else {
    if(subidx__8320 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8324 = cljs.core.pv_clone_node(node);
        cljs.core.pv_aset(ret__8324, subidx__8320, null);
        return ret__8324
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8327 = this;
  return new cljs.core.TransientVector(this__8327.cnt, this__8327.shift, cljs.core.tv_editable_root(this__8327.root), cljs.core.tv_editable_tail(this__8327.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8328 = this;
  var h__2220__auto____8329 = this__8328.__hash;
  if(!(h__2220__auto____8329 == null)) {
    return h__2220__auto____8329
  }else {
    var h__2220__auto____8330 = cljs.core.hash_coll(coll);
    this__8328.__hash = h__2220__auto____8330;
    return h__2220__auto____8330
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8331 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8332 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8333 = this;
  if(function() {
    var and__3822__auto____8334 = 0 <= k;
    if(and__3822__auto____8334) {
      return k < this__8333.cnt
    }else {
      return and__3822__auto____8334
    }
  }()) {
    if(cljs.core.tail_off(coll) <= k) {
      var new_tail__8335 = this__8333.tail.slice();
      new_tail__8335[k & 31] = v;
      return new cljs.core.PersistentVector(this__8333.meta, this__8333.cnt, this__8333.shift, this__8333.root, new_tail__8335, null)
    }else {
      return new cljs.core.PersistentVector(this__8333.meta, this__8333.cnt, this__8333.shift, cljs.core.do_assoc(coll, this__8333.shift, this__8333.root, k, v), this__8333.tail, null)
    }
  }else {
    if(k === this__8333.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8333.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8383 = null;
  var G__8383__2 = function(this_sym8336, k) {
    var this__8338 = this;
    var this_sym8336__8339 = this;
    var coll__8340 = this_sym8336__8339;
    return coll__8340.cljs$core$ILookup$_lookup$arity$2(coll__8340, k)
  };
  var G__8383__3 = function(this_sym8337, k, not_found) {
    var this__8338 = this;
    var this_sym8337__8341 = this;
    var coll__8342 = this_sym8337__8341;
    return coll__8342.cljs$core$ILookup$_lookup$arity$3(coll__8342, k, not_found)
  };
  G__8383 = function(this_sym8337, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8383__2.call(this, this_sym8337, k);
      case 3:
        return G__8383__3.call(this, this_sym8337, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8383
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8325, args8326) {
  var this__8343 = this;
  return this_sym8325.call.apply(this_sym8325, [this_sym8325].concat(args8326.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8344 = this;
  var step_init__8345 = [0, init];
  var i__8346 = 0;
  while(true) {
    if(i__8346 < this__8344.cnt) {
      var arr__8347 = cljs.core.array_for(v, i__8346);
      var len__8348 = arr__8347.length;
      var init__8352 = function() {
        var j__8349 = 0;
        var init__8350 = step_init__8345[1];
        while(true) {
          if(j__8349 < len__8348) {
            var init__8351 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8350, j__8349 + i__8346, arr__8347[j__8349]) : f.call(null, init__8350, j__8349 + i__8346, arr__8347[j__8349]);
            if(cljs.core.reduced_QMARK_(init__8351)) {
              return init__8351
            }else {
              var G__8384 = j__8349 + 1;
              var G__8385 = init__8351;
              j__8349 = G__8384;
              init__8350 = G__8385;
              continue
            }
          }else {
            step_init__8345[0] = len__8348;
            step_init__8345[1] = init__8350;
            return init__8350
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_(init__8352)) {
        return cljs.core.deref(init__8352)
      }else {
        var G__8386 = i__8346 + step_init__8345[0];
        i__8346 = G__8386;
        continue
      }
    }else {
      return step_init__8345[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8353 = this;
  if(this__8353.cnt - cljs.core.tail_off(coll) < 32) {
    var new_tail__8354 = this__8353.tail.slice();
    new_tail__8354.push(o);
    return new cljs.core.PersistentVector(this__8353.meta, this__8353.cnt + 1, this__8353.shift, this__8353.root, new_tail__8354, null)
  }else {
    var root_overflow_QMARK___8355 = this__8353.cnt >>> 5 > 1 << this__8353.shift;
    var new_shift__8356 = root_overflow_QMARK___8355 ? this__8353.shift + 5 : this__8353.shift;
    var new_root__8358 = root_overflow_QMARK___8355 ? function() {
      var n_r__8357 = cljs.core.pv_fresh_node(null);
      cljs.core.pv_aset(n_r__8357, 0, this__8353.root);
      cljs.core.pv_aset(n_r__8357, 1, cljs.core.new_path(null, this__8353.shift, new cljs.core.VectorNode(null, this__8353.tail)));
      return n_r__8357
    }() : cljs.core.push_tail(coll, this__8353.shift, this__8353.root, new cljs.core.VectorNode(null, this__8353.tail));
    return new cljs.core.PersistentVector(this__8353.meta, this__8353.cnt + 1, new_shift__8356, new_root__8358, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8359 = this;
  if(this__8359.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8359.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8360 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8361 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8362 = this;
  var this__8363 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8363], 0))
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8364 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8365 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8366 = this;
  if(this__8366.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.cljs$lang$arity$3(coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8367 = this;
  return this__8367.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8368 = this;
  if(this__8368.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8368.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8369 = this;
  if(this__8369.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8369.cnt) {
      return cljs.core._with_meta(cljs.core.PersistentVector.EMPTY, this__8369.meta)
    }else {
      if(1 < this__8369.cnt - cljs.core.tail_off(coll)) {
        return new cljs.core.PersistentVector(this__8369.meta, this__8369.cnt - 1, this__8369.shift, this__8369.root, this__8369.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8370 = cljs.core.array_for(coll, this__8369.cnt - 2);
          var nr__8371 = cljs.core.pop_tail(coll, this__8369.shift, this__8369.root);
          var new_root__8372 = nr__8371 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8371;
          var cnt_1__8373 = this__8369.cnt - 1;
          if(function() {
            var and__3822__auto____8374 = 5 < this__8369.shift;
            if(and__3822__auto____8374) {
              return cljs.core.pv_aget(new_root__8372, 1) == null
            }else {
              return and__3822__auto____8374
            }
          }()) {
            return new cljs.core.PersistentVector(this__8369.meta, cnt_1__8373, this__8369.shift - 5, cljs.core.pv_aget(new_root__8372, 0), new_tail__8370, null)
          }else {
            return new cljs.core.PersistentVector(this__8369.meta, cnt_1__8373, this__8369.shift, new_root__8372, new_tail__8370, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8375 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8376 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8377 = this;
  return new cljs.core.PersistentVector(meta, this__8377.cnt, this__8377.shift, this__8377.root, this__8377.tail, this__8377.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8378 = this;
  return this__8378.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8379 = this;
  return cljs.core.array_for(coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8380 = this;
  if(function() {
    var and__3822__auto____8381 = 0 <= n;
    if(and__3822__auto____8381) {
      return n < this__8380.cnt
    }else {
      return and__3822__auto____8381
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8382 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, this__8382.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node(null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8387 = xs.length;
  var xs__8388 = no_clone === true ? xs : xs.slice();
  if(l__8387 < 32) {
    return new cljs.core.PersistentVector(null, l__8387, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8388, null)
  }else {
    var node__8389 = xs__8388.slice(0, 32);
    var v__8390 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8389, null);
    var i__8391 = 32;
    var out__8392 = cljs.core._as_transient(v__8390);
    while(true) {
      if(i__8391 < l__8387) {
        var G__8393 = i__8391 + 1;
        var G__8394 = cljs.core.conj_BANG_(out__8392, xs__8388[i__8391]);
        i__8391 = G__8393;
        out__8392 = G__8394;
        continue
      }else {
        return cljs.core.persistent_BANG_(out__8392)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj_BANG_, cljs.core._as_transient(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec(args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8395) {
    var args = cljs.core.seq(arglist__8395);
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8396 = this;
  if(this__8396.off + 1 < this__8396.node.length) {
    var s__8397 = cljs.core.chunked_seq.cljs$lang$arity$4(this__8396.vec, this__8396.node, this__8396.i, this__8396.off + 1);
    if(s__8397 == null) {
      return null
    }else {
      return s__8397
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8398 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8399 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8400 = this;
  return this__8400.node[this__8400.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8401 = this;
  if(this__8401.off + 1 < this__8401.node.length) {
    var s__8402 = cljs.core.chunked_seq.cljs$lang$arity$4(this__8401.vec, this__8401.node, this__8401.i, this__8401.off + 1);
    if(s__8402 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8402
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8403 = this;
  var l__8404 = this__8403.node.length;
  var s__8405 = this__8403.i + l__8404 < cljs.core._count(this__8403.vec) ? cljs.core.chunked_seq.cljs$lang$arity$3(this__8403.vec, this__8403.i + l__8404, 0) : null;
  if(s__8405 == null) {
    return null
  }else {
    return s__8405
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8406 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8407 = this;
  return cljs.core.chunked_seq.cljs$lang$arity$5(this__8407.vec, this__8407.node, this__8407.i, this__8407.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8408 = this;
  return this__8408.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8409 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, this__8409.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8410 = this;
  return cljs.core.array_chunk.cljs$lang$arity$2(this__8410.node, this__8410.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8411 = this;
  var l__8412 = this__8411.node.length;
  var s__8413 = this__8411.i + l__8412 < cljs.core._count(this__8411.vec) ? cljs.core.chunked_seq.cljs$lang$arity$3(this__8411.vec, this__8411.i + l__8412, 0) : null;
  if(s__8413 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8413
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.cljs$lang$arity$5(vec, cljs.core.array_for(vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.cljs$lang$arity$5(vec, node, i, off, null)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8416 = this;
  var h__2220__auto____8417 = this__8416.__hash;
  if(!(h__2220__auto____8417 == null)) {
    return h__2220__auto____8417
  }else {
    var h__2220__auto____8418 = cljs.core.hash_coll(coll);
    this__8416.__hash = h__2220__auto____8418;
    return h__2220__auto____8418
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8419 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8420 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8421 = this;
  var v_pos__8422 = this__8421.start + key;
  return new cljs.core.Subvec(this__8421.meta, cljs.core._assoc(this__8421.v, v_pos__8422, val), this__8421.start, this__8421.end > v_pos__8422 + 1 ? this__8421.end : v_pos__8422 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8448 = null;
  var G__8448__2 = function(this_sym8423, k) {
    var this__8425 = this;
    var this_sym8423__8426 = this;
    var coll__8427 = this_sym8423__8426;
    return coll__8427.cljs$core$ILookup$_lookup$arity$2(coll__8427, k)
  };
  var G__8448__3 = function(this_sym8424, k, not_found) {
    var this__8425 = this;
    var this_sym8424__8428 = this;
    var coll__8429 = this_sym8424__8428;
    return coll__8429.cljs$core$ILookup$_lookup$arity$3(coll__8429, k, not_found)
  };
  G__8448 = function(this_sym8424, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8448__2.call(this, this_sym8424, k);
      case 3:
        return G__8448__3.call(this, this_sym8424, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8448
}();
cljs.core.Subvec.prototype.apply = function(this_sym8414, args8415) {
  var this__8430 = this;
  return this_sym8414.call.apply(this_sym8414, [this_sym8414].concat(args8415.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8431 = this;
  return new cljs.core.Subvec(this__8431.meta, cljs.core._assoc_n(this__8431.v, this__8431.end, o), this__8431.start, this__8431.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8432 = this;
  var this__8433 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8433], 0))
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8434 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8435 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8436 = this;
  var subvec_seq__8437 = function subvec_seq(i) {
    if(i === this__8436.end) {
      return null
    }else {
      return cljs.core.cons(cljs.core._nth.cljs$lang$arity$2(this__8436.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq(i + 1)
      }, null))
    }
  };
  return subvec_seq__8437.cljs$lang$arity$1 ? subvec_seq__8437.cljs$lang$arity$1(this__8436.start) : subvec_seq__8437.call(null, this__8436.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8438 = this;
  return this__8438.end - this__8438.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8439 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__8439.v, this__8439.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8440 = this;
  if(this__8440.start === this__8440.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8440.meta, this__8440.v, this__8440.start, this__8440.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8441 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8442 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8443 = this;
  return new cljs.core.Subvec(meta, this__8443.v, this__8443.start, this__8443.end, this__8443.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8444 = this;
  return this__8444.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8445 = this;
  return cljs.core._nth.cljs$lang$arity$2(this__8445.v, this__8445.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8446 = this;
  return cljs.core._nth.cljs$lang$arity$3(this__8446.v, this__8446.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8447 = this;
  return cljs.core.with_meta(cljs.core.Vector.EMPTY, this__8447.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.cljs$lang$arity$3(v, start, cljs.core.count(v))
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
  var ret__8450 = cljs.core.make_array.cljs$lang$arity$1(32);
  cljs.core.array_copy(tl, 0, ret__8450, 0, tl.length);
  return ret__8450
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8454 = cljs.core.tv_ensure_editable(tv.root.edit, parent);
  var subidx__8455 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset(ret__8454, subidx__8455, level === 5 ? tail_node : function() {
    var child__8456 = cljs.core.pv_aget(ret__8454, subidx__8455);
    if(!(child__8456 == null)) {
      return tv_push_tail(tv, level - 5, child__8456, tail_node)
    }else {
      return cljs.core.new_path(tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8454
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8461 = cljs.core.tv_ensure_editable(tv.root.edit, node);
  var subidx__8462 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8463 = tv_pop_tail(tv, level - 5, cljs.core.pv_aget(node__8461, subidx__8462));
    if(function() {
      var and__3822__auto____8464 = new_child__8463 == null;
      if(and__3822__auto____8464) {
        return subidx__8462 === 0
      }else {
        return and__3822__auto____8464
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset(node__8461, subidx__8462, new_child__8463);
      return node__8461
    }
  }else {
    if(subidx__8462 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset(node__8461, subidx__8462, null);
        return node__8461
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8469 = 0 <= i;
    if(and__3822__auto____8469) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8469
    }
  }()) {
    if(i >= cljs.core.tail_off(tv)) {
      return tv.tail
    }else {
      var root__8470 = tv.root;
      var node__8471 = root__8470;
      var level__8472 = tv.shift;
      while(true) {
        if(level__8472 > 0) {
          var G__8473 = cljs.core.tv_ensure_editable(root__8470.edit, cljs.core.pv_aget(node__8471, i >>> level__8472 & 31));
          var G__8474 = level__8472 - 5;
          node__8471 = G__8473;
          level__8472 = G__8474;
          continue
        }else {
          return node__8471.arr
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8514 = null;
  var G__8514__2 = function(this_sym8477, k) {
    var this__8479 = this;
    var this_sym8477__8480 = this;
    var coll__8481 = this_sym8477__8480;
    return coll__8481.cljs$core$ILookup$_lookup$arity$2(coll__8481, k)
  };
  var G__8514__3 = function(this_sym8478, k, not_found) {
    var this__8479 = this;
    var this_sym8478__8482 = this;
    var coll__8483 = this_sym8478__8482;
    return coll__8483.cljs$core$ILookup$_lookup$arity$3(coll__8483, k, not_found)
  };
  G__8514 = function(this_sym8478, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8514__2.call(this, this_sym8478, k);
      case 3:
        return G__8514__3.call(this, this_sym8478, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8514
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8475, args8476) {
  var this__8484 = this;
  return this_sym8475.call.apply(this_sym8475, [this_sym8475].concat(args8476.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8485 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8486 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8487 = this;
  if(this__8487.root.edit) {
    return cljs.core.array_for(coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8488 = this;
  if(function() {
    var and__3822__auto____8489 = 0 <= n;
    if(and__3822__auto____8489) {
      return n < this__8488.cnt
    }else {
      return and__3822__auto____8489
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8490 = this;
  if(this__8490.root.edit) {
    return this__8490.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8491 = this;
  if(this__8491.root.edit) {
    if(function() {
      var and__3822__auto____8492 = 0 <= n;
      if(and__3822__auto____8492) {
        return n < this__8491.cnt
      }else {
        return and__3822__auto____8492
      }
    }()) {
      if(cljs.core.tail_off(tcoll) <= n) {
        this__8491.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8497 = function go(level, node) {
          var node__8495 = cljs.core.tv_ensure_editable(this__8491.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset(node__8495, n & 31, val);
            return node__8495
          }else {
            var subidx__8496 = n >>> level & 31;
            cljs.core.pv_aset(node__8495, subidx__8496, go(level - 5, cljs.core.pv_aget(node__8495, subidx__8496)));
            return node__8495
          }
        }.call(null, this__8491.shift, this__8491.root);
        this__8491.root = new_root__8497;
        return tcoll
      }
    }else {
      if(n === this__8491.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8491.cnt)].join(""));
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
  var this__8498 = this;
  if(this__8498.root.edit) {
    if(this__8498.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8498.cnt) {
        this__8498.cnt = 0;
        return tcoll
      }else {
        if((this__8498.cnt - 1 & 31) > 0) {
          this__8498.cnt = this__8498.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8499 = cljs.core.editable_array_for(tcoll, this__8498.cnt - 2);
            var new_root__8501 = function() {
              var nr__8500 = cljs.core.tv_pop_tail(tcoll, this__8498.shift, this__8498.root);
              if(!(nr__8500 == null)) {
                return nr__8500
              }else {
                return new cljs.core.VectorNode(this__8498.root.edit, cljs.core.make_array.cljs$lang$arity$1(32))
              }
            }();
            if(function() {
              var and__3822__auto____8502 = 5 < this__8498.shift;
              if(and__3822__auto____8502) {
                return cljs.core.pv_aget(new_root__8501, 1) == null
              }else {
                return and__3822__auto____8502
              }
            }()) {
              var new_root__8503 = cljs.core.tv_ensure_editable(this__8498.root.edit, cljs.core.pv_aget(new_root__8501, 0));
              this__8498.root = new_root__8503;
              this__8498.shift = this__8498.shift - 5;
              this__8498.cnt = this__8498.cnt - 1;
              this__8498.tail = new_tail__8499;
              return tcoll
            }else {
              this__8498.root = new_root__8501;
              this__8498.cnt = this__8498.cnt - 1;
              this__8498.tail = new_tail__8499;
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
  var this__8504 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8505 = this;
  if(this__8505.root.edit) {
    if(this__8505.cnt - cljs.core.tail_off(tcoll) < 32) {
      this__8505.tail[this__8505.cnt & 31] = o;
      this__8505.cnt = this__8505.cnt + 1;
      return tcoll
    }else {
      var tail_node__8506 = new cljs.core.VectorNode(this__8505.root.edit, this__8505.tail);
      var new_tail__8507 = cljs.core.make_array.cljs$lang$arity$1(32);
      new_tail__8507[0] = o;
      this__8505.tail = new_tail__8507;
      if(this__8505.cnt >>> 5 > 1 << this__8505.shift) {
        var new_root_array__8508 = cljs.core.make_array.cljs$lang$arity$1(32);
        var new_shift__8509 = this__8505.shift + 5;
        new_root_array__8508[0] = this__8505.root;
        new_root_array__8508[1] = cljs.core.new_path(this__8505.root.edit, this__8505.shift, tail_node__8506);
        this__8505.root = new cljs.core.VectorNode(this__8505.root.edit, new_root_array__8508);
        this__8505.shift = new_shift__8509;
        this__8505.cnt = this__8505.cnt + 1;
        return tcoll
      }else {
        var new_root__8510 = cljs.core.tv_push_tail(tcoll, this__8505.shift, this__8505.root, tail_node__8506);
        this__8505.root = new_root__8510;
        this__8505.cnt = this__8505.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8511 = this;
  if(this__8511.root.edit) {
    this__8511.root.edit = null;
    var len__8512 = this__8511.cnt - cljs.core.tail_off(tcoll);
    var trimmed_tail__8513 = cljs.core.make_array.cljs$lang$arity$1(len__8512);
    cljs.core.array_copy(this__8511.tail, 0, trimmed_tail__8513, 0, len__8512);
    return new cljs.core.PersistentVector(null, this__8511.cnt, this__8511.shift, this__8511.root, trimmed_tail__8513, null)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8515 = this;
  var h__2220__auto____8516 = this__8515.__hash;
  if(!(h__2220__auto____8516 == null)) {
    return h__2220__auto____8516
  }else {
    var h__2220__auto____8517 = cljs.core.hash_coll(coll);
    this__8515.__hash = h__2220__auto____8517;
    return h__2220__auto____8517
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8518 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8519 = this;
  var this__8520 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8520], 0))
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8521 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8522 = this;
  return cljs.core._first(this__8522.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8523 = this;
  var temp__3971__auto____8524 = cljs.core.next(this__8523.front);
  if(temp__3971__auto____8524) {
    var f1__8525 = temp__3971__auto____8524;
    return new cljs.core.PersistentQueueSeq(this__8523.meta, f1__8525, this__8523.rear, null)
  }else {
    if(this__8523.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8523.meta, this__8523.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8526 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8527 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8527.front, this__8527.rear, this__8527.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8528 = this;
  return this__8528.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8529 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__8529.meta)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8530 = this;
  var h__2220__auto____8531 = this__8530.__hash;
  if(!(h__2220__auto____8531 == null)) {
    return h__2220__auto____8531
  }else {
    var h__2220__auto____8532 = cljs.core.hash_coll(coll);
    this__8530.__hash = h__2220__auto____8532;
    return h__2220__auto____8532
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8533 = this;
  if(cljs.core.truth_(this__8533.front)) {
    return new cljs.core.PersistentQueue(this__8533.meta, this__8533.count + 1, this__8533.front, cljs.core.conj.cljs$lang$arity$2(function() {
      var or__3824__auto____8534 = this__8533.rear;
      if(cljs.core.truth_(or__3824__auto____8534)) {
        return or__3824__auto____8534
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8533.meta, this__8533.count + 1, cljs.core.conj.cljs$lang$arity$2(this__8533.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8535 = this;
  var this__8536 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8536], 0))
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8537 = this;
  var rear__8538 = cljs.core.seq(this__8537.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8539 = this__8537.front;
    if(cljs.core.truth_(or__3824__auto____8539)) {
      return or__3824__auto____8539
    }else {
      return rear__8538
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8537.front, cljs.core.seq(rear__8538), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8540 = this;
  return this__8540.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8541 = this;
  return cljs.core._first(this__8541.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8542 = this;
  if(cljs.core.truth_(this__8542.front)) {
    var temp__3971__auto____8543 = cljs.core.next(this__8542.front);
    if(temp__3971__auto____8543) {
      var f1__8544 = temp__3971__auto____8543;
      return new cljs.core.PersistentQueue(this__8542.meta, this__8542.count - 1, f1__8544, this__8542.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8542.meta, this__8542.count - 1, cljs.core.seq(this__8542.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8545 = this;
  return cljs.core.first(this__8545.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8546 = this;
  return cljs.core.rest(cljs.core.seq(coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8547 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8548 = this;
  return new cljs.core.PersistentQueue(meta, this__8548.count, this__8548.front, this__8548.rear, this__8548.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8549 = this;
  return this__8549.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8550 = this;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8551 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$(cljs.core.map_QMARK_(y) ? cljs.core.count(x) === cljs.core.count(y) ? cljs.core.every_QMARK_(cljs.core.identity, cljs.core.map.cljs$lang$arity$2(function(xkv) {
    return cljs.core._EQ_.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(y, cljs.core.first(xkv), cljs.core.never_equiv), cljs.core.second(xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8554 = array.length;
  var i__8555 = 0;
  while(true) {
    if(i__8555 < len__8554) {
      if(k === array[i__8555]) {
        return i__8555
      }else {
        var G__8556 = i__8555 + incr;
        i__8555 = G__8556;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8559 = cljs.core.hash.cljs$lang$arity$1(a);
  var b__8560 = cljs.core.hash.cljs$lang$arity$1(b);
  if(a__8559 < b__8560) {
    return-1
  }else {
    if(a__8559 > b__8560) {
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
  var ks__8568 = m.keys;
  var len__8569 = ks__8568.length;
  var so__8570 = m.strobj;
  var out__8571 = cljs.core.with_meta(cljs.core.PersistentHashMap.EMPTY, cljs.core.meta(m));
  var i__8572 = 0;
  var out__8573 = cljs.core.transient$(out__8571);
  while(true) {
    if(i__8572 < len__8569) {
      var k__8574 = ks__8568[i__8572];
      var G__8575 = i__8572 + 1;
      var G__8576 = cljs.core.assoc_BANG_(out__8573, k__8574, so__8570[k__8574]);
      i__8572 = G__8575;
      out__8573 = G__8576;
      continue
    }else {
      return cljs.core.persistent_BANG_(cljs.core.assoc_BANG_(out__8573, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8582 = {};
  var l__8583 = ks.length;
  var i__8584 = 0;
  while(true) {
    if(i__8584 < l__8583) {
      var k__8585 = ks[i__8584];
      new_obj__8582[k__8585] = obj[k__8585];
      var G__8586 = i__8584 + 1;
      i__8584 = G__8586;
      continue
    }else {
    }
    break
  }
  return new_obj__8582
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8589 = this;
  return cljs.core.transient$(cljs.core.into(cljs.core.hash_map(), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8590 = this;
  var h__2220__auto____8591 = this__8590.__hash;
  if(!(h__2220__auto____8591 == null)) {
    return h__2220__auto____8591
  }else {
    var h__2220__auto____8592 = cljs.core.hash_imap(coll);
    this__8590.__hash = h__2220__auto____8592;
    return h__2220__auto____8592
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8593 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8594 = this;
  if(function() {
    var and__3822__auto____8595 = goog.isString(k);
    if(and__3822__auto____8595) {
      return!(cljs.core.scan_array(1, k, this__8594.keys) == null)
    }else {
      return and__3822__auto____8595
    }
  }()) {
    return this__8594.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8596 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8597 = this__8596.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8597) {
        return or__3824__auto____8597
      }else {
        return this__8596.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map(coll, k, v)
    }else {
      if(!(cljs.core.scan_array(1, k, this__8596.keys) == null)) {
        var new_strobj__8598 = cljs.core.obj_clone(this__8596.strobj, this__8596.keys);
        new_strobj__8598[k] = v;
        return new cljs.core.ObjMap(this__8596.meta, this__8596.keys, new_strobj__8598, this__8596.update_count + 1, null)
      }else {
        var new_strobj__8599 = cljs.core.obj_clone(this__8596.strobj, this__8596.keys);
        var new_keys__8600 = this__8596.keys.slice();
        new_strobj__8599[k] = v;
        new_keys__8600.push(k);
        return new cljs.core.ObjMap(this__8596.meta, new_keys__8600, new_strobj__8599, this__8596.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map(coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8601 = this;
  if(function() {
    var and__3822__auto____8602 = goog.isString(k);
    if(and__3822__auto____8602) {
      return!(cljs.core.scan_array(1, k, this__8601.keys) == null)
    }else {
      return and__3822__auto____8602
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8624 = null;
  var G__8624__2 = function(this_sym8603, k) {
    var this__8605 = this;
    var this_sym8603__8606 = this;
    var coll__8607 = this_sym8603__8606;
    return coll__8607.cljs$core$ILookup$_lookup$arity$2(coll__8607, k)
  };
  var G__8624__3 = function(this_sym8604, k, not_found) {
    var this__8605 = this;
    var this_sym8604__8608 = this;
    var coll__8609 = this_sym8604__8608;
    return coll__8609.cljs$core$ILookup$_lookup$arity$3(coll__8609, k, not_found)
  };
  G__8624 = function(this_sym8604, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8624__2.call(this, this_sym8604, k);
      case 3:
        return G__8624__3.call(this, this_sym8604, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8624
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8587, args8588) {
  var this__8610 = this;
  return this_sym8587.call.apply(this_sym8587, [this_sym8587].concat(args8588.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8611 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8612 = this;
  var this__8613 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8613], 0))
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8614 = this;
  if(this__8614.keys.length > 0) {
    return cljs.core.map.cljs$lang$arity$2(function(p1__8577_SHARP_) {
      return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([p1__8577_SHARP_, this__8614.strobj[p1__8577_SHARP_]], 0))
    }, this__8614.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8615 = this;
  return this__8615.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8616 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8617 = this;
  return new cljs.core.ObjMap(meta, this__8617.keys, this__8617.strobj, this__8617.update_count, this__8617.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8618 = this;
  return this__8618.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8619 = this;
  return cljs.core.with_meta(cljs.core.ObjMap.EMPTY, this__8619.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8620 = this;
  if(function() {
    var and__3822__auto____8621 = goog.isString(k);
    if(and__3822__auto____8621) {
      return!(cljs.core.scan_array(1, k, this__8620.keys) == null)
    }else {
      return and__3822__auto____8621
    }
  }()) {
    var new_keys__8622 = this__8620.keys.slice();
    var new_strobj__8623 = cljs.core.obj_clone(this__8620.strobj, this__8620.keys);
    new_keys__8622.splice(cljs.core.scan_array(1, k, new_keys__8622), 1);
    cljs.core.js_delete(new_strobj__8623, k);
    return new cljs.core.ObjMap(this__8620.meta, new_keys__8622, new_strobj__8623, this__8620.update_count + 1, null)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8628 = this;
  var h__2220__auto____8629 = this__8628.__hash;
  if(!(h__2220__auto____8629 == null)) {
    return h__2220__auto____8629
  }else {
    var h__2220__auto____8630 = cljs.core.hash_imap(coll);
    this__8628.__hash = h__2220__auto____8630;
    return h__2220__auto____8630
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8631 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8632 = this;
  var bucket__8633 = this__8632.hashobj[cljs.core.hash.cljs$lang$arity$1(k)];
  var i__8634 = cljs.core.truth_(bucket__8633) ? cljs.core.scan_array(2, k, bucket__8633) : null;
  if(cljs.core.truth_(i__8634)) {
    return bucket__8633[i__8634 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8635 = this;
  var h__8636 = cljs.core.hash.cljs$lang$arity$1(k);
  var bucket__8637 = this__8635.hashobj[h__8636];
  if(cljs.core.truth_(bucket__8637)) {
    var new_bucket__8638 = bucket__8637.slice();
    var new_hashobj__8639 = goog.object.clone(this__8635.hashobj);
    new_hashobj__8639[h__8636] = new_bucket__8638;
    var temp__3971__auto____8640 = cljs.core.scan_array(2, k, new_bucket__8638);
    if(cljs.core.truth_(temp__3971__auto____8640)) {
      var i__8641 = temp__3971__auto____8640;
      new_bucket__8638[i__8641 + 1] = v;
      return new cljs.core.HashMap(this__8635.meta, this__8635.count, new_hashobj__8639, null)
    }else {
      new_bucket__8638.push(k, v);
      return new cljs.core.HashMap(this__8635.meta, this__8635.count + 1, new_hashobj__8639, null)
    }
  }else {
    var new_hashobj__8642 = goog.object.clone(this__8635.hashobj);
    new_hashobj__8642[h__8636] = [k, v];
    return new cljs.core.HashMap(this__8635.meta, this__8635.count + 1, new_hashobj__8642, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8643 = this;
  var bucket__8644 = this__8643.hashobj[cljs.core.hash.cljs$lang$arity$1(k)];
  var i__8645 = cljs.core.truth_(bucket__8644) ? cljs.core.scan_array(2, k, bucket__8644) : null;
  if(cljs.core.truth_(i__8645)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8670 = null;
  var G__8670__2 = function(this_sym8646, k) {
    var this__8648 = this;
    var this_sym8646__8649 = this;
    var coll__8650 = this_sym8646__8649;
    return coll__8650.cljs$core$ILookup$_lookup$arity$2(coll__8650, k)
  };
  var G__8670__3 = function(this_sym8647, k, not_found) {
    var this__8648 = this;
    var this_sym8647__8651 = this;
    var coll__8652 = this_sym8647__8651;
    return coll__8652.cljs$core$ILookup$_lookup$arity$3(coll__8652, k, not_found)
  };
  G__8670 = function(this_sym8647, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8670__2.call(this, this_sym8647, k);
      case 3:
        return G__8670__3.call(this, this_sym8647, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8670
}();
cljs.core.HashMap.prototype.apply = function(this_sym8626, args8627) {
  var this__8653 = this;
  return this_sym8626.call.apply(this_sym8626, [this_sym8626].concat(args8627.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8654 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8655 = this;
  var this__8656 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8656], 0))
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8657 = this;
  if(this__8657.count > 0) {
    var hashes__8658 = cljs.core.js_keys(this__8657.hashobj).sort();
    return cljs.core.mapcat.cljs$lang$arity$2(function(p1__8625_SHARP_) {
      return cljs.core.map.cljs$lang$arity$2(cljs.core.vec, cljs.core.partition.cljs$lang$arity$2(2, this__8657.hashobj[p1__8625_SHARP_]))
    }, hashes__8658)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8659 = this;
  return this__8659.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8660 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8661 = this;
  return new cljs.core.HashMap(meta, this__8661.count, this__8661.hashobj, this__8661.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8662 = this;
  return this__8662.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8663 = this;
  return cljs.core.with_meta(cljs.core.HashMap.EMPTY, this__8663.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8664 = this;
  var h__8665 = cljs.core.hash.cljs$lang$arity$1(k);
  var bucket__8666 = this__8664.hashobj[h__8665];
  var i__8667 = cljs.core.truth_(bucket__8666) ? cljs.core.scan_array(2, k, bucket__8666) : null;
  if(cljs.core.not(i__8667)) {
    return coll
  }else {
    var new_hashobj__8668 = goog.object.clone(this__8664.hashobj);
    if(3 > bucket__8666.length) {
      cljs.core.js_delete(new_hashobj__8668, h__8665)
    }else {
      var new_bucket__8669 = bucket__8666.slice();
      new_bucket__8669.splice(i__8667, 2);
      new_hashobj__8668[h__8665] = new_bucket__8669
    }
    return new cljs.core.HashMap(this__8664.meta, this__8664.count - 1, new_hashobj__8668, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8671 = ks.length;
  var i__8672 = 0;
  var out__8673 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8672 < len__8671) {
      var G__8674 = i__8672 + 1;
      var G__8675 = cljs.core.assoc.cljs$lang$arity$3(out__8673, ks[i__8672], vs[i__8672]);
      i__8672 = G__8674;
      out__8673 = G__8675;
      continue
    }else {
      return out__8673
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8679 = m.arr;
  var len__8680 = arr__8679.length;
  var i__8681 = 0;
  while(true) {
    if(len__8680 <= i__8681) {
      return-1
    }else {
      if(cljs.core._EQ_.cljs$lang$arity$2(arr__8679[i__8681], k)) {
        return i__8681
      }else {
        if("\ufdd0'else") {
          var G__8682 = i__8681 + 2;
          i__8681 = G__8682;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8685 = this;
  return new cljs.core.TransientArrayMap({}, this__8685.arr.length, this__8685.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8686 = this;
  var h__2220__auto____8687 = this__8686.__hash;
  if(!(h__2220__auto____8687 == null)) {
    return h__2220__auto____8687
  }else {
    var h__2220__auto____8688 = cljs.core.hash_imap(coll);
    this__8686.__hash = h__2220__auto____8688;
    return h__2220__auto____8688
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8689 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8690 = this;
  var idx__8691 = cljs.core.array_map_index_of(coll, k);
  if(idx__8691 === -1) {
    return not_found
  }else {
    return this__8690.arr[idx__8691 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8692 = this;
  var idx__8693 = cljs.core.array_map_index_of(coll, k);
  if(idx__8693 === -1) {
    if(this__8692.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8692.meta, this__8692.cnt + 1, function() {
        var G__8694__8695 = this__8692.arr.slice();
        G__8694__8695.push(k);
        G__8694__8695.push(v);
        return G__8694__8695
      }(), null)
    }else {
      return cljs.core.persistent_BANG_(cljs.core.assoc_BANG_(cljs.core.transient$(cljs.core.into(cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8692.arr[idx__8693 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8692.meta, this__8692.cnt, function() {
          var G__8696__8697 = this__8692.arr.slice();
          G__8696__8697[idx__8693 + 1] = v;
          return G__8696__8697
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8698 = this;
  return!(cljs.core.array_map_index_of(coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8730 = null;
  var G__8730__2 = function(this_sym8699, k) {
    var this__8701 = this;
    var this_sym8699__8702 = this;
    var coll__8703 = this_sym8699__8702;
    return coll__8703.cljs$core$ILookup$_lookup$arity$2(coll__8703, k)
  };
  var G__8730__3 = function(this_sym8700, k, not_found) {
    var this__8701 = this;
    var this_sym8700__8704 = this;
    var coll__8705 = this_sym8700__8704;
    return coll__8705.cljs$core$ILookup$_lookup$arity$3(coll__8705, k, not_found)
  };
  G__8730 = function(this_sym8700, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8730__2.call(this, this_sym8700, k);
      case 3:
        return G__8730__3.call(this, this_sym8700, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8730
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8683, args8684) {
  var this__8706 = this;
  return this_sym8683.call.apply(this_sym8683, [this_sym8683].concat(args8684.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8707 = this;
  var len__8708 = this__8707.arr.length;
  var i__8709 = 0;
  var init__8710 = init;
  while(true) {
    if(i__8709 < len__8708) {
      var init__8711 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8710, this__8707.arr[i__8709], this__8707.arr[i__8709 + 1]) : f.call(null, init__8710, this__8707.arr[i__8709], this__8707.arr[i__8709 + 1]);
      if(cljs.core.reduced_QMARK_(init__8711)) {
        return cljs.core.deref(init__8711)
      }else {
        var G__8731 = i__8709 + 2;
        var G__8732 = init__8711;
        i__8709 = G__8731;
        init__8710 = G__8732;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8712 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8713 = this;
  var this__8714 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8714], 0))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8715 = this;
  if(this__8715.cnt > 0) {
    var len__8716 = this__8715.arr.length;
    var array_map_seq__8717 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8716) {
          return cljs.core.cons(cljs.core.PersistentVector.fromArray([this__8715.arr[i], this__8715.arr[i + 1]], true), array_map_seq(i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8717.cljs$lang$arity$1 ? array_map_seq__8717.cljs$lang$arity$1(0) : array_map_seq__8717.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8718 = this;
  return this__8718.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8719 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8720 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8720.cnt, this__8720.arr, this__8720.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8721 = this;
  return this__8721.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8722 = this;
  return cljs.core._with_meta(cljs.core.PersistentArrayMap.EMPTY, this__8722.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8723 = this;
  var idx__8724 = cljs.core.array_map_index_of(coll, k);
  if(idx__8724 >= 0) {
    var len__8725 = this__8723.arr.length;
    var new_len__8726 = len__8725 - 2;
    if(new_len__8726 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8727 = cljs.core.make_array.cljs$lang$arity$1(new_len__8726);
      var s__8728 = 0;
      var d__8729 = 0;
      while(true) {
        if(s__8728 >= len__8725) {
          return new cljs.core.PersistentArrayMap(this__8723.meta, this__8723.cnt - 1, new_arr__8727, null)
        }else {
          if(cljs.core._EQ_.cljs$lang$arity$2(k, this__8723.arr[s__8728])) {
            var G__8733 = s__8728 + 2;
            var G__8734 = d__8729;
            s__8728 = G__8733;
            d__8729 = G__8734;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8727[d__8729] = this__8723.arr[s__8728];
              new_arr__8727[d__8729 + 1] = this__8723.arr[s__8728 + 1];
              var G__8735 = s__8728 + 2;
              var G__8736 = d__8729 + 2;
              s__8728 = G__8735;
              d__8729 = G__8736;
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
  var len__8737 = cljs.core.count(ks);
  var i__8738 = 0;
  var out__8739 = cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8738 < len__8737) {
      var G__8740 = i__8738 + 1;
      var G__8741 = cljs.core.assoc_BANG_(out__8739, ks[i__8738], vs[i__8738]);
      i__8738 = G__8740;
      out__8739 = G__8741;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__8739)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8742 = this;
  if(cljs.core.truth_(this__8742.editable_QMARK_)) {
    var idx__8743 = cljs.core.array_map_index_of(tcoll, key);
    if(idx__8743 >= 0) {
      this__8742.arr[idx__8743] = this__8742.arr[this__8742.len - 2];
      this__8742.arr[idx__8743 + 1] = this__8742.arr[this__8742.len - 1];
      var G__8744__8745 = this__8742.arr;
      G__8744__8745.pop();
      G__8744__8745.pop();
      G__8744__8745;
      this__8742.len = this__8742.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8746 = this;
  if(cljs.core.truth_(this__8746.editable_QMARK_)) {
    var idx__8747 = cljs.core.array_map_index_of(tcoll, key);
    if(idx__8747 === -1) {
      if(this__8746.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8746.len = this__8746.len + 2;
        this__8746.arr.push(key);
        this__8746.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_(cljs.core.array__GT_transient_hash_map(this__8746.len, this__8746.arr), key, val)
      }
    }else {
      if(val === this__8746.arr[idx__8747 + 1]) {
        return tcoll
      }else {
        this__8746.arr[idx__8747 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8748 = this;
  if(cljs.core.truth_(this__8748.editable_QMARK_)) {
    if(function() {
      var G__8749__8750 = o;
      if(G__8749__8750) {
        if(function() {
          var or__3824__auto____8751 = G__8749__8750.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____8751) {
            return or__3824__auto____8751
          }else {
            return G__8749__8750.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8749__8750.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__8749__8750)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__8749__8750)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key(o), cljs.core.val(o))
    }else {
      var es__8752 = cljs.core.seq(o);
      var tcoll__8753 = tcoll;
      while(true) {
        var temp__3971__auto____8754 = cljs.core.first(es__8752);
        if(cljs.core.truth_(temp__3971__auto____8754)) {
          var e__8755 = temp__3971__auto____8754;
          var G__8761 = cljs.core.next(es__8752);
          var G__8762 = tcoll__8753.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8753, cljs.core.key(e__8755), cljs.core.val(e__8755));
          es__8752 = G__8761;
          tcoll__8753 = G__8762;
          continue
        }else {
          return tcoll__8753
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8756 = this;
  if(cljs.core.truth_(this__8756.editable_QMARK_)) {
    this__8756.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(this__8756.len, 2), this__8756.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8757 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8758 = this;
  if(cljs.core.truth_(this__8758.editable_QMARK_)) {
    var idx__8759 = cljs.core.array_map_index_of(tcoll, k);
    if(idx__8759 === -1) {
      return not_found
    }else {
      return this__8758.arr[idx__8759 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8760 = this;
  if(cljs.core.truth_(this__8760.editable_QMARK_)) {
    return cljs.core.quot(this__8760.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8765 = cljs.core.transient$(cljs.core.ObjMap.EMPTY);
  var i__8766 = 0;
  while(true) {
    if(i__8766 < len) {
      var G__8767 = cljs.core.assoc_BANG_(out__8765, arr[i__8766], arr[i__8766 + 1]);
      var G__8768 = i__8766 + 2;
      out__8765 = G__8767;
      i__8766 = G__8768;
      continue
    }else {
      return out__8765
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2338__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.cljs$lang$arity$2(key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8773__8774 = arr.slice();
    G__8773__8774[i] = a;
    return G__8773__8774
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8775__8776 = arr.slice();
    G__8775__8776[i] = a;
    G__8775__8776[j] = b;
    return G__8775__8776
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
  var new_arr__8778 = cljs.core.make_array.cljs$lang$arity$1(arr.length - 2);
  cljs.core.array_copy(arr, 0, new_arr__8778, 0, 2 * i);
  cljs.core.array_copy(arr, 2 * (i + 1), new_arr__8778, 2 * i, new_arr__8778.length - 2 * i);
  return new_arr__8778
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count(bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8781 = inode.ensure_editable(edit);
    editable__8781.arr[i] = a;
    return editable__8781
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8782 = inode.ensure_editable(edit);
    editable__8782.arr[i] = a;
    editable__8782.arr[j] = b;
    return editable__8782
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
  var len__8789 = arr.length;
  var i__8790 = 0;
  var init__8791 = init;
  while(true) {
    if(i__8790 < len__8789) {
      var init__8794 = function() {
        var k__8792 = arr[i__8790];
        if(!(k__8792 == null)) {
          return f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init__8791, k__8792, arr[i__8790 + 1]) : f.call(null, init__8791, k__8792, arr[i__8790 + 1])
        }else {
          var node__8793 = arr[i__8790 + 1];
          if(!(node__8793 == null)) {
            return node__8793.kv_reduce(f, init__8791)
          }else {
            return init__8791
          }
        }
      }();
      if(cljs.core.reduced_QMARK_(init__8794)) {
        return cljs.core.deref(init__8794)
      }else {
        var G__8795 = i__8790 + 2;
        var G__8796 = init__8794;
        i__8790 = G__8795;
        init__8791 = G__8796;
        continue
      }
    }else {
      return init__8791
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8797 = this;
  var inode__8798 = this;
  if(this__8797.bitmap === bit) {
    return null
  }else {
    var editable__8799 = inode__8798.ensure_editable(e);
    var earr__8800 = editable__8799.arr;
    var len__8801 = earr__8800.length;
    editable__8799.bitmap = bit ^ editable__8799.bitmap;
    cljs.core.array_copy(earr__8800, 2 * (i + 1), earr__8800, 2 * i, len__8801 - 2 * (i + 1));
    earr__8800[len__8801 - 2] = null;
    earr__8800[len__8801 - 1] = null;
    return editable__8799
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8802 = this;
  var inode__8803 = this;
  var bit__8804 = 1 << (hash >>> shift & 31);
  var idx__8805 = cljs.core.bitmap_indexed_node_index(this__8802.bitmap, bit__8804);
  if((this__8802.bitmap & bit__8804) === 0) {
    var n__8806 = cljs.core.bit_count(this__8802.bitmap);
    if(2 * n__8806 < this__8802.arr.length) {
      var editable__8807 = inode__8803.ensure_editable(edit);
      var earr__8808 = editable__8807.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward(earr__8808, 2 * idx__8805, earr__8808, 2 * (idx__8805 + 1), 2 * (n__8806 - idx__8805));
      earr__8808[2 * idx__8805] = key;
      earr__8808[2 * idx__8805 + 1] = val;
      editable__8807.bitmap = editable__8807.bitmap | bit__8804;
      return editable__8807
    }else {
      if(n__8806 >= 16) {
        var nodes__8809 = cljs.core.make_array.cljs$lang$arity$1(32);
        var jdx__8810 = hash >>> shift & 31;
        nodes__8809[jdx__8810] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8811 = 0;
        var j__8812 = 0;
        while(true) {
          if(i__8811 < 32) {
            if((this__8802.bitmap >>> i__8811 & 1) === 0) {
              var G__8865 = i__8811 + 1;
              var G__8866 = j__8812;
              i__8811 = G__8865;
              j__8812 = G__8866;
              continue
            }else {
              nodes__8809[i__8811] = !(this__8802.arr[j__8812] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.cljs$lang$arity$1(this__8802.arr[j__8812]), this__8802.arr[j__8812], this__8802.arr[j__8812 + 1], added_leaf_QMARK_) : this__8802.arr[j__8812 + 1];
              var G__8867 = i__8811 + 1;
              var G__8868 = j__8812 + 2;
              i__8811 = G__8867;
              j__8812 = G__8868;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8806 + 1, nodes__8809)
      }else {
        if("\ufdd0'else") {
          var new_arr__8813 = cljs.core.make_array.cljs$lang$arity$1(2 * (n__8806 + 4));
          cljs.core.array_copy(this__8802.arr, 0, new_arr__8813, 0, 2 * idx__8805);
          new_arr__8813[2 * idx__8805] = key;
          new_arr__8813[2 * idx__8805 + 1] = val;
          cljs.core.array_copy(this__8802.arr, 2 * idx__8805, new_arr__8813, 2 * (idx__8805 + 1), 2 * (n__8806 - idx__8805));
          added_leaf_QMARK_.val = true;
          var editable__8814 = inode__8803.ensure_editable(edit);
          editable__8814.arr = new_arr__8813;
          editable__8814.bitmap = editable__8814.bitmap | bit__8804;
          return editable__8814
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8815 = this__8802.arr[2 * idx__8805];
    var val_or_node__8816 = this__8802.arr[2 * idx__8805 + 1];
    if(key_or_nil__8815 == null) {
      var n__8817 = val_or_node__8816.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8817 === val_or_node__8816) {
        return inode__8803
      }else {
        return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8803, edit, 2 * idx__8805 + 1, n__8817)
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8815)) {
        if(val === val_or_node__8816) {
          return inode__8803
        }else {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8803, edit, 2 * idx__8805 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.cljs$lang$arity$6(inode__8803, edit, 2 * idx__8805, null, 2 * idx__8805 + 1, cljs.core.create_node.cljs$lang$arity$7(edit, shift + 5, key_or_nil__8815, val_or_node__8816, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8818 = this;
  var inode__8819 = this;
  return cljs.core.create_inode_seq.cljs$lang$arity$1(this__8818.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8820 = this;
  var inode__8821 = this;
  var bit__8822 = 1 << (hash >>> shift & 31);
  if((this__8820.bitmap & bit__8822) === 0) {
    return inode__8821
  }else {
    var idx__8823 = cljs.core.bitmap_indexed_node_index(this__8820.bitmap, bit__8822);
    var key_or_nil__8824 = this__8820.arr[2 * idx__8823];
    var val_or_node__8825 = this__8820.arr[2 * idx__8823 + 1];
    if(key_or_nil__8824 == null) {
      var n__8826 = val_or_node__8825.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8826 === val_or_node__8825) {
        return inode__8821
      }else {
        if(!(n__8826 == null)) {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8821, edit, 2 * idx__8823 + 1, n__8826)
        }else {
          if(this__8820.bitmap === bit__8822) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8821.edit_and_remove_pair(edit, bit__8822, idx__8823)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8824)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8821.edit_and_remove_pair(edit, bit__8822, idx__8823)
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
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8827 = this;
  var inode__8828 = this;
  if(e === this__8827.edit) {
    return inode__8828
  }else {
    var n__8829 = cljs.core.bit_count(this__8827.bitmap);
    var new_arr__8830 = cljs.core.make_array.cljs$lang$arity$1(n__8829 < 0 ? 4 : 2 * (n__8829 + 1));
    cljs.core.array_copy(this__8827.arr, 0, new_arr__8830, 0, 2 * n__8829);
    return new cljs.core.BitmapIndexedNode(e, this__8827.bitmap, new_arr__8830)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8831 = this;
  var inode__8832 = this;
  return cljs.core.inode_kv_reduce(this__8831.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8833 = this;
  var inode__8834 = this;
  var bit__8835 = 1 << (hash >>> shift & 31);
  if((this__8833.bitmap & bit__8835) === 0) {
    return not_found
  }else {
    var idx__8836 = cljs.core.bitmap_indexed_node_index(this__8833.bitmap, bit__8835);
    var key_or_nil__8837 = this__8833.arr[2 * idx__8836];
    var val_or_node__8838 = this__8833.arr[2 * idx__8836 + 1];
    if(key_or_nil__8837 == null) {
      return val_or_node__8838.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil__8837)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8837, val_or_node__8838], true)
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
  var this__8839 = this;
  var inode__8840 = this;
  var bit__8841 = 1 << (hash >>> shift & 31);
  if((this__8839.bitmap & bit__8841) === 0) {
    return inode__8840
  }else {
    var idx__8842 = cljs.core.bitmap_indexed_node_index(this__8839.bitmap, bit__8841);
    var key_or_nil__8843 = this__8839.arr[2 * idx__8842];
    var val_or_node__8844 = this__8839.arr[2 * idx__8842 + 1];
    if(key_or_nil__8843 == null) {
      var n__8845 = val_or_node__8844.inode_without(shift + 5, hash, key);
      if(n__8845 === val_or_node__8844) {
        return inode__8840
      }else {
        if(!(n__8845 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8839.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8839.arr, 2 * idx__8842 + 1, n__8845))
        }else {
          if(this__8839.bitmap === bit__8841) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8839.bitmap ^ bit__8841, cljs.core.remove_pair(this__8839.arr, idx__8842))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8843)) {
        return new cljs.core.BitmapIndexedNode(null, this__8839.bitmap ^ bit__8841, cljs.core.remove_pair(this__8839.arr, idx__8842))
      }else {
        if("\ufdd0'else") {
          return inode__8840
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8846 = this;
  var inode__8847 = this;
  var bit__8848 = 1 << (hash >>> shift & 31);
  var idx__8849 = cljs.core.bitmap_indexed_node_index(this__8846.bitmap, bit__8848);
  if((this__8846.bitmap & bit__8848) === 0) {
    var n__8850 = cljs.core.bit_count(this__8846.bitmap);
    if(n__8850 >= 16) {
      var nodes__8851 = cljs.core.make_array.cljs$lang$arity$1(32);
      var jdx__8852 = hash >>> shift & 31;
      nodes__8851[jdx__8852] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8853 = 0;
      var j__8854 = 0;
      while(true) {
        if(i__8853 < 32) {
          if((this__8846.bitmap >>> i__8853 & 1) === 0) {
            var G__8869 = i__8853 + 1;
            var G__8870 = j__8854;
            i__8853 = G__8869;
            j__8854 = G__8870;
            continue
          }else {
            nodes__8851[i__8853] = !(this__8846.arr[j__8854] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.cljs$lang$arity$1(this__8846.arr[j__8854]), this__8846.arr[j__8854], this__8846.arr[j__8854 + 1], added_leaf_QMARK_) : this__8846.arr[j__8854 + 1];
            var G__8871 = i__8853 + 1;
            var G__8872 = j__8854 + 2;
            i__8853 = G__8871;
            j__8854 = G__8872;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8850 + 1, nodes__8851)
    }else {
      var new_arr__8855 = cljs.core.make_array.cljs$lang$arity$1(2 * (n__8850 + 1));
      cljs.core.array_copy(this__8846.arr, 0, new_arr__8855, 0, 2 * idx__8849);
      new_arr__8855[2 * idx__8849] = key;
      new_arr__8855[2 * idx__8849 + 1] = val;
      cljs.core.array_copy(this__8846.arr, 2 * idx__8849, new_arr__8855, 2 * (idx__8849 + 1), 2 * (n__8850 - idx__8849));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8846.bitmap | bit__8848, new_arr__8855)
    }
  }else {
    var key_or_nil__8856 = this__8846.arr[2 * idx__8849];
    var val_or_node__8857 = this__8846.arr[2 * idx__8849 + 1];
    if(key_or_nil__8856 == null) {
      var n__8858 = val_or_node__8857.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8858 === val_or_node__8857) {
        return inode__8847
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8846.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8846.arr, 2 * idx__8849 + 1, n__8858))
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil__8856)) {
        if(val === val_or_node__8857) {
          return inode__8847
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8846.bitmap, cljs.core.clone_and_set.cljs$lang$arity$3(this__8846.arr, 2 * idx__8849 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8846.bitmap, cljs.core.clone_and_set.cljs$lang$arity$5(this__8846.arr, 2 * idx__8849, null, 2 * idx__8849 + 1, cljs.core.create_node.cljs$lang$arity$6(shift + 5, key_or_nil__8856, val_or_node__8857, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8859 = this;
  var inode__8860 = this;
  var bit__8861 = 1 << (hash >>> shift & 31);
  if((this__8859.bitmap & bit__8861) === 0) {
    return not_found
  }else {
    var idx__8862 = cljs.core.bitmap_indexed_node_index(this__8859.bitmap, bit__8861);
    var key_or_nil__8863 = this__8859.arr[2 * idx__8862];
    var val_or_node__8864 = this__8859.arr[2 * idx__8862 + 1];
    if(key_or_nil__8863 == null) {
      return val_or_node__8864.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil__8863)) {
        return val_or_node__8864
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
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.cljs$lang$arity$1(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8880 = array_node.arr;
  var len__8881 = 2 * (array_node.cnt - 1);
  var new_arr__8882 = cljs.core.make_array.cljs$lang$arity$1(len__8881);
  var i__8883 = 0;
  var j__8884 = 1;
  var bitmap__8885 = 0;
  while(true) {
    if(i__8883 < len__8881) {
      if(function() {
        var and__3822__auto____8886 = !(i__8883 === idx);
        if(and__3822__auto____8886) {
          return!(arr__8880[i__8883] == null)
        }else {
          return and__3822__auto____8886
        }
      }()) {
        new_arr__8882[j__8884] = arr__8880[i__8883];
        var G__8887 = i__8883 + 1;
        var G__8888 = j__8884 + 2;
        var G__8889 = bitmap__8885 | 1 << i__8883;
        i__8883 = G__8887;
        j__8884 = G__8888;
        bitmap__8885 = G__8889;
        continue
      }else {
        var G__8890 = i__8883 + 1;
        var G__8891 = j__8884;
        var G__8892 = bitmap__8885;
        i__8883 = G__8890;
        j__8884 = G__8891;
        bitmap__8885 = G__8892;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8885, new_arr__8882)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8893 = this;
  var inode__8894 = this;
  var idx__8895 = hash >>> shift & 31;
  var node__8896 = this__8893.arr[idx__8895];
  if(node__8896 == null) {
    var editable__8897 = cljs.core.edit_and_set.cljs$lang$arity$4(inode__8894, edit, idx__8895, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8897.cnt = editable__8897.cnt + 1;
    return editable__8897
  }else {
    var n__8898 = node__8896.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8898 === node__8896) {
      return inode__8894
    }else {
      return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8894, edit, idx__8895, n__8898)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8899 = this;
  var inode__8900 = this;
  return cljs.core.create_array_node_seq.cljs$lang$arity$1(this__8899.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8901 = this;
  var inode__8902 = this;
  var idx__8903 = hash >>> shift & 31;
  var node__8904 = this__8901.arr[idx__8903];
  if(node__8904 == null) {
    return inode__8902
  }else {
    var n__8905 = node__8904.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8905 === node__8904) {
      return inode__8902
    }else {
      if(n__8905 == null) {
        if(this__8901.cnt <= 8) {
          return cljs.core.pack_array_node(inode__8902, edit, idx__8903)
        }else {
          var editable__8906 = cljs.core.edit_and_set.cljs$lang$arity$4(inode__8902, edit, idx__8903, n__8905);
          editable__8906.cnt = editable__8906.cnt - 1;
          return editable__8906
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8902, edit, idx__8903, n__8905)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8907 = this;
  var inode__8908 = this;
  if(e === this__8907.edit) {
    return inode__8908
  }else {
    return new cljs.core.ArrayNode(e, this__8907.cnt, this__8907.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8909 = this;
  var inode__8910 = this;
  var len__8911 = this__8909.arr.length;
  var i__8912 = 0;
  var init__8913 = init;
  while(true) {
    if(i__8912 < len__8911) {
      var node__8914 = this__8909.arr[i__8912];
      if(!(node__8914 == null)) {
        var init__8915 = node__8914.kv_reduce(f, init__8913);
        if(cljs.core.reduced_QMARK_(init__8915)) {
          return cljs.core.deref(init__8915)
        }else {
          var G__8934 = i__8912 + 1;
          var G__8935 = init__8915;
          i__8912 = G__8934;
          init__8913 = G__8935;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8913
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8916 = this;
  var inode__8917 = this;
  var idx__8918 = hash >>> shift & 31;
  var node__8919 = this__8916.arr[idx__8918];
  if(!(node__8919 == null)) {
    return node__8919.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8920 = this;
  var inode__8921 = this;
  var idx__8922 = hash >>> shift & 31;
  var node__8923 = this__8920.arr[idx__8922];
  if(!(node__8923 == null)) {
    var n__8924 = node__8923.inode_without(shift + 5, hash, key);
    if(n__8924 === node__8923) {
      return inode__8921
    }else {
      if(n__8924 == null) {
        if(this__8920.cnt <= 8) {
          return cljs.core.pack_array_node(inode__8921, null, idx__8922)
        }else {
          return new cljs.core.ArrayNode(null, this__8920.cnt - 1, cljs.core.clone_and_set.cljs$lang$arity$3(this__8920.arr, idx__8922, n__8924))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8920.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8920.arr, idx__8922, n__8924))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8921
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8925 = this;
  var inode__8926 = this;
  var idx__8927 = hash >>> shift & 31;
  var node__8928 = this__8925.arr[idx__8927];
  if(node__8928 == null) {
    return new cljs.core.ArrayNode(null, this__8925.cnt + 1, cljs.core.clone_and_set.cljs$lang$arity$3(this__8925.arr, idx__8927, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8929 = node__8928.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8929 === node__8928) {
      return inode__8926
    }else {
      return new cljs.core.ArrayNode(null, this__8925.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8925.arr, idx__8927, n__8929))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8930 = this;
  var inode__8931 = this;
  var idx__8932 = hash >>> shift & 31;
  var node__8933 = this__8930.arr[idx__8932];
  if(!(node__8933 == null)) {
    return node__8933.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8938 = 2 * cnt;
  var i__8939 = 0;
  while(true) {
    if(i__8939 < lim__8938) {
      if(cljs.core.key_test(key, arr[i__8939])) {
        return i__8939
      }else {
        var G__8940 = i__8939 + 2;
        i__8939 = G__8940;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8941 = this;
  var inode__8942 = this;
  if(hash === this__8941.collision_hash) {
    var idx__8943 = cljs.core.hash_collision_node_find_index(this__8941.arr, this__8941.cnt, key);
    if(idx__8943 === -1) {
      if(this__8941.arr.length > 2 * this__8941.cnt) {
        var editable__8944 = cljs.core.edit_and_set.cljs$lang$arity$6(inode__8942, edit, 2 * this__8941.cnt, key, 2 * this__8941.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8944.cnt = editable__8944.cnt + 1;
        return editable__8944
      }else {
        var len__8945 = this__8941.arr.length;
        var new_arr__8946 = cljs.core.make_array.cljs$lang$arity$1(len__8945 + 2);
        cljs.core.array_copy(this__8941.arr, 0, new_arr__8946, 0, len__8945);
        new_arr__8946[len__8945] = key;
        new_arr__8946[len__8945 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8942.ensure_editable_array(edit, this__8941.cnt + 1, new_arr__8946)
      }
    }else {
      if(this__8941.arr[idx__8943 + 1] === val) {
        return inode__8942
      }else {
        return cljs.core.edit_and_set.cljs$lang$arity$4(inode__8942, edit, idx__8943 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8941.collision_hash >>> shift & 31), [null, inode__8942, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8947 = this;
  var inode__8948 = this;
  return cljs.core.create_inode_seq.cljs$lang$arity$1(this__8947.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8949 = this;
  var inode__8950 = this;
  var idx__8951 = cljs.core.hash_collision_node_find_index(this__8949.arr, this__8949.cnt, key);
  if(idx__8951 === -1) {
    return inode__8950
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8949.cnt === 1) {
      return null
    }else {
      var editable__8952 = inode__8950.ensure_editable(edit);
      var earr__8953 = editable__8952.arr;
      earr__8953[idx__8951] = earr__8953[2 * this__8949.cnt - 2];
      earr__8953[idx__8951 + 1] = earr__8953[2 * this__8949.cnt - 1];
      earr__8953[2 * this__8949.cnt - 1] = null;
      earr__8953[2 * this__8949.cnt - 2] = null;
      editable__8952.cnt = editable__8952.cnt - 1;
      return editable__8952
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8954 = this;
  var inode__8955 = this;
  if(e === this__8954.edit) {
    return inode__8955
  }else {
    var new_arr__8956 = cljs.core.make_array.cljs$lang$arity$1(2 * (this__8954.cnt + 1));
    cljs.core.array_copy(this__8954.arr, 0, new_arr__8956, 0, 2 * this__8954.cnt);
    return new cljs.core.HashCollisionNode(e, this__8954.collision_hash, this__8954.cnt, new_arr__8956)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8957 = this;
  var inode__8958 = this;
  return cljs.core.inode_kv_reduce(this__8957.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8959 = this;
  var inode__8960 = this;
  var idx__8961 = cljs.core.hash_collision_node_find_index(this__8959.arr, this__8959.cnt, key);
  if(idx__8961 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, this__8959.arr[idx__8961])) {
      return cljs.core.PersistentVector.fromArray([this__8959.arr[idx__8961], this__8959.arr[idx__8961 + 1]], true)
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
  var this__8962 = this;
  var inode__8963 = this;
  var idx__8964 = cljs.core.hash_collision_node_find_index(this__8962.arr, this__8962.cnt, key);
  if(idx__8964 === -1) {
    return inode__8963
  }else {
    if(this__8962.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8962.collision_hash, this__8962.cnt - 1, cljs.core.remove_pair(this__8962.arr, cljs.core.quot(idx__8964, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8965 = this;
  var inode__8966 = this;
  if(hash === this__8965.collision_hash) {
    var idx__8967 = cljs.core.hash_collision_node_find_index(this__8965.arr, this__8965.cnt, key);
    if(idx__8967 === -1) {
      var len__8968 = this__8965.arr.length;
      var new_arr__8969 = cljs.core.make_array.cljs$lang$arity$1(len__8968 + 2);
      cljs.core.array_copy(this__8965.arr, 0, new_arr__8969, 0, len__8968);
      new_arr__8969[len__8968] = key;
      new_arr__8969[len__8968 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8965.collision_hash, this__8965.cnt + 1, new_arr__8969)
    }else {
      if(cljs.core._EQ_.cljs$lang$arity$2(this__8965.arr[idx__8967], val)) {
        return inode__8966
      }else {
        return new cljs.core.HashCollisionNode(null, this__8965.collision_hash, this__8965.cnt, cljs.core.clone_and_set.cljs$lang$arity$3(this__8965.arr, idx__8967 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8965.collision_hash >>> shift & 31), [null, inode__8966])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8970 = this;
  var inode__8971 = this;
  var idx__8972 = cljs.core.hash_collision_node_find_index(this__8970.arr, this__8970.cnt, key);
  if(idx__8972 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, this__8970.arr[idx__8972])) {
      return this__8970.arr[idx__8972 + 1]
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
  var this__8973 = this;
  var inode__8974 = this;
  if(e === this__8973.edit) {
    this__8973.arr = array;
    this__8973.cnt = count;
    return inode__8974
  }else {
    return new cljs.core.HashCollisionNode(this__8973.edit, this__8973.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8979 = cljs.core.hash.cljs$lang$arity$1(key1);
    if(key1hash__8979 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8979, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8980 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8979, key1, val1, added_leaf_QMARK___8980).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8980)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8981 = cljs.core.hash.cljs$lang$arity$1(key1);
    if(key1hash__8981 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8981, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8982 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8981, key1, val1, added_leaf_QMARK___8982).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8982)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8983 = this;
  var h__2220__auto____8984 = this__8983.__hash;
  if(!(h__2220__auto____8984 == null)) {
    return h__2220__auto____8984
  }else {
    var h__2220__auto____8985 = cljs.core.hash_coll(coll);
    this__8983.__hash = h__2220__auto____8985;
    return h__2220__auto____8985
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8986 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8987 = this;
  var this__8988 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__8988], 0))
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8989 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8990 = this;
  if(this__8990.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8990.nodes[this__8990.i], this__8990.nodes[this__8990.i + 1]], true)
  }else {
    return cljs.core.first(this__8990.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8991 = this;
  if(this__8991.s == null) {
    return cljs.core.create_inode_seq.cljs$lang$arity$3(this__8991.nodes, this__8991.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.cljs$lang$arity$3(this__8991.nodes, this__8991.i, cljs.core.next(this__8991.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8992 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8993 = this;
  return new cljs.core.NodeSeq(meta, this__8993.nodes, this__8993.i, this__8993.s, this__8993.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8994 = this;
  return this__8994.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8995 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__8995.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.cljs$lang$arity$3(nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9002 = nodes.length;
      var j__9003 = i;
      while(true) {
        if(j__9003 < len__9002) {
          if(!(nodes[j__9003] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9003, null, null)
          }else {
            var temp__3971__auto____9004 = nodes[j__9003 + 1];
            if(cljs.core.truth_(temp__3971__auto____9004)) {
              var node__9005 = temp__3971__auto____9004;
              var temp__3971__auto____9006 = node__9005.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9006)) {
                var node_seq__9007 = temp__3971__auto____9006;
                return new cljs.core.NodeSeq(null, nodes, j__9003 + 2, node_seq__9007, null)
              }else {
                var G__9008 = j__9003 + 2;
                j__9003 = G__9008;
                continue
              }
            }else {
              var G__9009 = j__9003 + 2;
              j__9003 = G__9009;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9010 = this;
  var h__2220__auto____9011 = this__9010.__hash;
  if(!(h__2220__auto____9011 == null)) {
    return h__2220__auto____9011
  }else {
    var h__2220__auto____9012 = cljs.core.hash_coll(coll);
    this__9010.__hash = h__2220__auto____9012;
    return h__2220__auto____9012
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9013 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9014 = this;
  var this__9015 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9015], 0))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9016 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9017 = this;
  return cljs.core.first(this__9017.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9018 = this;
  return cljs.core.create_array_node_seq.cljs$lang$arity$4(null, this__9018.nodes, this__9018.i, cljs.core.next(this__9018.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9019 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9020 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9020.nodes, this__9020.i, this__9020.s, this__9020.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9021 = this;
  return this__9021.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9022 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__9022.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.cljs$lang$arity$4(null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9029 = nodes.length;
      var j__9030 = i;
      while(true) {
        if(j__9030 < len__9029) {
          var temp__3971__auto____9031 = nodes[j__9030];
          if(cljs.core.truth_(temp__3971__auto____9031)) {
            var nj__9032 = temp__3971__auto____9031;
            var temp__3971__auto____9033 = nj__9032.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9033)) {
              var ns__9034 = temp__3971__auto____9033;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9030 + 1, ns__9034, null)
            }else {
              var G__9035 = j__9030 + 1;
              j__9030 = G__9035;
              continue
            }
          }else {
            var G__9036 = j__9030 + 1;
            j__9030 = G__9036;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9039 = this;
  return new cljs.core.TransientHashMap({}, this__9039.root, this__9039.cnt, this__9039.has_nil_QMARK_, this__9039.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9040 = this;
  var h__2220__auto____9041 = this__9040.__hash;
  if(!(h__2220__auto____9041 == null)) {
    return h__2220__auto____9041
  }else {
    var h__2220__auto____9042 = cljs.core.hash_imap(coll);
    this__9040.__hash = h__2220__auto____9042;
    return h__2220__auto____9042
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9043 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9044 = this;
  if(k == null) {
    if(this__9044.has_nil_QMARK_) {
      return this__9044.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9044.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9044.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9045 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9046 = this__9045.has_nil_QMARK_;
      if(and__3822__auto____9046) {
        return v === this__9045.nil_val
      }else {
        return and__3822__auto____9046
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9045.meta, this__9045.has_nil_QMARK_ ? this__9045.cnt : this__9045.cnt + 1, this__9045.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9047 = new cljs.core.Box(false);
    var new_root__9048 = (this__9045.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9045.root).inode_assoc(0, cljs.core.hash.cljs$lang$arity$1(k), k, v, added_leaf_QMARK___9047);
    if(new_root__9048 === this__9045.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9045.meta, added_leaf_QMARK___9047.val ? this__9045.cnt + 1 : this__9045.cnt, new_root__9048, this__9045.has_nil_QMARK_, this__9045.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9049 = this;
  if(k == null) {
    return this__9049.has_nil_QMARK_
  }else {
    if(this__9049.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9049.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9072 = null;
  var G__9072__2 = function(this_sym9050, k) {
    var this__9052 = this;
    var this_sym9050__9053 = this;
    var coll__9054 = this_sym9050__9053;
    return coll__9054.cljs$core$ILookup$_lookup$arity$2(coll__9054, k)
  };
  var G__9072__3 = function(this_sym9051, k, not_found) {
    var this__9052 = this;
    var this_sym9051__9055 = this;
    var coll__9056 = this_sym9051__9055;
    return coll__9056.cljs$core$ILookup$_lookup$arity$3(coll__9056, k, not_found)
  };
  G__9072 = function(this_sym9051, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9072__2.call(this, this_sym9051, k);
      case 3:
        return G__9072__3.call(this, this_sym9051, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9072
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9037, args9038) {
  var this__9057 = this;
  return this_sym9037.call.apply(this_sym9037, [this_sym9037].concat(args9038.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9058 = this;
  var init__9059 = this__9058.has_nil_QMARK_ ? f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init, null, this__9058.nil_val) : f.call(null, init, null, this__9058.nil_val) : init;
  if(cljs.core.reduced_QMARK_(init__9059)) {
    return cljs.core.deref(init__9059)
  }else {
    if(!(this__9058.root == null)) {
      return this__9058.root.kv_reduce(f, init__9059)
    }else {
      if("\ufdd0'else") {
        return init__9059
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9060 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9061 = this;
  var this__9062 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9062], 0))
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9063 = this;
  if(this__9063.cnt > 0) {
    var s__9064 = !(this__9063.root == null) ? this__9063.root.inode_seq() : null;
    if(this__9063.has_nil_QMARK_) {
      return cljs.core.cons(cljs.core.PersistentVector.fromArray([null, this__9063.nil_val], true), s__9064)
    }else {
      return s__9064
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9065 = this;
  return this__9065.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9066 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9067 = this;
  return new cljs.core.PersistentHashMap(meta, this__9067.cnt, this__9067.root, this__9067.has_nil_QMARK_, this__9067.nil_val, this__9067.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9068 = this;
  return this__9068.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9069 = this;
  return cljs.core._with_meta(cljs.core.PersistentHashMap.EMPTY, this__9069.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9070 = this;
  if(k == null) {
    if(this__9070.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9070.meta, this__9070.cnt - 1, this__9070.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9070.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9071 = this__9070.root.inode_without(0, cljs.core.hash.cljs$lang$arity$1(k), k);
        if(new_root__9071 === this__9070.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9070.meta, this__9070.cnt - 1, new_root__9071, this__9070.has_nil_QMARK_, this__9070.nil_val, null)
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
  var len__9073 = ks.length;
  var i__9074 = 0;
  var out__9075 = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9074 < len__9073) {
      var G__9076 = i__9074 + 1;
      var G__9077 = cljs.core.assoc_BANG_(out__9075, ks[i__9074], vs[i__9074]);
      i__9074 = G__9076;
      out__9075 = G__9077;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__9075)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9078 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9079 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9080 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9081 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9082 = this;
  if(k == null) {
    if(this__9082.has_nil_QMARK_) {
      return this__9082.nil_val
    }else {
      return null
    }
  }else {
    if(this__9082.root == null) {
      return null
    }else {
      return this__9082.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9083 = this;
  if(k == null) {
    if(this__9083.has_nil_QMARK_) {
      return this__9083.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9083.root == null) {
      return not_found
    }else {
      return this__9083.root.inode_lookup(0, cljs.core.hash.cljs$lang$arity$1(k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9084 = this;
  if(this__9084.edit) {
    return this__9084.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9085 = this;
  var tcoll__9086 = this;
  if(this__9085.edit) {
    if(function() {
      var G__9087__9088 = o;
      if(G__9087__9088) {
        if(function() {
          var or__3824__auto____9089 = G__9087__9088.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9089) {
            return or__3824__auto____9089
          }else {
            return G__9087__9088.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9087__9088.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__9087__9088)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__9087__9088)
      }
    }()) {
      return tcoll__9086.assoc_BANG_(cljs.core.key(o), cljs.core.val(o))
    }else {
      var es__9090 = cljs.core.seq(o);
      var tcoll__9091 = tcoll__9086;
      while(true) {
        var temp__3971__auto____9092 = cljs.core.first(es__9090);
        if(cljs.core.truth_(temp__3971__auto____9092)) {
          var e__9093 = temp__3971__auto____9092;
          var G__9104 = cljs.core.next(es__9090);
          var G__9105 = tcoll__9091.assoc_BANG_(cljs.core.key(e__9093), cljs.core.val(e__9093));
          es__9090 = G__9104;
          tcoll__9091 = G__9105;
          continue
        }else {
          return tcoll__9091
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9094 = this;
  var tcoll__9095 = this;
  if(this__9094.edit) {
    if(k == null) {
      if(this__9094.nil_val === v) {
      }else {
        this__9094.nil_val = v
      }
      if(this__9094.has_nil_QMARK_) {
      }else {
        this__9094.count = this__9094.count + 1;
        this__9094.has_nil_QMARK_ = true
      }
      return tcoll__9095
    }else {
      var added_leaf_QMARK___9096 = new cljs.core.Box(false);
      var node__9097 = (this__9094.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9094.root).inode_assoc_BANG_(this__9094.edit, 0, cljs.core.hash.cljs$lang$arity$1(k), k, v, added_leaf_QMARK___9096);
      if(node__9097 === this__9094.root) {
      }else {
        this__9094.root = node__9097
      }
      if(added_leaf_QMARK___9096.val) {
        this__9094.count = this__9094.count + 1
      }else {
      }
      return tcoll__9095
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9098 = this;
  var tcoll__9099 = this;
  if(this__9098.edit) {
    if(k == null) {
      if(this__9098.has_nil_QMARK_) {
        this__9098.has_nil_QMARK_ = false;
        this__9098.nil_val = null;
        this__9098.count = this__9098.count - 1;
        return tcoll__9099
      }else {
        return tcoll__9099
      }
    }else {
      if(this__9098.root == null) {
        return tcoll__9099
      }else {
        var removed_leaf_QMARK___9100 = new cljs.core.Box(false);
        var node__9101 = this__9098.root.inode_without_BANG_(this__9098.edit, 0, cljs.core.hash.cljs$lang$arity$1(k), k, removed_leaf_QMARK___9100);
        if(node__9101 === this__9098.root) {
        }else {
          this__9098.root = node__9101
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9100[0])) {
          this__9098.count = this__9098.count - 1
        }else {
        }
        return tcoll__9099
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9102 = this;
  var tcoll__9103 = this;
  if(this__9102.edit) {
    this__9102.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9102.count, this__9102.root, this__9102.has_nil_QMARK_, this__9102.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9108 = node;
  var stack__9109 = stack;
  while(true) {
    if(!(t__9108 == null)) {
      var G__9110 = ascending_QMARK_ ? t__9108.left : t__9108.right;
      var G__9111 = cljs.core.conj.cljs$lang$arity$2(stack__9109, t__9108);
      t__9108 = G__9110;
      stack__9109 = G__9111;
      continue
    }else {
      return stack__9109
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9112 = this;
  var h__2220__auto____9113 = this__9112.__hash;
  if(!(h__2220__auto____9113 == null)) {
    return h__2220__auto____9113
  }else {
    var h__2220__auto____9114 = cljs.core.hash_coll(coll);
    this__9112.__hash = h__2220__auto____9114;
    return h__2220__auto____9114
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9115 = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9116 = this;
  var this__9117 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9117], 0))
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9118 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9119 = this;
  if(this__9119.cnt < 0) {
    return cljs.core.count(cljs.core.next(coll)) + 1
  }else {
    return this__9119.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9120 = this;
  return cljs.core.peek(this__9120.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9121 = this;
  var t__9122 = cljs.core.first(this__9121.stack);
  var next_stack__9123 = cljs.core.tree_map_seq_push(this__9121.ascending_QMARK_ ? t__9122.right : t__9122.left, cljs.core.next(this__9121.stack), this__9121.ascending_QMARK_);
  if(!(next_stack__9123 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9123, this__9121.ascending_QMARK_, this__9121.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9124 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9125 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9125.stack, this__9125.ascending_QMARK_, this__9125.cnt, this__9125.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9126 = this;
  return this__9126.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push(tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.right)) {
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
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, ins.left)) {
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
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.BlackNode, right)) {
      return cljs.core.balance_right(key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9128 = cljs.core.instance_QMARK_(cljs.core.RedNode, right);
        if(and__3822__auto____9128) {
          return cljs.core.instance_QMARK_(cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9128
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right(right.key, right.val, right.left.right, right.right.redden()), null)
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
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.BlackNode, left)) {
      return cljs.core.balance_left(key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9130 = cljs.core.instance_QMARK_(cljs.core.RedNode, left);
        if(and__3822__auto____9130) {
          return cljs.core.instance_QMARK_(cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9130
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left(left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
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
  var init__9134 = f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(init, node.key, node.val) : f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_(init__9134)) {
    return cljs.core.deref(init__9134)
  }else {
    var init__9135 = !(node.left == null) ? tree_map_kv_reduce(node.left, f, init__9134) : init__9134;
    if(cljs.core.reduced_QMARK_(init__9135)) {
      return cljs.core.deref(init__9135)
    }else {
      var init__9136 = !(node.right == null) ? tree_map_kv_reduce(node.right, f, init__9135) : init__9135;
      if(cljs.core.reduced_QMARK_(init__9136)) {
        return cljs.core.deref(init__9136)
      }else {
        return init__9136
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9139 = this;
  var h__2220__auto____9140 = this__9139.__hash;
  if(!(h__2220__auto____9140 == null)) {
    return h__2220__auto____9140
  }else {
    var h__2220__auto____9141 = cljs.core.hash_coll(coll);
    this__9139.__hash = h__2220__auto____9141;
    return h__2220__auto____9141
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9142 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9143 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9144 = this;
  return cljs.core.assoc.cljs$lang$arity$3(cljs.core.PersistentVector.fromArray([this__9144.key, this__9144.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9192 = null;
  var G__9192__2 = function(this_sym9145, k) {
    var this__9147 = this;
    var this_sym9145__9148 = this;
    var node__9149 = this_sym9145__9148;
    return node__9149.cljs$core$ILookup$_lookup$arity$2(node__9149, k)
  };
  var G__9192__3 = function(this_sym9146, k, not_found) {
    var this__9147 = this;
    var this_sym9146__9150 = this;
    var node__9151 = this_sym9146__9150;
    return node__9151.cljs$core$ILookup$_lookup$arity$3(node__9151, k, not_found)
  };
  G__9192 = function(this_sym9146, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9192__2.call(this, this_sym9146, k);
      case 3:
        return G__9192__3.call(this, this_sym9146, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9192
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9137, args9138) {
  var this__9152 = this;
  return this_sym9137.call.apply(this_sym9137, [this_sym9137].concat(args9138.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9153 = this;
  return cljs.core.PersistentVector.fromArray([this__9153.key, this__9153.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9154 = this;
  return this__9154.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9155 = this;
  return this__9155.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9156 = this;
  var node__9157 = this;
  return ins.balance_right(node__9157)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9158 = this;
  var node__9159 = this;
  return new cljs.core.RedNode(this__9158.key, this__9158.val, this__9158.left, this__9158.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9160 = this;
  var node__9161 = this;
  return cljs.core.balance_right_del(this__9160.key, this__9160.val, this__9160.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9162 = this;
  var node__9163 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9164 = this;
  var node__9165 = this;
  return cljs.core.tree_map_kv_reduce(node__9165, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9166 = this;
  var node__9167 = this;
  return cljs.core.balance_left_del(this__9166.key, this__9166.val, del, this__9166.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9168 = this;
  var node__9169 = this;
  return ins.balance_left(node__9169)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9170 = this;
  var node__9171 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9171, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9193 = null;
  var G__9193__0 = function() {
    var this__9172 = this;
    var this__9174 = this;
    return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9174], 0))
  };
  G__9193 = function() {
    switch(arguments.length) {
      case 0:
        return G__9193__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9193
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9175 = this;
  var node__9176 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9176, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9177 = this;
  var node__9178 = this;
  return node__9178
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9179 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9180 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9181 = this;
  return cljs.core.list.cljs$lang$arity$2(this__9181.key, this__9181.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9182 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9183 = this;
  return this__9183.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9184 = this;
  return cljs.core.PersistentVector.fromArray([this__9184.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9185 = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([this__9185.key, this__9185.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9186 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9187 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([this__9187.key, this__9187.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9188 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9189 = this;
  if(n === 0) {
    return this__9189.key
  }else {
    if(n === 1) {
      return this__9189.val
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
  var this__9190 = this;
  if(n === 0) {
    return this__9190.key
  }else {
    if(n === 1) {
      return this__9190.val
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
  var this__9191 = this;
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9196 = this;
  var h__2220__auto____9197 = this__9196.__hash;
  if(!(h__2220__auto____9197 == null)) {
    return h__2220__auto____9197
  }else {
    var h__2220__auto____9198 = cljs.core.hash_coll(coll);
    this__9196.__hash = h__2220__auto____9198;
    return h__2220__auto____9198
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9199 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9200 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9201 = this;
  return cljs.core.assoc.cljs$lang$arity$3(cljs.core.PersistentVector.fromArray([this__9201.key, this__9201.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9249 = null;
  var G__9249__2 = function(this_sym9202, k) {
    var this__9204 = this;
    var this_sym9202__9205 = this;
    var node__9206 = this_sym9202__9205;
    return node__9206.cljs$core$ILookup$_lookup$arity$2(node__9206, k)
  };
  var G__9249__3 = function(this_sym9203, k, not_found) {
    var this__9204 = this;
    var this_sym9203__9207 = this;
    var node__9208 = this_sym9203__9207;
    return node__9208.cljs$core$ILookup$_lookup$arity$3(node__9208, k, not_found)
  };
  G__9249 = function(this_sym9203, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9249__2.call(this, this_sym9203, k);
      case 3:
        return G__9249__3.call(this, this_sym9203, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9249
}();
cljs.core.RedNode.prototype.apply = function(this_sym9194, args9195) {
  var this__9209 = this;
  return this_sym9194.call.apply(this_sym9194, [this_sym9194].concat(args9195.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9210 = this;
  return cljs.core.PersistentVector.fromArray([this__9210.key, this__9210.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9211 = this;
  return this__9211.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9212 = this;
  return this__9212.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9213 = this;
  var node__9214 = this;
  return new cljs.core.RedNode(this__9213.key, this__9213.val, this__9213.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9215 = this;
  var node__9216 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9217 = this;
  var node__9218 = this;
  return new cljs.core.RedNode(this__9217.key, this__9217.val, this__9217.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9219 = this;
  var node__9220 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9221 = this;
  var node__9222 = this;
  return cljs.core.tree_map_kv_reduce(node__9222, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9223 = this;
  var node__9224 = this;
  return new cljs.core.RedNode(this__9223.key, this__9223.val, del, this__9223.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9225 = this;
  var node__9226 = this;
  return new cljs.core.RedNode(this__9225.key, this__9225.val, ins, this__9225.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9227 = this;
  var node__9228 = this;
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9227.left)) {
    return new cljs.core.RedNode(this__9227.key, this__9227.val, this__9227.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9227.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9227.right)) {
      return new cljs.core.RedNode(this__9227.right.key, this__9227.right.val, new cljs.core.BlackNode(this__9227.key, this__9227.val, this__9227.left, this__9227.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9227.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9228, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9250 = null;
  var G__9250__0 = function() {
    var this__9229 = this;
    var this__9231 = this;
    return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9231], 0))
  };
  G__9250 = function() {
    switch(arguments.length) {
      case 0:
        return G__9250__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9250
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9232 = this;
  var node__9233 = this;
  if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9232.right)) {
    return new cljs.core.RedNode(this__9232.key, this__9232.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9232.left, null), this__9232.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_(cljs.core.RedNode, this__9232.left)) {
      return new cljs.core.RedNode(this__9232.left.key, this__9232.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9232.left.left, null), new cljs.core.BlackNode(this__9232.key, this__9232.val, this__9232.left.right, this__9232.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9233, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9234 = this;
  var node__9235 = this;
  return new cljs.core.BlackNode(this__9234.key, this__9234.val, this__9234.left, this__9234.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9236 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9237 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9238 = this;
  return cljs.core.list.cljs$lang$arity$2(this__9238.key, this__9238.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9239 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9240 = this;
  return this__9240.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9241 = this;
  return cljs.core.PersistentVector.fromArray([this__9241.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9242 = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([this__9242.key, this__9242.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9243 = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9244 = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([this__9244.key, this__9244.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9245 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9246 = this;
  if(n === 0) {
    return this__9246.key
  }else {
    if(n === 1) {
      return this__9246.val
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
  var this__9247 = this;
  if(n === 0) {
    return this__9247.key
  }else {
    if(n === 1) {
      return this__9247.val
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
  var this__9248 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9254 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c__9254 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9254 < 0) {
        var ins__9255 = tree_map_add(comp, tree.left, k, v, found);
        if(!(ins__9255 == null)) {
          return tree.add_left(ins__9255)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9256 = tree_map_add(comp, tree.right, k, v, found);
          if(!(ins__9256 == null)) {
            return tree.add_right(ins__9256)
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
      if(cljs.core.instance_QMARK_(cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_(cljs.core.RedNode, right)) {
          var app__9259 = tree_map_append(left.right, right.left);
          if(cljs.core.instance_QMARK_(cljs.core.RedNode, app__9259)) {
            return new cljs.core.RedNode(app__9259.key, app__9259.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9259.left, null), new cljs.core.RedNode(right.key, right.val, app__9259.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9259, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append(left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_(cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append(left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9260 = tree_map_append(left.right, right.left);
            if(cljs.core.instance_QMARK_(cljs.core.RedNode, app__9260)) {
              return new cljs.core.RedNode(app__9260.key, app__9260.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9260.left, null), new cljs.core.BlackNode(right.key, right.val, app__9260.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del(left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9260, right.right, null))
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
    var c__9266 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c__9266 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append(tree.left, tree.right)
    }else {
      if(c__9266 < 0) {
        var del__9267 = tree_map_remove(comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9268 = !(del__9267 == null);
          if(or__3824__auto____9268) {
            return or__3824__auto____9268
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_(cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del(tree.key, tree.val, del__9267, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9267, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9269 = tree_map_remove(comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9270 = !(del__9269 == null);
            if(or__3824__auto____9270) {
              return or__3824__auto____9270
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_(cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del(tree.key, tree.val, tree.left, del__9269)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9269, null)
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
  var tk__9273 = tree.key;
  var c__9274 = comp.cljs$lang$arity$2 ? comp.cljs$lang$arity$2(k, tk__9273) : comp.call(null, k, tk__9273);
  if(c__9274 === 0) {
    return tree.replace(tk__9273, v, tree.left, tree.right)
  }else {
    if(c__9274 < 0) {
      return tree.replace(tk__9273, tree.val, tree_map_replace(comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9273, tree.val, tree.left, tree_map_replace(comp, tree.right, k, v))
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9277 = this;
  var h__2220__auto____9278 = this__9277.__hash;
  if(!(h__2220__auto____9278 == null)) {
    return h__2220__auto____9278
  }else {
    var h__2220__auto____9279 = cljs.core.hash_imap(coll);
    this__9277.__hash = h__2220__auto____9279;
    return h__2220__auto____9279
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9280 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9281 = this;
  var n__9282 = coll.entry_at(k);
  if(!(n__9282 == null)) {
    return n__9282.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9283 = this;
  var found__9284 = [null];
  var t__9285 = cljs.core.tree_map_add(this__9283.comp, this__9283.tree, k, v, found__9284);
  if(t__9285 == null) {
    var found_node__9286 = cljs.core.nth.cljs$lang$arity$2(found__9284, 0);
    if(cljs.core._EQ_.cljs$lang$arity$2(v, found_node__9286.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9283.comp, cljs.core.tree_map_replace(this__9283.comp, this__9283.tree, k, v), this__9283.cnt, this__9283.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9283.comp, t__9285.blacken(), this__9283.cnt + 1, this__9283.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9287 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9321 = null;
  var G__9321__2 = function(this_sym9288, k) {
    var this__9290 = this;
    var this_sym9288__9291 = this;
    var coll__9292 = this_sym9288__9291;
    return coll__9292.cljs$core$ILookup$_lookup$arity$2(coll__9292, k)
  };
  var G__9321__3 = function(this_sym9289, k, not_found) {
    var this__9290 = this;
    var this_sym9289__9293 = this;
    var coll__9294 = this_sym9289__9293;
    return coll__9294.cljs$core$ILookup$_lookup$arity$3(coll__9294, k, not_found)
  };
  G__9321 = function(this_sym9289, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9321__2.call(this, this_sym9289, k);
      case 3:
        return G__9321__3.call(this, this_sym9289, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9321
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9275, args9276) {
  var this__9295 = this;
  return this_sym9275.call.apply(this_sym9275, [this_sym9275].concat(args9276.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9296 = this;
  if(!(this__9296.tree == null)) {
    return cljs.core.tree_map_kv_reduce(this__9296.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9297 = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$lang$arity$2(entry, 0), cljs.core._nth.cljs$lang$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9298 = this;
  if(this__9298.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9298.tree, false, this__9298.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9299 = this;
  var this__9300 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9300], 0))
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9301 = this;
  var coll__9302 = this;
  var t__9303 = this__9301.tree;
  while(true) {
    if(!(t__9303 == null)) {
      var c__9304 = this__9301.comp.cljs$lang$arity$2 ? this__9301.comp.cljs$lang$arity$2(k, t__9303.key) : this__9301.comp.call(null, k, t__9303.key);
      if(c__9304 === 0) {
        return t__9303
      }else {
        if(c__9304 < 0) {
          var G__9322 = t__9303.left;
          t__9303 = G__9322;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9323 = t__9303.right;
            t__9303 = G__9323;
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
  var this__9305 = this;
  if(this__9305.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9305.tree, ascending_QMARK_, this__9305.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9306 = this;
  if(this__9306.cnt > 0) {
    var stack__9307 = null;
    var t__9308 = this__9306.tree;
    while(true) {
      if(!(t__9308 == null)) {
        var c__9309 = this__9306.comp.cljs$lang$arity$2 ? this__9306.comp.cljs$lang$arity$2(k, t__9308.key) : this__9306.comp.call(null, k, t__9308.key);
        if(c__9309 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.cljs$lang$arity$2(stack__9307, t__9308), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9309 < 0) {
              var G__9324 = cljs.core.conj.cljs$lang$arity$2(stack__9307, t__9308);
              var G__9325 = t__9308.left;
              stack__9307 = G__9324;
              t__9308 = G__9325;
              continue
            }else {
              var G__9326 = stack__9307;
              var G__9327 = t__9308.right;
              stack__9307 = G__9326;
              t__9308 = G__9327;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9309 > 0) {
                var G__9328 = cljs.core.conj.cljs$lang$arity$2(stack__9307, t__9308);
                var G__9329 = t__9308.right;
                stack__9307 = G__9328;
                t__9308 = G__9329;
                continue
              }else {
                var G__9330 = stack__9307;
                var G__9331 = t__9308.left;
                stack__9307 = G__9330;
                t__9308 = G__9331;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9307 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9307, ascending_QMARK_, -1, null)
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
  var this__9310 = this;
  return cljs.core.key(entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9311 = this;
  return this__9311.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9312 = this;
  if(this__9312.cnt > 0) {
    return cljs.core.create_tree_map_seq(this__9312.tree, true, this__9312.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9313 = this;
  return this__9313.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9314 = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9315 = this;
  return new cljs.core.PersistentTreeMap(this__9315.comp, this__9315.tree, this__9315.cnt, meta, this__9315.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9316 = this;
  return this__9316.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9317 = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeMap.EMPTY, this__9317.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9318 = this;
  var found__9319 = [null];
  var t__9320 = cljs.core.tree_map_remove(this__9318.comp, this__9318.tree, k, found__9319);
  if(t__9320 == null) {
    if(cljs.core.nth.cljs$lang$arity$2(found__9319, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9318.comp, null, 0, this__9318.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9318.comp, t__9320.blacken(), this__9318.cnt - 1, this__9318.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9334 = cljs.core.seq(keyvals);
    var out__9335 = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9334) {
        var G__9336 = cljs.core.nnext(in__9334);
        var G__9337 = cljs.core.assoc_BANG_(out__9335, cljs.core.first(in__9334), cljs.core.second(in__9334));
        in__9334 = G__9336;
        out__9335 = G__9337;
        continue
      }else {
        return cljs.core.persistent_BANG_(out__9335)
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
  hash_map.cljs$lang$applyTo = function(arglist__9338) {
    var keyvals = cljs.core.seq(arglist__9338);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(cljs.core.count(keyvals), 2), cljs.core.apply.cljs$lang$arity$2(cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9339) {
    var keyvals = cljs.core.seq(arglist__9339);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9343 = [];
    var obj__9344 = {};
    var kvs__9345 = cljs.core.seq(keyvals);
    while(true) {
      if(kvs__9345) {
        ks__9343.push(cljs.core.first(kvs__9345));
        obj__9344[cljs.core.first(kvs__9345)] = cljs.core.second(kvs__9345);
        var G__9346 = cljs.core.nnext(kvs__9345);
        kvs__9345 = G__9346;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.cljs$lang$arity$2 ? cljs.core.ObjMap.fromObject.cljs$lang$arity$2(ks__9343, obj__9344) : cljs.core.ObjMap.fromObject.call(null, ks__9343, obj__9344)
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
  obj_map.cljs$lang$applyTo = function(arglist__9347) {
    var keyvals = cljs.core.seq(arglist__9347);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9350 = cljs.core.seq(keyvals);
    var out__9351 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9350) {
        var G__9352 = cljs.core.nnext(in__9350);
        var G__9353 = cljs.core.assoc.cljs$lang$arity$3(out__9351, cljs.core.first(in__9350), cljs.core.second(in__9350));
        in__9350 = G__9352;
        out__9351 = G__9353;
        continue
      }else {
        return out__9351
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
  sorted_map.cljs$lang$applyTo = function(arglist__9354) {
    var keyvals = cljs.core.seq(arglist__9354);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9357 = cljs.core.seq(keyvals);
    var out__9358 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9357) {
        var G__9359 = cljs.core.nnext(in__9357);
        var G__9360 = cljs.core.assoc.cljs$lang$arity$3(out__9358, cljs.core.first(in__9357), cljs.core.second(in__9357));
        in__9357 = G__9359;
        out__9358 = G__9360;
        continue
      }else {
        return out__9358
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
  sorted_map_by.cljs$lang$applyTo = function(arglist__9361) {
    var comparator = cljs.core.first(arglist__9361);
    var keyvals = cljs.core.rest(arglist__9361);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq(cljs.core.map.cljs$lang$arity$2(cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key(map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq(cljs.core.map.cljs$lang$arity$2(cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val(map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      return cljs.core.reduce.cljs$lang$arity$2(function(p1__9362_SHARP_, p2__9363_SHARP_) {
        return cljs.core.conj.cljs$lang$arity$2(function() {
          var or__3824__auto____9365 = p1__9362_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9365)) {
            return or__3824__auto____9365
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9363_SHARP_)
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
  merge.cljs$lang$applyTo = function(arglist__9366) {
    var maps = cljs.core.seq(arglist__9366);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      var merge_entry__9374 = function(m, e) {
        var k__9372 = cljs.core.first(e);
        var v__9373 = cljs.core.second(e);
        if(cljs.core.contains_QMARK_(m, k__9372)) {
          return cljs.core.assoc.cljs$lang$arity$3(m, k__9372, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(m, k__9372, null), v__9373) : f.call(null, cljs.core._lookup.cljs$lang$arity$3(m, k__9372, null), v__9373))
        }else {
          return cljs.core.assoc.cljs$lang$arity$3(m, k__9372, v__9373)
        }
      };
      var merge2__9376 = function(m1, m2) {
        return cljs.core.reduce.cljs$lang$arity$3(merge_entry__9374, function() {
          var or__3824__auto____9375 = m1;
          if(cljs.core.truth_(or__3824__auto____9375)) {
            return or__3824__auto____9375
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq(m2))
      };
      return cljs.core.reduce.cljs$lang$arity$2(merge2__9376, maps)
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
  merge_with.cljs$lang$applyTo = function(arglist__9377) {
    var f = cljs.core.first(arglist__9377);
    var maps = cljs.core.rest(arglist__9377);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9382 = cljs.core.ObjMap.EMPTY;
  var keys__9383 = cljs.core.seq(keyseq);
  while(true) {
    if(keys__9383) {
      var key__9384 = cljs.core.first(keys__9383);
      var entry__9385 = cljs.core._lookup.cljs$lang$arity$3(map, key__9384, "\ufdd0'cljs.core/not-found");
      var G__9386 = cljs.core.not_EQ_.cljs$lang$arity$2(entry__9385, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.cljs$lang$arity$3(ret__9382, key__9384, entry__9385) : ret__9382;
      var G__9387 = cljs.core.next(keys__9383);
      ret__9382 = G__9386;
      keys__9383 = G__9387;
      continue
    }else {
      return ret__9382
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9391 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$(this__9391.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9392 = this;
  var h__2220__auto____9393 = this__9392.__hash;
  if(!(h__2220__auto____9393 == null)) {
    return h__2220__auto____9393
  }else {
    var h__2220__auto____9394 = cljs.core.hash_iset(coll);
    this__9392.__hash = h__2220__auto____9394;
    return h__2220__auto____9394
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9395 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9396 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_(this__9396.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9417 = null;
  var G__9417__2 = function(this_sym9397, k) {
    var this__9399 = this;
    var this_sym9397__9400 = this;
    var coll__9401 = this_sym9397__9400;
    return coll__9401.cljs$core$ILookup$_lookup$arity$2(coll__9401, k)
  };
  var G__9417__3 = function(this_sym9398, k, not_found) {
    var this__9399 = this;
    var this_sym9398__9402 = this;
    var coll__9403 = this_sym9398__9402;
    return coll__9403.cljs$core$ILookup$_lookup$arity$3(coll__9403, k, not_found)
  };
  G__9417 = function(this_sym9398, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9417__2.call(this, this_sym9398, k);
      case 3:
        return G__9417__3.call(this, this_sym9398, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9417
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9389, args9390) {
  var this__9404 = this;
  return this_sym9389.call.apply(this_sym9389, [this_sym9389].concat(args9390.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9405 = this;
  return new cljs.core.PersistentHashSet(this__9405.meta, cljs.core.assoc.cljs$lang$arity$3(this__9405.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9406 = this;
  var this__9407 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9407], 0))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9408 = this;
  return cljs.core.keys(this__9408.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9409 = this;
  return new cljs.core.PersistentHashSet(this__9409.meta, cljs.core.dissoc.cljs$lang$arity$2(this__9409.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9410 = this;
  return cljs.core.count(cljs.core.seq(coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9411 = this;
  var and__3822__auto____9412 = cljs.core.set_QMARK_(other);
  if(and__3822__auto____9412) {
    var and__3822__auto____9413 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3822__auto____9413) {
      return cljs.core.every_QMARK_(function(p1__9388_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__9388_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9413
    }
  }else {
    return and__3822__auto____9412
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9414 = this;
  return new cljs.core.PersistentHashSet(meta, this__9414.hash_map, this__9414.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9415 = this;
  return this__9415.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9416 = this;
  return cljs.core.with_meta(cljs.core.PersistentHashSet.EMPTY, this__9416.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map(), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9418 = cljs.core.count(items);
  var i__9419 = 0;
  var out__9420 = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9419 < len__9418) {
      var G__9421 = i__9419 + 1;
      var G__9422 = cljs.core.conj_BANG_(out__9420, items[i__9419]);
      i__9419 = G__9421;
      out__9420 = G__9422;
      continue
    }else {
      return cljs.core.persistent_BANG_(out__9420)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9440 = null;
  var G__9440__2 = function(this_sym9426, k) {
    var this__9428 = this;
    var this_sym9426__9429 = this;
    var tcoll__9430 = this_sym9426__9429;
    if(cljs.core._lookup.cljs$lang$arity$3(this__9428.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9440__3 = function(this_sym9427, k, not_found) {
    var this__9428 = this;
    var this_sym9427__9431 = this;
    var tcoll__9432 = this_sym9427__9431;
    if(cljs.core._lookup.cljs$lang$arity$3(this__9428.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9440 = function(this_sym9427, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9440__2.call(this, this_sym9427, k);
      case 3:
        return G__9440__3.call(this, this_sym9427, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9440
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9424, args9425) {
  var this__9433 = this;
  return this_sym9424.call.apply(this_sym9424, [this_sym9424].concat(args9425.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9434 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9435 = this;
  if(cljs.core._lookup.cljs$lang$arity$3(this__9435.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9436 = this;
  return cljs.core.count(this__9436.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9437 = this;
  this__9437.transient_map = cljs.core.dissoc_BANG_(this__9437.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9438 = this;
  this__9438.transient_map = cljs.core.assoc_BANG_(this__9438.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9439 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_(this__9439.transient_map), null)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9443 = this;
  var h__2220__auto____9444 = this__9443.__hash;
  if(!(h__2220__auto____9444 == null)) {
    return h__2220__auto____9444
  }else {
    var h__2220__auto____9445 = cljs.core.hash_iset(coll);
    this__9443.__hash = h__2220__auto____9445;
    return h__2220__auto____9445
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9446 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9447 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_(this__9447.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9473 = null;
  var G__9473__2 = function(this_sym9448, k) {
    var this__9450 = this;
    var this_sym9448__9451 = this;
    var coll__9452 = this_sym9448__9451;
    return coll__9452.cljs$core$ILookup$_lookup$arity$2(coll__9452, k)
  };
  var G__9473__3 = function(this_sym9449, k, not_found) {
    var this__9450 = this;
    var this_sym9449__9453 = this;
    var coll__9454 = this_sym9449__9453;
    return coll__9454.cljs$core$ILookup$_lookup$arity$3(coll__9454, k, not_found)
  };
  G__9473 = function(this_sym9449, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9473__2.call(this, this_sym9449, k);
      case 3:
        return G__9473__3.call(this, this_sym9449, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9473
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9441, args9442) {
  var this__9455 = this;
  return this_sym9441.call.apply(this_sym9441, [this_sym9441].concat(args9442.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9456 = this;
  return new cljs.core.PersistentTreeSet(this__9456.meta, cljs.core.assoc.cljs$lang$arity$3(this__9456.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9457 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core.rseq(this__9457.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9458 = this;
  var this__9459 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9459], 0))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9460 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core._sorted_seq(this__9460.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9461 = this;
  return cljs.core.map.cljs$lang$arity$2(cljs.core.key, cljs.core._sorted_seq_from(this__9461.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9462 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9463 = this;
  return cljs.core._comparator(this__9463.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9464 = this;
  return cljs.core.keys(this__9464.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9465 = this;
  return new cljs.core.PersistentTreeSet(this__9465.meta, cljs.core.dissoc.cljs$lang$arity$2(this__9465.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9466 = this;
  return cljs.core.count(this__9466.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9467 = this;
  var and__3822__auto____9468 = cljs.core.set_QMARK_(other);
  if(and__3822__auto____9468) {
    var and__3822__auto____9469 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3822__auto____9469) {
      return cljs.core.every_QMARK_(function(p1__9423_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__9423_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9469
    }
  }else {
    return and__3822__auto____9468
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9470 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9470.tree_map, this__9470.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9471 = this;
  return this__9471.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9472 = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeSet.EMPTY, this__9472.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map(), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9478__delegate = function(keys) {
      var in__9476 = cljs.core.seq(keys);
      var out__9477 = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq(in__9476)) {
          var G__9479 = cljs.core.next(in__9476);
          var G__9480 = cljs.core.conj_BANG_(out__9477, cljs.core.first(in__9476));
          in__9476 = G__9479;
          out__9477 = G__9480;
          continue
        }else {
          return cljs.core.persistent_BANG_(out__9477)
        }
        break
      }
    };
    var G__9478 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9478__delegate.call(this, keys)
    };
    G__9478.cljs$lang$maxFixedArity = 0;
    G__9478.cljs$lang$applyTo = function(arglist__9481) {
      var keys = cljs.core.seq(arglist__9481);
      return G__9478__delegate(keys)
    };
    G__9478.cljs$lang$arity$variadic = G__9478__delegate;
    return G__9478
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
  return cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9482) {
    var keys = cljs.core.seq(arglist__9482);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.cljs$lang$arity$3(cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by(comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9484) {
    var comparator = cljs.core.first(arglist__9484);
    var keys = cljs.core.rest(arglist__9484);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_(coll)) {
    var n__9490 = cljs.core.count(coll);
    return cljs.core.reduce.cljs$lang$arity$3(function(v, i) {
      var temp__3971__auto____9491 = cljs.core.find(smap, cljs.core.nth.cljs$lang$arity$2(v, i));
      if(cljs.core.truth_(temp__3971__auto____9491)) {
        var e__9492 = temp__3971__auto____9491;
        return cljs.core.assoc.cljs$lang$arity$3(v, i, cljs.core.second(e__9492))
      }else {
        return v
      }
    }, coll, cljs.core.take(n__9490, cljs.core.iterate(cljs.core.inc, 0)))
  }else {
    return cljs.core.map.cljs$lang$arity$2(function(p1__9483_SHARP_) {
      var temp__3971__auto____9493 = cljs.core.find(smap, p1__9483_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9493)) {
        var e__9494 = temp__3971__auto____9493;
        return cljs.core.second(e__9494)
      }else {
        return p1__9483_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9524 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9517, seen) {
        while(true) {
          var vec__9518__9519 = p__9517;
          var f__9520 = cljs.core.nth.cljs$lang$arity$3(vec__9518__9519, 0, null);
          var xs__9521 = vec__9518__9519;
          var temp__3974__auto____9522 = cljs.core.seq(xs__9521);
          if(temp__3974__auto____9522) {
            var s__9523 = temp__3974__auto____9522;
            if(cljs.core.contains_QMARK_(seen, f__9520)) {
              var G__9525 = cljs.core.rest(s__9523);
              var G__9526 = seen;
              p__9517 = G__9525;
              seen = G__9526;
              continue
            }else {
              return cljs.core.cons(f__9520, step(cljs.core.rest(s__9523), cljs.core.conj.cljs$lang$arity$2(seen, f__9520)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9524.cljs$lang$arity$2 ? step__9524.cljs$lang$arity$2(coll, cljs.core.PersistentHashSet.EMPTY) : step__9524.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9529 = cljs.core.PersistentVector.EMPTY;
  var s__9530 = s;
  while(true) {
    if(cljs.core.next(s__9530)) {
      var G__9531 = cljs.core.conj.cljs$lang$arity$2(ret__9529, cljs.core.first(s__9530));
      var G__9532 = cljs.core.next(s__9530);
      ret__9529 = G__9531;
      s__9530 = G__9532;
      continue
    }else {
      return cljs.core.seq(ret__9529)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_(x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9535 = cljs.core.keyword_QMARK_(x);
      if(or__3824__auto____9535) {
        return or__3824__auto____9535
      }else {
        return cljs.core.symbol_QMARK_(x)
      }
    }()) {
      var i__9536 = x.lastIndexOf("/");
      if(i__9536 < 0) {
        return cljs.core.subs.cljs$lang$arity$2(x, 2)
      }else {
        return cljs.core.subs.cljs$lang$arity$2(x, i__9536 + 1)
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
    var or__3824__auto____9539 = cljs.core.keyword_QMARK_(x);
    if(or__3824__auto____9539) {
      return or__3824__auto____9539
    }else {
      return cljs.core.symbol_QMARK_(x)
    }
  }()) {
    var i__9540 = x.lastIndexOf("/");
    if(i__9540 > -1) {
      return cljs.core.subs.cljs$lang$arity$3(x, 2, i__9540)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9547 = cljs.core.ObjMap.EMPTY;
  var ks__9548 = cljs.core.seq(keys);
  var vs__9549 = cljs.core.seq(vals);
  while(true) {
    if(function() {
      var and__3822__auto____9550 = ks__9548;
      if(and__3822__auto____9550) {
        return vs__9549
      }else {
        return and__3822__auto____9550
      }
    }()) {
      var G__9551 = cljs.core.assoc.cljs$lang$arity$3(map__9547, cljs.core.first(ks__9548), cljs.core.first(vs__9549));
      var G__9552 = cljs.core.next(ks__9548);
      var G__9553 = cljs.core.next(vs__9549);
      map__9547 = G__9551;
      ks__9548 = G__9552;
      vs__9549 = G__9553;
      continue
    }else {
      return map__9547
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
    if((k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(x) : k.call(null, x)) > (k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9556__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9541_SHARP_, p2__9542_SHARP_) {
        return max_key.cljs$lang$arity$3(k, p1__9541_SHARP_, p2__9542_SHARP_)
      }, max_key.cljs$lang$arity$3(k, x, y), more)
    };
    var G__9556 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9556__delegate.call(this, k, x, y, more)
    };
    G__9556.cljs$lang$maxFixedArity = 3;
    G__9556.cljs$lang$applyTo = function(arglist__9557) {
      var k = cljs.core.first(arglist__9557);
      var x = cljs.core.first(cljs.core.next(arglist__9557));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9557)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9557)));
      return G__9556__delegate(k, x, y, more)
    };
    G__9556.cljs$lang$arity$variadic = G__9556__delegate;
    return G__9556
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
    if((k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(x) : k.call(null, x)) < (k.cljs$lang$arity$1 ? k.cljs$lang$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9558__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9554_SHARP_, p2__9555_SHARP_) {
        return min_key.cljs$lang$arity$3(k, p1__9554_SHARP_, p2__9555_SHARP_)
      }, min_key.cljs$lang$arity$3(k, x, y), more)
    };
    var G__9558 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9558__delegate.call(this, k, x, y, more)
    };
    G__9558.cljs$lang$maxFixedArity = 3;
    G__9558.cljs$lang$applyTo = function(arglist__9559) {
      var k = cljs.core.first(arglist__9559);
      var x = cljs.core.first(cljs.core.next(arglist__9559));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9559)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9559)));
      return G__9558__delegate(k, x, y, more)
    };
    G__9558.cljs$lang$arity$variadic = G__9558__delegate;
    return G__9558
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
    return partition_all.cljs$lang$arity$3(n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9562 = cljs.core.seq(coll);
      if(temp__3974__auto____9562) {
        var s__9563 = temp__3974__auto____9562;
        return cljs.core.cons(cljs.core.take(n, s__9563), partition_all.cljs$lang$arity$3(n, step, cljs.core.drop(step, s__9563)))
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
    var temp__3974__auto____9566 = cljs.core.seq(coll);
    if(temp__3974__auto____9566) {
      var s__9567 = temp__3974__auto____9566;
      if(cljs.core.truth_(pred.cljs$lang$arity$1 ? pred.cljs$lang$arity$1(cljs.core.first(s__9567)) : pred.call(null, cljs.core.first(s__9567)))) {
        return cljs.core.cons(cljs.core.first(s__9567), take_while(pred, cljs.core.rest(s__9567)))
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
    var comp__9569 = cljs.core._comparator(sc);
    return test.cljs$lang$arity$2 ? test.cljs$lang$arity$2(comp__9569.cljs$lang$arity$2 ? comp__9569.cljs$lang$arity$2(cljs.core._entry_key(sc, e), key) : comp__9569.call(null, cljs.core._entry_key(sc, e), key), 0) : test.call(null, comp__9569.cljs$lang$arity$2 ? comp__9569.cljs$lang$arity$2(cljs.core._entry_key(sc, e), key) : comp__9569.call(null, cljs.core._entry_key(sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9581 = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9582 = cljs.core._sorted_seq_from(sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9582)) {
        var vec__9583__9584 = temp__3974__auto____9582;
        var e__9585 = cljs.core.nth.cljs$lang$arity$3(vec__9583__9584, 0, null);
        var s__9586 = vec__9583__9584;
        if(cljs.core.truth_(include__9581.cljs$lang$arity$1 ? include__9581.cljs$lang$arity$1(e__9585) : include__9581.call(null, e__9585))) {
          return s__9586
        }else {
          return cljs.core.next(s__9586)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include__9581, cljs.core._sorted_seq(sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9587 = cljs.core._sorted_seq_from(sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9587)) {
      var vec__9588__9589 = temp__3974__auto____9587;
      var e__9590 = cljs.core.nth.cljs$lang$arity$3(vec__9588__9589, 0, null);
      var s__9591 = vec__9588__9589;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, start_test, start_key).call(null, e__9590)) ? s__9591 : cljs.core.next(s__9591))
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
    var include__9603 = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9604 = cljs.core._sorted_seq_from(sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9604)) {
        var vec__9605__9606 = temp__3974__auto____9604;
        var e__9607 = cljs.core.nth.cljs$lang$arity$3(vec__9605__9606, 0, null);
        var s__9608 = vec__9605__9606;
        if(cljs.core.truth_(include__9603.cljs$lang$arity$1 ? include__9603.cljs$lang$arity$1(e__9607) : include__9603.call(null, e__9607))) {
          return s__9608
        }else {
          return cljs.core.next(s__9608)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include__9603, cljs.core._sorted_seq(sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9609 = cljs.core._sorted_seq_from(sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9609)) {
      var vec__9610__9611 = temp__3974__auto____9609;
      var e__9612 = cljs.core.nth.cljs$lang$arity$3(vec__9610__9611, 0, null);
      var s__9613 = vec__9610__9611;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, end_test, end_key).call(null, e__9612)) ? s__9613 : cljs.core.next(s__9613))
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9614 = this;
  var h__2220__auto____9615 = this__9614.__hash;
  if(!(h__2220__auto____9615 == null)) {
    return h__2220__auto____9615
  }else {
    var h__2220__auto____9616 = cljs.core.hash_coll(rng);
    this__9614.__hash = h__2220__auto____9616;
    return h__2220__auto____9616
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9617 = this;
  if(this__9617.step > 0) {
    if(this__9617.start + this__9617.step < this__9617.end) {
      return new cljs.core.Range(this__9617.meta, this__9617.start + this__9617.step, this__9617.end, this__9617.step, null)
    }else {
      return null
    }
  }else {
    if(this__9617.start + this__9617.step > this__9617.end) {
      return new cljs.core.Range(this__9617.meta, this__9617.start + this__9617.step, this__9617.end, this__9617.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9618 = this;
  return cljs.core.cons(o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9619 = this;
  var this__9620 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__9620], 0))
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9621 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$2(rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9622 = this;
  return cljs.core.ci_reduce.cljs$lang$arity$3(rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9623 = this;
  if(this__9623.step > 0) {
    if(this__9623.start < this__9623.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9623.start > this__9623.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9624 = this;
  if(cljs.core.not(rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9624.end - this__9624.start) / this__9624.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9625 = this;
  return this__9625.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9626 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9626.meta, this__9626.start + this__9626.step, this__9626.end, this__9626.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9627 = this;
  return cljs.core.equiv_sequential(rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9628 = this;
  return new cljs.core.Range(meta, this__9628.start, this__9628.end, this__9628.step, this__9628.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9629 = this;
  return this__9629.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9630 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9630.start + n * this__9630.step
  }else {
    if(function() {
      var and__3822__auto____9631 = this__9630.start > this__9630.end;
      if(and__3822__auto____9631) {
        return this__9630.step === 0
      }else {
        return and__3822__auto____9631
      }
    }()) {
      return this__9630.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9632 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9632.start + n * this__9632.step
  }else {
    if(function() {
      var and__3822__auto____9633 = this__9632.start > this__9632.end;
      if(and__3822__auto____9633) {
        return this__9632.step === 0
      }else {
        return and__3822__auto____9633
      }
    }()) {
      return this__9632.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9634 = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, this__9634.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.cljs$lang$arity$3(0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.cljs$lang$arity$3(0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.cljs$lang$arity$3(start, end, 1)
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
    var temp__3974__auto____9637 = cljs.core.seq(coll);
    if(temp__3974__auto____9637) {
      var s__9638 = temp__3974__auto____9637;
      return cljs.core.cons(cljs.core.first(s__9638), take_nth(n, cljs.core.drop(n, s__9638)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while(pred, coll), cljs.core.drop_while(pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9645 = cljs.core.seq(coll);
    if(temp__3974__auto____9645) {
      var s__9646 = temp__3974__auto____9645;
      var fst__9647 = cljs.core.first(s__9646);
      var fv__9648 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(fst__9647) : f.call(null, fst__9647);
      var run__9649 = cljs.core.cons(fst__9647, cljs.core.take_while(function(p1__9639_SHARP_) {
        return cljs.core._EQ_.cljs$lang$arity$2(fv__9648, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(p1__9639_SHARP_) : f.call(null, p1__9639_SHARP_))
      }, cljs.core.next(s__9646)));
      return cljs.core.cons(run__9649, partition_by(f, cljs.core.seq(cljs.core.drop(cljs.core.count(run__9649), s__9646))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$lang$arity$3(function(counts, x) {
    return cljs.core.assoc_BANG_(counts, x, cljs.core._lookup.cljs$lang$arity$3(counts, x, 0) + 1)
  }, cljs.core.transient$(cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9664 = cljs.core.seq(coll);
      if(temp__3971__auto____9664) {
        var s__9665 = temp__3971__auto____9664;
        return reductions.cljs$lang$arity$3(f, cljs.core.first(s__9665), cljs.core.rest(s__9665))
      }else {
        return cljs.core.list.cljs$lang$arity$1(f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons(init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9666 = cljs.core.seq(coll);
      if(temp__3974__auto____9666) {
        var s__9667 = temp__3974__auto____9666;
        return reductions.cljs$lang$arity$3(f, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(init, cljs.core.first(s__9667)) : f.call(null, init, cljs.core.first(s__9667)), cljs.core.rest(s__9667))
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
      var G__9670 = null;
      var G__9670__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null)], 0))
      };
      var G__9670__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x)], 0))
      };
      var G__9670__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y)], 0))
      };
      var G__9670__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z)], 0))
      };
      var G__9670__4 = function() {
        var G__9671__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args)], 0))
        };
        var G__9671 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9671__delegate.call(this, x, y, z, args)
        };
        G__9671.cljs$lang$maxFixedArity = 3;
        G__9671.cljs$lang$applyTo = function(arglist__9672) {
          var x = cljs.core.first(arglist__9672);
          var y = cljs.core.first(cljs.core.next(arglist__9672));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9672)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9672)));
          return G__9671__delegate(x, y, z, args)
        };
        G__9671.cljs$lang$arity$variadic = G__9671__delegate;
        return G__9671
      }();
      G__9670 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9670__0.call(this);
          case 1:
            return G__9670__1.call(this, x);
          case 2:
            return G__9670__2.call(this, x, y);
          case 3:
            return G__9670__3.call(this, x, y, z);
          default:
            return G__9670__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9670.cljs$lang$maxFixedArity = 3;
      G__9670.cljs$lang$applyTo = G__9670__4.cljs$lang$applyTo;
      return G__9670
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9673 = null;
      var G__9673__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null)], 0))
      };
      var G__9673__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x), g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x)], 0))
      };
      var G__9673__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y), g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y)], 0))
      };
      var G__9673__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z)], 0))
      };
      var G__9673__4 = function() {
        var G__9674__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args)], 0))
        };
        var G__9674 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9674__delegate.call(this, x, y, z, args)
        };
        G__9674.cljs$lang$maxFixedArity = 3;
        G__9674.cljs$lang$applyTo = function(arglist__9675) {
          var x = cljs.core.first(arglist__9675);
          var y = cljs.core.first(cljs.core.next(arglist__9675));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9675)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9675)));
          return G__9674__delegate(x, y, z, args)
        };
        G__9674.cljs$lang$arity$variadic = G__9674__delegate;
        return G__9674
      }();
      G__9673 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9673__0.call(this);
          case 1:
            return G__9673__1.call(this, x);
          case 2:
            return G__9673__2.call(this, x, y);
          case 3:
            return G__9673__3.call(this, x, y, z);
          default:
            return G__9673__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9673.cljs$lang$maxFixedArity = 3;
      G__9673.cljs$lang$applyTo = G__9673__4.cljs$lang$applyTo;
      return G__9673
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9676 = null;
      var G__9676__0 = function() {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null), g.cljs$lang$arity$0 ? g.cljs$lang$arity$0() : g.call(null), h.cljs$lang$arity$0 ? h.cljs$lang$arity$0() : h.call(null)], 0))
      };
      var G__9676__1 = function(x) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x), g.cljs$lang$arity$1 ? g.cljs$lang$arity$1(x) : g.call(null, x), h.cljs$lang$arity$1 ? h.cljs$lang$arity$1(x) : h.call(null, x)], 0))
      };
      var G__9676__2 = function(x, y) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(x, y) : f.call(null, x, y), g.cljs$lang$arity$2 ? g.cljs$lang$arity$2(x, y) : g.call(null, x, y), h.cljs$lang$arity$2 ? h.cljs$lang$arity$2(x, y) : h.call(null, x, y)], 0))
      };
      var G__9676__3 = function(x, y, z) {
        return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$lang$arity$3 ? g.cljs$lang$arity$3(x, y, z) : g.call(null, x, y, z), h.cljs$lang$arity$3 ? h.cljs$lang$arity$3(x, y, z) : h.call(null, x, y, z)], 0))
      };
      var G__9676__4 = function() {
        var G__9677__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$5(f, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(g, x, y, z, args), cljs.core.apply.cljs$lang$arity$5(h, x, y, z, args)], 0))
        };
        var G__9677 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9677__delegate.call(this, x, y, z, args)
        };
        G__9677.cljs$lang$maxFixedArity = 3;
        G__9677.cljs$lang$applyTo = function(arglist__9678) {
          var x = cljs.core.first(arglist__9678);
          var y = cljs.core.first(cljs.core.next(arglist__9678));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9678)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9678)));
          return G__9677__delegate(x, y, z, args)
        };
        G__9677.cljs$lang$arity$variadic = G__9677__delegate;
        return G__9677
      }();
      G__9676 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9676__0.call(this);
          case 1:
            return G__9676__1.call(this, x);
          case 2:
            return G__9676__2.call(this, x, y);
          case 3:
            return G__9676__3.call(this, x, y, z);
          default:
            return G__9676__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9676.cljs$lang$maxFixedArity = 3;
      G__9676.cljs$lang$applyTo = G__9676__4.cljs$lang$applyTo;
      return G__9676
    }()
  };
  var juxt__4 = function() {
    var G__9679__delegate = function(f, g, h, fs) {
      var fs__9669 = cljs.core.list_STAR_.cljs$lang$arity$4(f, g, h, fs);
      return function() {
        var G__9680 = null;
        var G__9680__0 = function() {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9650_SHARP_, p2__9651_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9650_SHARP_, p2__9651_SHARP_.cljs$lang$arity$0 ? p2__9651_SHARP_.cljs$lang$arity$0() : p2__9651_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9669)
        };
        var G__9680__1 = function(x) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9652_SHARP_, p2__9653_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9652_SHARP_, p2__9653_SHARP_.cljs$lang$arity$1 ? p2__9653_SHARP_.cljs$lang$arity$1(x) : p2__9653_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9669)
        };
        var G__9680__2 = function(x, y) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9654_SHARP_, p2__9655_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9654_SHARP_, p2__9655_SHARP_.cljs$lang$arity$2 ? p2__9655_SHARP_.cljs$lang$arity$2(x, y) : p2__9655_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9669)
        };
        var G__9680__3 = function(x, y, z) {
          return cljs.core.reduce.cljs$lang$arity$3(function(p1__9656_SHARP_, p2__9657_SHARP_) {
            return cljs.core.conj.cljs$lang$arity$2(p1__9656_SHARP_, p2__9657_SHARP_.cljs$lang$arity$3 ? p2__9657_SHARP_.cljs$lang$arity$3(x, y, z) : p2__9657_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9669)
        };
        var G__9680__4 = function() {
          var G__9681__delegate = function(x, y, z, args) {
            return cljs.core.reduce.cljs$lang$arity$3(function(p1__9658_SHARP_, p2__9659_SHARP_) {
              return cljs.core.conj.cljs$lang$arity$2(p1__9658_SHARP_, cljs.core.apply.cljs$lang$arity$5(p2__9659_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9669)
          };
          var G__9681 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9681__delegate.call(this, x, y, z, args)
          };
          G__9681.cljs$lang$maxFixedArity = 3;
          G__9681.cljs$lang$applyTo = function(arglist__9682) {
            var x = cljs.core.first(arglist__9682);
            var y = cljs.core.first(cljs.core.next(arglist__9682));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9682)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9682)));
            return G__9681__delegate(x, y, z, args)
          };
          G__9681.cljs$lang$arity$variadic = G__9681__delegate;
          return G__9681
        }();
        G__9680 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9680__0.call(this);
            case 1:
              return G__9680__1.call(this, x);
            case 2:
              return G__9680__2.call(this, x, y);
            case 3:
              return G__9680__3.call(this, x, y, z);
            default:
              return G__9680__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9680.cljs$lang$maxFixedArity = 3;
        G__9680.cljs$lang$applyTo = G__9680__4.cljs$lang$applyTo;
        return G__9680
      }()
    };
    var G__9679 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9679__delegate.call(this, f, g, h, fs)
    };
    G__9679.cljs$lang$maxFixedArity = 3;
    G__9679.cljs$lang$applyTo = function(arglist__9683) {
      var f = cljs.core.first(arglist__9683);
      var g = cljs.core.first(cljs.core.next(arglist__9683));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9683)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9683)));
      return G__9679__delegate(f, g, h, fs)
    };
    G__9679.cljs$lang$arity$variadic = G__9679__delegate;
    return G__9679
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
      if(cljs.core.seq(coll)) {
        var G__9686 = cljs.core.next(coll);
        coll = G__9686;
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
        var and__3822__auto____9685 = cljs.core.seq(coll);
        if(and__3822__auto____9685) {
          return n > 0
        }else {
          return and__3822__auto____9685
        }
      }())) {
        var G__9687 = n - 1;
        var G__9688 = cljs.core.next(coll);
        n = G__9687;
        coll = G__9688;
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
    cljs.core.dorun.cljs$lang$arity$1(coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.cljs$lang$arity$2(n, coll);
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
  var matches__9690 = re.exec(s);
  if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.first(matches__9690), s)) {
    if(cljs.core.count(matches__9690) === 1) {
      return cljs.core.first(matches__9690)
    }else {
      return cljs.core.vec(matches__9690)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9692 = re.exec(s);
  if(matches__9692 == null) {
    return null
  }else {
    if(cljs.core.count(matches__9692) === 1) {
      return cljs.core.first(matches__9692)
    }else {
      return cljs.core.vec(matches__9692)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9697 = cljs.core.re_find(re, s);
  var match_idx__9698 = s.search(re);
  var match_str__9699 = cljs.core.coll_QMARK_(match_data__9697) ? cljs.core.first(match_data__9697) : match_data__9697;
  var post_match__9700 = cljs.core.subs.cljs$lang$arity$2(s, match_idx__9698 + cljs.core.count(match_str__9699));
  if(cljs.core.truth_(match_data__9697)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(match_data__9697, re_seq(re, post_match__9700))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9707__9708 = cljs.core.re_find(/^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9709 = cljs.core.nth.cljs$lang$arity$3(vec__9707__9708, 0, null);
  var flags__9710 = cljs.core.nth.cljs$lang$arity$3(vec__9707__9708, 1, null);
  var pattern__9711 = cljs.core.nth.cljs$lang$arity$3(vec__9707__9708, 2, null);
  return new RegExp(pattern__9711, flags__9710)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1(cljs.core.interpose(cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.cljs$lang$arity$2(function(p1__9701_SHARP_) {
    return print_one.cljs$lang$arity$2 ? print_one.cljs$lang$arity$2(p1__9701_SHARP_, opts) : print_one.call(null, p1__9701_SHARP_, opts)
  }, coll))), cljs.core.array_seq([cljs.core.PersistentVector.fromArray([end], true)], 0))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_(x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.cljs$lang$arity$1("nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.cljs$lang$arity$1("#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.cljs$lang$arity$2(cljs.core.truth_(function() {
          var and__3822__auto____9721 = cljs.core._lookup.cljs$lang$arity$3(opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____9721)) {
            var and__3822__auto____9725 = function() {
              var G__9722__9723 = obj;
              if(G__9722__9723) {
                if(function() {
                  var or__3824__auto____9724 = G__9722__9723.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____9724) {
                    return or__3824__auto____9724
                  }else {
                    return G__9722__9723.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9722__9723.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_(cljs.core.IMeta, G__9722__9723)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_(cljs.core.IMeta, G__9722__9723)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____9725)) {
              return cljs.core.meta(obj)
            }else {
              return and__3822__auto____9725
            }
          }else {
            return and__3822__auto____9721
          }
        }()) ? cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray(["^"], true), pr_seq(cljs.core.meta(obj), opts), cljs.core.array_seq([cljs.core.PersistentVector.fromArray([" "], true)], 0)) : null, function() {
          var and__3822__auto____9726 = !(obj == null);
          if(and__3822__auto____9726) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____9726
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9727__9728 = obj;
          if(G__9727__9728) {
            if(function() {
              var or__3824__auto____9729 = G__9727__9728.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____9729) {
                return or__3824__auto____9729
              }else {
                return G__9727__9728.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9727__9728.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_(cljs.core.IPrintable, G__9727__9728)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_(cljs.core.IPrintable, G__9727__9728)
          }
        }() ? cljs.core._pr_seq(obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_(obj)) ? cljs.core.list.cljs$lang$arity$3('#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.cljs$lang$arity$3("#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9749 = new goog.string.StringBuffer;
  var G__9750__9751 = cljs.core.seq(cljs.core.pr_seq(cljs.core.first(objs), opts));
  if(G__9750__9751) {
    var string__9752 = cljs.core.first(G__9750__9751);
    var G__9750__9753 = G__9750__9751;
    while(true) {
      sb__9749.append(string__9752);
      var temp__3974__auto____9754 = cljs.core.next(G__9750__9753);
      if(temp__3974__auto____9754) {
        var G__9750__9755 = temp__3974__auto____9754;
        var G__9768 = cljs.core.first(G__9750__9755);
        var G__9769 = G__9750__9755;
        string__9752 = G__9768;
        G__9750__9753 = G__9769;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9756__9757 = cljs.core.seq(cljs.core.next(objs));
  if(G__9756__9757) {
    var obj__9758 = cljs.core.first(G__9756__9757);
    var G__9756__9759 = G__9756__9757;
    while(true) {
      sb__9749.append(" ");
      var G__9760__9761 = cljs.core.seq(cljs.core.pr_seq(obj__9758, opts));
      if(G__9760__9761) {
        var string__9762 = cljs.core.first(G__9760__9761);
        var G__9760__9763 = G__9760__9761;
        while(true) {
          sb__9749.append(string__9762);
          var temp__3974__auto____9764 = cljs.core.next(G__9760__9763);
          if(temp__3974__auto____9764) {
            var G__9760__9765 = temp__3974__auto____9764;
            var G__9770 = cljs.core.first(G__9760__9765);
            var G__9771 = G__9760__9765;
            string__9762 = G__9770;
            G__9760__9763 = G__9771;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9766 = cljs.core.next(G__9756__9759);
      if(temp__3974__auto____9766) {
        var G__9756__9767 = temp__3974__auto____9766;
        var G__9772 = cljs.core.first(G__9756__9767);
        var G__9773 = G__9756__9767;
        obj__9758 = G__9772;
        G__9756__9759 = G__9773;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9749
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb(objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9775 = cljs.core.pr_sb(objs, opts);
  sb__9775.append("\n");
  return[cljs.core.str(sb__9775)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9794__9795 = cljs.core.seq(cljs.core.pr_seq(cljs.core.first(objs), opts));
  if(G__9794__9795) {
    var string__9796 = cljs.core.first(G__9794__9795);
    var G__9794__9797 = G__9794__9795;
    while(true) {
      cljs.core.string_print(string__9796);
      var temp__3974__auto____9798 = cljs.core.next(G__9794__9797);
      if(temp__3974__auto____9798) {
        var G__9794__9799 = temp__3974__auto____9798;
        var G__9812 = cljs.core.first(G__9794__9799);
        var G__9813 = G__9794__9799;
        string__9796 = G__9812;
        G__9794__9797 = G__9813;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9800__9801 = cljs.core.seq(cljs.core.next(objs));
  if(G__9800__9801) {
    var obj__9802 = cljs.core.first(G__9800__9801);
    var G__9800__9803 = G__9800__9801;
    while(true) {
      cljs.core.string_print(" ");
      var G__9804__9805 = cljs.core.seq(cljs.core.pr_seq(obj__9802, opts));
      if(G__9804__9805) {
        var string__9806 = cljs.core.first(G__9804__9805);
        var G__9804__9807 = G__9804__9805;
        while(true) {
          cljs.core.string_print(string__9806);
          var temp__3974__auto____9808 = cljs.core.next(G__9804__9807);
          if(temp__3974__auto____9808) {
            var G__9804__9809 = temp__3974__auto____9808;
            var G__9814 = cljs.core.first(G__9804__9809);
            var G__9815 = G__9804__9809;
            string__9806 = G__9814;
            G__9804__9807 = G__9815;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____9810 = cljs.core.next(G__9800__9803);
      if(temp__3974__auto____9810) {
        var G__9800__9811 = temp__3974__auto____9810;
        var G__9816 = cljs.core.first(G__9800__9811);
        var G__9817 = G__9800__9811;
        obj__9802 = G__9816;
        G__9800__9803 = G__9817;
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
  cljs.core.string_print("\n");
  if(cljs.core.truth_(cljs.core._lookup.cljs$lang$arity$3(opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush()
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
    return cljs.core.pr_str_with_opts(objs, cljs.core.pr_opts())
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9818) {
    var objs = cljs.core.seq(arglist__9818);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.pr_opts())
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9819) {
    var objs = cljs.core.seq(arglist__9819);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.pr_opts())
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9820) {
    var objs = cljs.core.seq(arglist__9820);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9821) {
    var objs = cljs.core.seq(arglist__9821);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9822) {
    var objs = cljs.core.seq(arglist__9822);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false));
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9823) {
    var objs = cljs.core.seq(arglist__9823);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.assoc.cljs$lang$arity$3(cljs.core.pr_opts(), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9824) {
    var objs = cljs.core.seq(arglist__9824);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.pr_opts());
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9825) {
    var objs = cljs.core.seq(arglist__9825);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$lang$arity$3(cljs.core.format, fmt, args)], 0))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9826) {
    var fmt = cljs.core.first(arglist__9826);
    var args = cljs.core.rest(arglist__9826);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9827 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9827, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9828 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9828, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9829 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9829, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_(obj)) {
    return cljs.core.list.cljs$lang$arity$1([cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____9830 = cljs.core.namespace(obj);
      if(cljs.core.truth_(temp__3974__auto____9830)) {
        var nspc__9831 = temp__3974__auto____9830;
        return[cljs.core.str(nspc__9831), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name(obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_(obj)) {
      return cljs.core.list.cljs$lang$arity$1([cljs.core.str(function() {
        var temp__3974__auto____9832 = cljs.core.namespace(obj);
        if(cljs.core.truth_(temp__3974__auto____9832)) {
          var nspc__9833 = temp__3974__auto____9832;
          return[cljs.core.str(nspc__9833), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name(obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.cljs$lang$arity$1(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9834 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9834, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.cljs$lang$arity$3("#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.cljs$lang$arity$1("()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9836 = function(n, len) {
    var ns__9835 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count(ns__9835) < len) {
        var G__9838 = [cljs.core.str("0"), cljs.core.str(ns__9835)].join("");
        ns__9835 = G__9838;
        continue
      }else {
        return ns__9835
      }
      break
    }
  };
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? normalize__9836.cljs$lang$arity$2(d.getUTCMonth() + 1, 2) : normalize__9836.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? normalize__9836.cljs$lang$arity$2(d.getUTCDate(), 2) : normalize__9836.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? 
  normalize__9836.cljs$lang$arity$2(d.getUTCHours(), 2) : normalize__9836.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? normalize__9836.cljs$lang$arity$2(d.getUTCMinutes(), 2) : normalize__9836.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? normalize__9836.cljs$lang$arity$2(d.getUTCSeconds(), 2) : normalize__9836.call(null, d.getUTCSeconds(), 2)), cljs.core.str("."), cljs.core.str(normalize__9836.cljs$lang$arity$2 ? 
  normalize__9836.cljs$lang$arity$2(d.getUTCMilliseconds(), 3) : normalize__9836.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9837 = function(keyval) {
    return cljs.core.pr_sequential(cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential(pr_pair__9837, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential(cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.cljs$lang$arity$2(x, y)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9839 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9840 = this;
  var G__9841__9842 = cljs.core.seq(this__9840.watches);
  if(G__9841__9842) {
    var G__9844__9846 = cljs.core.first(G__9841__9842);
    var vec__9845__9847 = G__9844__9846;
    var key__9848 = cljs.core.nth.cljs$lang$arity$3(vec__9845__9847, 0, null);
    var f__9849 = cljs.core.nth.cljs$lang$arity$3(vec__9845__9847, 1, null);
    var G__9841__9850 = G__9841__9842;
    var G__9844__9851 = G__9844__9846;
    var G__9841__9852 = G__9841__9850;
    while(true) {
      var vec__9853__9854 = G__9844__9851;
      var key__9855 = cljs.core.nth.cljs$lang$arity$3(vec__9853__9854, 0, null);
      var f__9856 = cljs.core.nth.cljs$lang$arity$3(vec__9853__9854, 1, null);
      var G__9841__9857 = G__9841__9852;
      f__9856.cljs$lang$arity$4 ? f__9856.cljs$lang$arity$4(key__9855, this$, oldval, newval) : f__9856.call(null, key__9855, this$, oldval, newval);
      var temp__3974__auto____9858 = cljs.core.next(G__9841__9857);
      if(temp__3974__auto____9858) {
        var G__9841__9859 = temp__3974__auto____9858;
        var G__9866 = cljs.core.first(G__9841__9859);
        var G__9867 = G__9841__9859;
        G__9844__9851 = G__9866;
        G__9841__9852 = G__9867;
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
  var this__9860 = this;
  return this$.watches = cljs.core.assoc.cljs$lang$arity$3(this__9860.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9861 = this;
  return this$.watches = cljs.core.dissoc.cljs$lang$arity$2(this__9861.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9862 = this;
  return cljs.core.concat.cljs$lang$arity$variadic(cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq(this__9862.state, opts), cljs.core.array_seq([">"], 0))
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9863 = this;
  return this__9863.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9864 = this;
  return this__9864.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9865 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9879__delegate = function(x, p__9868) {
      var map__9874__9875 = p__9868;
      var map__9874__9876 = cljs.core.seq_QMARK_(map__9874__9875) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9874__9875) : map__9874__9875;
      var validator__9877 = cljs.core._lookup.cljs$lang$arity$3(map__9874__9876, "\ufdd0'validator", null);
      var meta__9878 = cljs.core._lookup.cljs$lang$arity$3(map__9874__9876, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9878, validator__9877, null)
    };
    var G__9879 = function(x, var_args) {
      var p__9868 = null;
      if(goog.isDef(var_args)) {
        p__9868 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9879__delegate.call(this, x, p__9868)
    };
    G__9879.cljs$lang$maxFixedArity = 1;
    G__9879.cljs$lang$applyTo = function(arglist__9880) {
      var x = cljs.core.first(arglist__9880);
      var p__9868 = cljs.core.rest(arglist__9880);
      return G__9879__delegate(x, p__9868)
    };
    G__9879.cljs$lang$arity$variadic = G__9879__delegate;
    return G__9879
  }();
  atom = function(x, var_args) {
    var p__9868 = var_args;
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
  var temp__3974__auto____9884 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____9884)) {
    var validate__9885 = temp__3974__auto____9884;
    if(cljs.core.truth_(validate__9885.cljs$lang$arity$1 ? validate__9885.cljs$lang$arity$1(new_value) : validate__9885.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))], 0)))].join(""));
    }
  }else {
  }
  var old_value__9886 = a.state;
  a.state = new_value;
  cljs.core._notify_watches(a, old_value__9886, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(a.state) : f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$2 ? f.cljs$lang$arity$2(a.state, x) : f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$3 ? f.cljs$lang$arity$3(a.state, x, y) : f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_(a, f.cljs$lang$arity$4 ? f.cljs$lang$arity$4(a.state, x, y, z) : f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9887__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_(a, cljs.core.apply.cljs$lang$arity$variadic(f, a.state, x, y, z, cljs.core.array_seq([more], 0)))
    };
    var G__9887 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9887__delegate.call(this, a, f, x, y, z, more)
    };
    G__9887.cljs$lang$maxFixedArity = 5;
    G__9887.cljs$lang$applyTo = function(arglist__9888) {
      var a = cljs.core.first(arglist__9888);
      var f = cljs.core.first(cljs.core.next(arglist__9888));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9888)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9888))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9888)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9888)))));
      return G__9887__delegate(a, f, x, y, z, more)
    };
    G__9887.cljs$lang$arity$variadic = G__9887__delegate;
    return G__9887
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
  if(cljs.core._EQ_.cljs$lang$arity$2(a.state, oldval)) {
    cljs.core.reset_BANG_(a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref(o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.cljs$lang$arity$3(f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9889) {
    var iref = cljs.core.first(arglist__9889);
    var f = cljs.core.first(cljs.core.next(arglist__9889));
    var args = cljs.core.rest(cljs.core.next(arglist__9889));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch(iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch(iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.cljs$lang$arity$1("G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.cljs$lang$arity$1(0)
    }else {
    }
    return cljs.core.symbol.cljs$lang$arity$1([cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.cljs$lang$arity$2(cljs.core.gensym_counter, cljs.core.inc))].join(""))
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9890 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref(this__9890.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9891 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.cljs$lang$arity$2(this__9891.state, function(p__9892) {
    var map__9893__9894 = p__9892;
    var map__9893__9895 = cljs.core.seq_QMARK_(map__9893__9894) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9893__9894) : map__9893__9894;
    var curr_state__9896 = map__9893__9895;
    var done__9897 = cljs.core._lookup.cljs$lang$arity$3(map__9893__9895, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9897)) {
      return curr_state__9896
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9891.f.cljs$lang$arity$0 ? this__9891.f.cljs$lang$arity$0() : this__9891.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_(cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_(x)) {
    return cljs.core.deref(x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_(d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9918__9919 = options;
    var map__9918__9920 = cljs.core.seq_QMARK_(map__9918__9919) ? cljs.core.apply.cljs$lang$arity$2(cljs.core.hash_map, map__9918__9919) : map__9918__9919;
    var keywordize_keys__9921 = cljs.core._lookup.cljs$lang$arity$3(map__9918__9920, "\ufdd0'keywordize-keys", null);
    var keyfn__9922 = cljs.core.truth_(keywordize_keys__9921) ? cljs.core.keyword : cljs.core.str;
    var f__9937 = function thisfn(x) {
      if(cljs.core.seq_QMARK_(x)) {
        return cljs.core.doall.cljs$lang$arity$1(cljs.core.map.cljs$lang$arity$2(thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_(x)) {
          return cljs.core.into(cljs.core.empty(x), cljs.core.map.cljs$lang$arity$2(thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec(cljs.core.map.cljs$lang$arity$2(thisfn, x))
          }else {
            if(cljs.core.type(x) === Object) {
              return cljs.core.into(cljs.core.ObjMap.EMPTY, function() {
                var iter__2490__auto____9936 = function iter__9930(s__9931) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9931__9934 = s__9931;
                    while(true) {
                      if(cljs.core.seq(s__9931__9934)) {
                        var k__9935 = cljs.core.first(s__9931__9934);
                        return cljs.core.cons(cljs.core.PersistentVector.fromArray([keyfn__9922.cljs$lang$arity$1 ? keyfn__9922.cljs$lang$arity$1(k__9935) : keyfn__9922.call(null, k__9935), thisfn(x[k__9935])], true), iter__9930(cljs.core.rest(s__9931__9934)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2490__auto____9936.cljs$lang$arity$1 ? iter__2490__auto____9936.cljs$lang$arity$1(cljs.core.js_keys(x)) : iter__2490__auto____9936.call(null, cljs.core.js_keys(x))
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
    return f__9937.cljs$lang$arity$1 ? f__9937.cljs$lang$arity$1(x) : f__9937.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9938) {
    var x = cljs.core.first(arglist__9938);
    var options = cljs.core.rest(arglist__9938);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9943 = cljs.core.atom.cljs$lang$arity$1(cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9947__delegate = function(args) {
      var temp__3971__auto____9944 = cljs.core._lookup.cljs$lang$arity$3(cljs.core.deref(mem__9943), args, null);
      if(cljs.core.truth_(temp__3971__auto____9944)) {
        var v__9945 = temp__3971__auto____9944;
        return v__9945
      }else {
        var ret__9946 = cljs.core.apply.cljs$lang$arity$2(f, args);
        cljs.core.swap_BANG_.cljs$lang$arity$4(mem__9943, cljs.core.assoc, args, ret__9946);
        return ret__9946
      }
    };
    var G__9947 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9947__delegate.call(this, args)
    };
    G__9947.cljs$lang$maxFixedArity = 0;
    G__9947.cljs$lang$applyTo = function(arglist__9948) {
      var args = cljs.core.seq(arglist__9948);
      return G__9947__delegate(args)
    };
    G__9947.cljs$lang$arity$variadic = G__9947__delegate;
    return G__9947
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9950 = f.cljs$lang$arity$0 ? f.cljs$lang$arity$0() : f.call(null);
      if(cljs.core.fn_QMARK_(ret__9950)) {
        var G__9951 = ret__9950;
        f = G__9951;
        continue
      }else {
        return ret__9950
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9952__delegate = function(f, args) {
      return trampoline.cljs$lang$arity$1(function() {
        return cljs.core.apply.cljs$lang$arity$2(f, args)
      })
    };
    var G__9952 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9952__delegate.call(this, f, args)
    };
    G__9952.cljs$lang$maxFixedArity = 1;
    G__9952.cljs$lang$applyTo = function(arglist__9953) {
      var f = cljs.core.first(arglist__9953);
      var args = cljs.core.rest(arglist__9953);
      return G__9952__delegate(f, args)
    };
    G__9952.cljs$lang$arity$variadic = G__9952__delegate;
    return G__9952
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
    return rand.cljs$lang$arity$1(1)
  };
  var rand__1 = function(n) {
    return(Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n
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
  return Math.floor.cljs$lang$arity$1 ? Math.floor.cljs$lang$arity$1((Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n) : Math.floor.call(null, (Math.random.cljs$lang$arity$0 ? Math.random.cljs$lang$arity$0() : Math.random.call(null)) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.cljs$lang$arity$2(coll, cljs.core.rand_int(cljs.core.count(coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.cljs$lang$arity$3(function(ret, x) {
    var k__9955 = f.cljs$lang$arity$1 ? f.cljs$lang$arity$1(x) : f.call(null, x);
    return cljs.core.assoc.cljs$lang$arity$3(ret, k__9955, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(ret, k__9955, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.cljs$lang$arity$1(cljs.core.make_hierarchy());
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.cljs$lang$arity$3(cljs.core.deref(cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____9964 = cljs.core._EQ_.cljs$lang$arity$2(child, parent);
    if(or__3824__auto____9964) {
      return or__3824__auto____9964
    }else {
      var or__3824__auto____9965 = cljs.core.contains_QMARK_((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____9965) {
        return or__3824__auto____9965
      }else {
        var and__3822__auto____9966 = cljs.core.vector_QMARK_(parent);
        if(and__3822__auto____9966) {
          var and__3822__auto____9967 = cljs.core.vector_QMARK_(child);
          if(and__3822__auto____9967) {
            var and__3822__auto____9968 = cljs.core.count(parent) === cljs.core.count(child);
            if(and__3822__auto____9968) {
              var ret__9969 = true;
              var i__9970 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____9971 = cljs.core.not(ret__9969);
                  if(or__3824__auto____9971) {
                    return or__3824__auto____9971
                  }else {
                    return i__9970 === cljs.core.count(parent)
                  }
                }()) {
                  return ret__9969
                }else {
                  var G__9972 = isa_QMARK_.cljs$lang$arity$3(h, child.cljs$lang$arity$1 ? child.cljs$lang$arity$1(i__9970) : child.call(null, i__9970), parent.cljs$lang$arity$1 ? parent.cljs$lang$arity$1(i__9970) : parent.call(null, i__9970));
                  var G__9973 = i__9970 + 1;
                  ret__9969 = G__9972;
                  i__9970 = G__9973;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____9968
            }
          }else {
            return and__3822__auto____9967
          }
        }else {
          return and__3822__auto____9966
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
    return parents.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
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
    return ancestors.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
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
    return descendants.cljs$lang$arity$2(cljs.core.deref(cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core._lookup.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
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
    if(cljs.core.truth_(cljs.core.namespace(parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))], 0)))].join(""));
    }
    cljs.core.swap_BANG_.cljs$lang$arity$4(cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.cljs$lang$arity$2(tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))], 0)))].join(""));
    }
    var tp__9982 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9983 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9984 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9985 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.cljs$lang$arity$3(function(ret, k) {
        return cljs.core.assoc.cljs$lang$arity$3(ret, k, cljs.core.reduce.cljs$lang$arity$3(cljs.core.conj, cljs.core._lookup.cljs$lang$arity$3(targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons(target, targets.cljs$lang$arity$1 ? targets.cljs$lang$arity$1(target) : targets.call(null, target))))
      }, m, cljs.core.cons(source, sources.cljs$lang$arity$1 ? sources.cljs$lang$arity$1(source) : sources.call(null, source)))
    };
    var or__3824__auto____9986 = cljs.core.contains_QMARK_(tp__9982.cljs$lang$arity$1 ? tp__9982.cljs$lang$arity$1(tag) : tp__9982.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_(ta__9984.cljs$lang$arity$1 ? ta__9984.cljs$lang$arity$1(tag) : ta__9984.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_(ta__9984.cljs$lang$arity$1 ? ta__9984.cljs$lang$arity$1(parent) : ta__9984.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.cljs$lang$arity$3((new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(tp__9982, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9985.cljs$lang$arity$5 ? tf__9985.cljs$lang$arity$5((new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9983, parent, 
      ta__9984) : tf__9985.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9983, parent, ta__9984), "\ufdd0'descendants":tf__9985.cljs$lang$arity$5 ? tf__9985.cljs$lang$arity$5((new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__9984, tag, td__9983) : tf__9985.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__9984, tag, td__9983)})
    }();
    if(cljs.core.truth_(or__3824__auto____9986)) {
      return or__3824__auto____9986
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
    cljs.core.swap_BANG_.cljs$lang$arity$4(cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9991 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9992 = cljs.core.truth_(parentMap__9991.cljs$lang$arity$1 ? parentMap__9991.cljs$lang$arity$1(tag) : parentMap__9991.call(null, tag)) ? cljs.core.disj.cljs$lang$arity$2(parentMap__9991.cljs$lang$arity$1 ? parentMap__9991.cljs$lang$arity$1(tag) : parentMap__9991.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9993 = cljs.core.truth_(cljs.core.not_empty(childsParents__9992)) ? cljs.core.assoc.cljs$lang$arity$3(parentMap__9991, tag, childsParents__9992) : cljs.core.dissoc.cljs$lang$arity$2(parentMap__9991, tag);
    var deriv_seq__9994 = cljs.core.flatten(cljs.core.map.cljs$lang$arity$2(function(p1__9974_SHARP_) {
      return cljs.core.cons(cljs.core.first(p1__9974_SHARP_), cljs.core.interpose(cljs.core.first(p1__9974_SHARP_), cljs.core.second(p1__9974_SHARP_)))
    }, cljs.core.seq(newParents__9993)));
    if(cljs.core.contains_QMARK_(parentMap__9991.cljs$lang$arity$1 ? parentMap__9991.cljs$lang$arity$1(tag) : parentMap__9991.call(null, tag), parent)) {
      return cljs.core.reduce.cljs$lang$arity$3(function(p1__9975_SHARP_, p2__9976_SHARP_) {
        return cljs.core.apply.cljs$lang$arity$3(cljs.core.derive, p1__9975_SHARP_, p2__9976_SHARP_)
      }, cljs.core.make_hierarchy(), cljs.core.partition.cljs$lang$arity$2(2, deriv_seq__9994))
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
  cljs.core.swap_BANG_.cljs$lang$arity$2(method_cache, function(_) {
    return cljs.core.deref(method_table)
  });
  return cljs.core.swap_BANG_.cljs$lang$arity$2(cached_hierarchy, function(_) {
    return cljs.core.deref(hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10002 = cljs.core.deref(prefer_table).call(null, x);
  var or__3824__auto____10004 = cljs.core.truth_(function() {
    var and__3822__auto____10003 = xprefs__10002;
    if(cljs.core.truth_(and__3822__auto____10003)) {
      return xprefs__10002.cljs$lang$arity$1 ? xprefs__10002.cljs$lang$arity$1(y) : xprefs__10002.call(null, y)
    }else {
      return and__3822__auto____10003
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10004)) {
    return or__3824__auto____10004
  }else {
    var or__3824__auto____10006 = function() {
      var ps__10005 = cljs.core.parents.cljs$lang$arity$1(y);
      while(true) {
        if(cljs.core.count(ps__10005) > 0) {
          if(cljs.core.truth_(prefers_STAR_(x, cljs.core.first(ps__10005), prefer_table))) {
          }else {
          }
          var G__10009 = cljs.core.rest(ps__10005);
          ps__10005 = G__10009;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10006)) {
      return or__3824__auto____10006
    }else {
      var or__3824__auto____10008 = function() {
        var ps__10007 = cljs.core.parents.cljs$lang$arity$1(x);
        while(true) {
          if(cljs.core.count(ps__10007) > 0) {
            if(cljs.core.truth_(prefers_STAR_(cljs.core.first(ps__10007), y, prefer_table))) {
            }else {
            }
            var G__10010 = cljs.core.rest(ps__10007);
            ps__10007 = G__10010;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10008)) {
        return or__3824__auto____10008
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10012 = cljs.core.prefers_STAR_(x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10012)) {
    return or__3824__auto____10012
  }else {
    return cljs.core.isa_QMARK_.cljs$lang$arity$2(x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10030 = cljs.core.reduce.cljs$lang$arity$3(function(be, p__10022) {
    var vec__10023__10024 = p__10022;
    var k__10025 = cljs.core.nth.cljs$lang$arity$3(vec__10023__10024, 0, null);
    var ___10026 = cljs.core.nth.cljs$lang$arity$3(vec__10023__10024, 1, null);
    var e__10027 = vec__10023__10024;
    if(cljs.core.isa_QMARK_.cljs$lang$arity$2(dispatch_val, k__10025)) {
      var be2__10029 = cljs.core.truth_(function() {
        var or__3824__auto____10028 = be == null;
        if(or__3824__auto____10028) {
          return or__3824__auto____10028
        }else {
          return cljs.core.dominates(k__10025, cljs.core.first(be), prefer_table)
        }
      }()) ? e__10027 : be;
      if(cljs.core.truth_(cljs.core.dominates(cljs.core.first(be2__10029), k__10025, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10025), cljs.core.str(" and "), cljs.core.str(cljs.core.first(be2__10029)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10029
    }else {
      return be
    }
  }, null, cljs.core.deref(method_table));
  if(cljs.core.truth_(best_entry__10030)) {
    if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.deref(cached_hierarchy), cljs.core.deref(hierarchy))) {
      cljs.core.swap_BANG_.cljs$lang$arity$4(method_cache, cljs.core.assoc, dispatch_val, cljs.core.second(best_entry__10030));
      return cljs.core.second(best_entry__10030)
    }else {
      cljs.core.reset_cache(method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10035 = mf;
    if(and__3822__auto____10035) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10035
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2391__auto____10036 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10037 = cljs.core._reset[goog.typeOf(x__2391__auto____10036)];
      if(or__3824__auto____10037) {
        return or__3824__auto____10037
      }else {
        var or__3824__auto____10038 = cljs.core._reset["_"];
        if(or__3824__auto____10038) {
          return or__3824__auto____10038
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10043 = mf;
    if(and__3822__auto____10043) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10043
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2391__auto____10044 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10045 = cljs.core._add_method[goog.typeOf(x__2391__auto____10044)];
      if(or__3824__auto____10045) {
        return or__3824__auto____10045
      }else {
        var or__3824__auto____10046 = cljs.core._add_method["_"];
        if(or__3824__auto____10046) {
          return or__3824__auto____10046
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10051 = mf;
    if(and__3822__auto____10051) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10051
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10052 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10053 = cljs.core._remove_method[goog.typeOf(x__2391__auto____10052)];
      if(or__3824__auto____10053) {
        return or__3824__auto____10053
      }else {
        var or__3824__auto____10054 = cljs.core._remove_method["_"];
        if(or__3824__auto____10054) {
          return or__3824__auto____10054
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10059 = mf;
    if(and__3822__auto____10059) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10059
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2391__auto____10060 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10061 = cljs.core._prefer_method[goog.typeOf(x__2391__auto____10060)];
      if(or__3824__auto____10061) {
        return or__3824__auto____10061
      }else {
        var or__3824__auto____10062 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10062) {
          return or__3824__auto____10062
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10067 = mf;
    if(and__3822__auto____10067) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10067
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2391__auto____10068 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10069 = cljs.core._get_method[goog.typeOf(x__2391__auto____10068)];
      if(or__3824__auto____10069) {
        return or__3824__auto____10069
      }else {
        var or__3824__auto____10070 = cljs.core._get_method["_"];
        if(or__3824__auto____10070) {
          return or__3824__auto____10070
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10075 = mf;
    if(and__3822__auto____10075) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10075
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2391__auto____10076 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10077 = cljs.core._methods[goog.typeOf(x__2391__auto____10076)];
      if(or__3824__auto____10077) {
        return or__3824__auto____10077
      }else {
        var or__3824__auto____10078 = cljs.core._methods["_"];
        if(or__3824__auto____10078) {
          return or__3824__auto____10078
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10083 = mf;
    if(and__3822__auto____10083) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10083
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2391__auto____10084 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10085 = cljs.core._prefers[goog.typeOf(x__2391__auto____10084)];
      if(or__3824__auto____10085) {
        return or__3824__auto____10085
      }else {
        var or__3824__auto____10086 = cljs.core._prefers["_"];
        if(or__3824__auto____10086) {
          return or__3824__auto____10086
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10091 = mf;
    if(and__3822__auto____10091) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10091
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2391__auto____10092 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10093 = cljs.core._dispatch[goog.typeOf(x__2391__auto____10092)];
      if(or__3824__auto____10093) {
        return or__3824__auto____10093
      }else {
        var or__3824__auto____10094 = cljs.core._dispatch["_"];
        if(or__3824__auto____10094) {
          return or__3824__auto____10094
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10097 = cljs.core.apply.cljs$lang$arity$2(dispatch_fn, args);
  var target_fn__10098 = cljs.core._get_method(mf, dispatch_val__10097);
  if(cljs.core.truth_(target_fn__10098)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10097)].join(""));
  }
  return cljs.core.apply.cljs$lang$arity$2(target_fn__10098, args)
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
  return cljs.core.list.cljs$lang$arity$1("cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10099 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10100 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10100.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10100.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10100.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10100.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10101 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$4(this__10101.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache(this__10101.method_cache, this__10101.method_table, this__10101.cached_hierarchy, this__10101.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10102 = this;
  cljs.core.swap_BANG_.cljs$lang$arity$3(this__10102.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache(this__10102.method_cache, this__10102.method_table, this__10102.cached_hierarchy, this__10102.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10103 = this;
  if(cljs.core._EQ_.cljs$lang$arity$2(cljs.core.deref(this__10103.cached_hierarchy), cljs.core.deref(this__10103.hierarchy))) {
  }else {
    cljs.core.reset_cache(this__10103.method_cache, this__10103.method_table, this__10103.cached_hierarchy, this__10103.hierarchy)
  }
  var temp__3971__auto____10104 = cljs.core.deref(this__10103.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10104)) {
    var target_fn__10105 = temp__3971__auto____10104;
    return target_fn__10105
  }else {
    var temp__3971__auto____10106 = cljs.core.find_and_cache_best_method(this__10103.name, dispatch_val, this__10103.hierarchy, this__10103.method_table, this__10103.prefer_table, this__10103.method_cache, this__10103.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10106)) {
      var target_fn__10107 = temp__3971__auto____10106;
      return target_fn__10107
    }else {
      return cljs.core.deref(this__10103.method_table).call(null, this__10103.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10108 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_(dispatch_val_x, dispatch_val_y, this__10108.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10108.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.cljs$lang$arity$2(this__10108.prefer_table, function(old) {
    return cljs.core.assoc.cljs$lang$arity$3(old, dispatch_val_x, cljs.core.conj.cljs$lang$arity$2(cljs.core._lookup.cljs$lang$arity$3(old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache(this__10108.method_cache, this__10108.method_table, this__10108.cached_hierarchy, this__10108.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10109 = this;
  return cljs.core.deref(this__10109.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10110 = this;
  return cljs.core.deref(this__10110.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10111 = this;
  return cljs.core.do_dispatch(mf, this__10111.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10113__delegate = function(_, args) {
    var self__10112 = this;
    return cljs.core._dispatch(self__10112, args)
  };
  var G__10113 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10113__delegate.call(this, _, args)
  };
  G__10113.cljs$lang$maxFixedArity = 1;
  G__10113.cljs$lang$applyTo = function(arglist__10114) {
    var _ = cljs.core.first(arglist__10114);
    var args = cljs.core.rest(arglist__10114);
    return G__10113__delegate(_, args)
  };
  G__10113.cljs$lang$arity$variadic = G__10113__delegate;
  return G__10113
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10115 = this;
  return cljs.core._dispatch(self__10115, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset(multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method(multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method(multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods(multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method(multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers(multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2337__auto__) {
  return cljs.core.list.cljs$lang$arity$1("cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10116 = this;
  return goog.string.hashCode(cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this$], 0)))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10118, _) {
  var this__10117 = this;
  return cljs.core.list.cljs$lang$arity$1([cljs.core.str('#uuid "'), cljs.core.str(this__10117.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10119 = this;
  var and__3822__auto____10120 = cljs.core.instance_QMARK_(cljs.core.UUID, other);
  if(and__3822__auto____10120) {
    return this__10119.uuid === other.uuid
  }else {
    return and__3822__auto____10120
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10121 = this;
  var this__10122 = this;
  return cljs.core.pr_str.cljs$lang$arity$variadic(cljs.core.array_seq([this__10122], 0))
};
cljs.core.UUID;
goog.provide("client.const$");
goog.require("cljs.core");
client.const$.maps = cljs.core.ObjMap.fromObject(["\ufdd0'default_country"], {"\ufdd0'default_country":"Germany"});
goog.provide("client.utils");
goog.require("cljs.core");
client.utils.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.cljs$lang$arity$2(cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__6182) {
    var args = cljs.core.seq(arglist__6182);
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
goog.provide("clojure.browser.dom");
goog.require("cljs.core");
goog.require("goog.object");
goog.require("goog.dom");
clojure.browser.dom.append = function() {
  var append__delegate = function(parent, children) {
    cljs.core.apply.cljs$lang$arity$3(goog.dom.append, parent, children);
    return parent
  };
  var append = function(parent, var_args) {
    var children = null;
    if(goog.isDef(var_args)) {
      children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return append__delegate.call(this, parent, children)
  };
  append.cljs$lang$maxFixedArity = 1;
  append.cljs$lang$applyTo = function(arglist__10123) {
    var parent = cljs.core.first(arglist__10123);
    var children = cljs.core.rest(arglist__10123);
    return append__delegate(parent, children)
  };
  append.cljs$lang$arity$variadic = append__delegate;
  return append
}();
clojure.browser.dom.DOMBuilder = {};
clojure.browser.dom._element = function() {
  var _element = null;
  var _element__1 = function(this$) {
    if(function() {
      var and__3822__auto____10136 = this$;
      if(and__3822__auto____10136) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$1
      }else {
        return and__3822__auto____10136
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$1(this$)
    }else {
      var x__2391__auto____10137 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10138 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____10137)];
        if(or__3824__auto____10138) {
          return or__3824__auto____10138
        }else {
          var or__3824__auto____10139 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10139) {
            return or__3824__auto____10139
          }else {
            throw cljs.core.missing_protocol("DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _element__2 = function(this$, attrs_or_children) {
    if(function() {
      var and__3822__auto____10140 = this$;
      if(and__3822__auto____10140) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$2
      }else {
        return and__3822__auto____10140
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$2(this$, attrs_or_children)
    }else {
      var x__2391__auto____10141 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10142 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____10141)];
        if(or__3824__auto____10142) {
          return or__3824__auto____10142
        }else {
          var or__3824__auto____10143 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10143) {
            return or__3824__auto____10143
          }else {
            throw cljs.core.missing_protocol("DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs_or_children)
    }
  };
  var _element__3 = function(this$, attrs, children) {
    if(function() {
      var and__3822__auto____10144 = this$;
      if(and__3822__auto____10144) {
        return this$.clojure$browser$dom$DOMBuilder$_element$arity$3
      }else {
        return and__3822__auto____10144
      }
    }()) {
      return this$.clojure$browser$dom$DOMBuilder$_element$arity$3(this$, attrs, children)
    }else {
      var x__2391__auto____10145 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____10146 = clojure.browser.dom._element[goog.typeOf(x__2391__auto____10145)];
        if(or__3824__auto____10146) {
          return or__3824__auto____10146
        }else {
          var or__3824__auto____10147 = clojure.browser.dom._element["_"];
          if(or__3824__auto____10147) {
            return or__3824__auto____10147
          }else {
            throw cljs.core.missing_protocol("DOMBuilder.-element", this$);
          }
        }
      }().call(null, this$, attrs, children)
    }
  };
  _element = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return _element__1.call(this, this$);
      case 2:
        return _element__2.call(this, this$, attrs);
      case 3:
        return _element__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _element.cljs$lang$arity$1 = _element__1;
  _element.cljs$lang$arity$2 = _element__2;
  _element.cljs$lang$arity$3 = _element__3;
  return _element
}();
clojure.browser.dom.log = function() {
  var log__delegate = function(args) {
    return console.log(cljs.core.apply.cljs$lang$arity$2(cljs.core.pr_str, args))
  };
  var log = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return log__delegate.call(this, args)
  };
  log.cljs$lang$maxFixedArity = 0;
  log.cljs$lang$applyTo = function(arglist__10148) {
    var args = cljs.core.seq(arglist__10148);
    return log__delegate(args)
  };
  log.cljs$lang$arity$variadic = log__delegate;
  return log
}();
clojure.browser.dom.log_obj = function log_obj(obj) {
  return console.log(obj)
};
Element.prototype.clojure$browser$dom$DOMBuilder$ = true;
Element.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["js/Element (-element ", this$, ")"], 0));
  return this$
};
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$ = true;
cljs.core.PersistentVector.prototype.clojure$browser$dom$DOMBuilder$_element$arity$1 = function(this$) {
  clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["PersistentVector (-element ", this$, ")"], 0));
  var tag__10149 = cljs.core.first(this$);
  var attrs__10150 = cljs.core.second(this$);
  var children__10151 = cljs.core.drop(2, this$);
  if(cljs.core.map_QMARK_(attrs__10150)) {
    return clojure.browser.dom._element.cljs$lang$arity$3(tag__10149, attrs__10150, children__10151)
  }else {
    return clojure.browser.dom._element.cljs$lang$arity$3(tag__10149, null, cljs.core.rest(this$))
  }
};
clojure.browser.dom.DOMBuilder["string"] = true;
clojure.browser.dom._element["string"] = function() {
  var G__10164 = null;
  var G__10164__1 = function(this$) {
    clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["string (-element ", this$, ")"], 0));
    if(cljs.core.keyword_QMARK_(this$)) {
      return goog.dom.createElement(cljs.core.name(this$))
    }else {
      if("\ufdd0'else") {
        return goog.dom.createTextNode(cljs.core.name(this$))
      }else {
        return null
      }
    }
  };
  var G__10164__2 = function(this$, attrs_or_children) {
    clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["string (-element ", this$, " ", attrs_or_children, ")"], 0));
    var attrs__10152 = cljs.core.first(attrs_or_children);
    if(cljs.core.map_QMARK_(attrs__10152)) {
      return clojure.browser.dom._element.cljs$lang$arity$3(this$, attrs__10152, cljs.core.rest(attrs_or_children))
    }else {
      return clojure.browser.dom._element.cljs$lang$arity$3(this$, null, attrs_or_children)
    }
  };
  var G__10164__3 = function(this$, attrs, children) {
    clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["string (-element ", this$, " ", attrs, " ", children, ")"], 0));
    var str_attrs__10163 = cljs.core.truth_(function() {
      var and__3822__auto____10153 = cljs.core.map_QMARK_(attrs);
      if(and__3822__auto____10153) {
        return cljs.core.seq(attrs)
      }else {
        return and__3822__auto____10153
      }
    }()) ? cljs.core.reduce.cljs$lang$arity$3(function(o, p__10154) {
      var vec__10155__10156 = p__10154;
      var k__10157 = cljs.core.nth.cljs$lang$arity$3(vec__10155__10156, 0, null);
      var v__10158 = cljs.core.nth.cljs$lang$arity$3(vec__10155__10156, 1, null);
      var o__10159 = o == null ? {} : o;
      clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["o = ", o__10159], 0));
      clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["k = ", k__10157], 0));
      clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["v = ", v__10158], 0));
      if(function() {
        var or__3824__auto____10160 = cljs.core.keyword_QMARK_(k__10157);
        if(or__3824__auto____10160) {
          return or__3824__auto____10160
        }else {
          return cljs.core.string_QMARK_(k__10157)
        }
      }()) {
        var G__10161__10162 = o__10159;
        G__10161__10162[cljs.core.name(k__10157)] = v__10158;
        return G__10161__10162
      }else {
        return null
      }
    }, {}, attrs) : null;
    clojure.browser.dom.log_obj(str_attrs__10163);
    if(cljs.core.seq(children)) {
      return cljs.core.apply.cljs$lang$arity$4(goog.dom.createDom, cljs.core.name(this$), str_attrs__10163, cljs.core.map.cljs$lang$arity$2(clojure.browser.dom._element, children))
    }else {
      return goog.dom.createDom(cljs.core.name(this$), str_attrs__10163)
    }
  };
  G__10164 = function(this$, attrs, children) {
    switch(arguments.length) {
      case 1:
        return G__10164__1.call(this, this$);
      case 2:
        return G__10164__2.call(this, this$, attrs);
      case 3:
        return G__10164__3.call(this, this$, attrs, children)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10164
}();
clojure.browser.dom.element = function() {
  var element = null;
  var element__1 = function(tag_or_text) {
    clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["(element ", tag_or_text, ")"], 0));
    return clojure.browser.dom._element.cljs$lang$arity$1(tag_or_text)
  };
  var element__2 = function() {
    var G__10167__delegate = function(tag, children) {
      clojure.browser.dom.log.cljs$lang$arity$variadic(cljs.core.array_seq(["(element ", tag, " ", children, ")"], 0));
      var attrs__10166 = cljs.core.first(children);
      if(cljs.core.map_QMARK_(attrs__10166)) {
        return clojure.browser.dom._element.cljs$lang$arity$3(tag, attrs__10166, cljs.core.rest(children))
      }else {
        return clojure.browser.dom._element.cljs$lang$arity$3(tag, null, children)
      }
    };
    var G__10167 = function(tag, var_args) {
      var children = null;
      if(goog.isDef(var_args)) {
        children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10167__delegate.call(this, tag, children)
    };
    G__10167.cljs$lang$maxFixedArity = 1;
    G__10167.cljs$lang$applyTo = function(arglist__10168) {
      var tag = cljs.core.first(arglist__10168);
      var children = cljs.core.rest(arglist__10168);
      return G__10167__delegate(tag, children)
    };
    G__10167.cljs$lang$arity$variadic = G__10167__delegate;
    return G__10167
  }();
  element = function(tag, var_args) {
    var children = var_args;
    switch(arguments.length) {
      case 1:
        return element__1.call(this, tag);
      default:
        return element__2.cljs$lang$arity$variadic(tag, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  element.cljs$lang$maxFixedArity = 1;
  element.cljs$lang$applyTo = element__2.cljs$lang$applyTo;
  element.cljs$lang$arity$1 = element__1;
  element.cljs$lang$arity$variadic = element__2.cljs$lang$arity$variadic;
  return element
}();
clojure.browser.dom.remove_children = function remove_children(id) {
  var parent__10170 = goog.dom.getElement(cljs.core.name(id));
  return goog.dom.removeChildren(parent__10170)
};
clojure.browser.dom.get_element = function get_element(id) {
  return goog.dom.getElement(cljs.core.name(id))
};
clojure.browser.dom.html__GT_dom = function html__GT_dom(s) {
  return goog.dom.htmlToDocumentFragment(s)
};
clojure.browser.dom.insert_at = function insert_at(parent, child, index) {
  return goog.dom.insertChildAt(parent, child, index)
};
clojure.browser.dom.ensure_element = function ensure_element(e) {
  if(cljs.core.keyword_QMARK_(e)) {
    return clojure.browser.dom.get_element(e)
  }else {
    if(cljs.core.string_QMARK_(e)) {
      return clojure.browser.dom.html__GT_dom(e)
    }else {
      if("\ufdd0'else") {
        return e
      }else {
        return null
      }
    }
  }
};
clojure.browser.dom.replace_node = function replace_node(old_node, new_node) {
  var old_node__10173 = clojure.browser.dom.ensure_element(old_node);
  var new_node__10174 = clojure.browser.dom.ensure_element(new_node);
  goog.dom.replaceNode(new_node__10174, old_node__10173);
  return new_node__10174
};
clojure.browser.dom.set_text = function set_text(e, s) {
  return goog.dom.setTextContent(clojure.browser.dom.ensure_element(e), s)
};
clojure.browser.dom.get_value = function get_value(e) {
  return clojure.browser.dom.ensure_element(e).value
};
clojure.browser.dom.set_properties = function set_properties(e, m) {
  return goog.dom.setProperties(clojure.browser.dom.ensure_element(e), cljs.core.apply.cljs$lang$arity$2(goog.object.create, cljs.core.interleave.cljs$lang$arity$2(cljs.core.keys(m), cljs.core.vals(m))))
};
clojure.browser.dom.set_value = function set_value(e, v) {
  return clojure.browser.dom.set_properties(e, cljs.core.ObjMap.fromObject(["value"], {"value":v}))
};
clojure.browser.dom.click_element = function click_element(e) {
  return clojure.browser.dom.ensure_element(e).click(cljs.core.List.EMPTY)
};
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
    [["http://mt0.googleapis.com/vt?lyrs=t@129,r@182000000&src=api&hl=en-US&", "http://mt1.googleapis.com/vt?lyrs=t@129,r@182000000&src=api&hl=en-US&"], null, null, null, null, "t@129,r@182000000"], null, [[null, 0, 7, 7, [[[33E7, 124605E4], [3862E5, 12936E5]], [[3665E5, 1297E6], [3862E5, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&"]], [null, 0, 8, 8, [[[33E7, 124605E4], [3862E5, 12796E5]], [[345E6, 12796E5], [3862E5, 12867E5]], 
    [[35469E4, 12867E5], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&"]], [null, 0, 9, 9, [[[33E7, 124605E4], [3862E5, 12796E5]], [[34E7, 12796E5], [3862E5, 12867E5]], [[3489E5, 12867E5], [3862E5, 1302E6]], [[3683E5, 1302E6], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&"]], [null, 0, 10, 19, [[[329890840, 1246055600], [386930130, 1284960940]], 
    [[344646740, 1284960940], [386930130, 1288476560]], [[350277470, 1288476560], [386930130, 1310531620]], [[370277730, 1310531620], [386930130, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1.16&hl=en-US&"]], [null, 3, 7, 7, [[[33E7, 124605E4], [3862E5, 12936E5]], [[3665E5, 1297E6], [3862E5, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&"]], [null, 3, 8, 8, [[[33E7, 
    124605E4], [3862E5, 12796E5]], [[345E6, 12796E5], [3862E5, 12867E5]], [[35469E4, 12867E5], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&"]], [null, 3, 9, 9, [[[33E7, 124605E4], [3862E5, 12796E5]], [[34E7, 12796E5], [3862E5, 12867E5]], [[3489E5, 12867E5], [3862E5, 1302E6]], [[3683E5, 1302E6], [3862E5, 1320035E3]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&"]], 
    [null, 3, 10, null, [[[329890840, 1246055600], [386930130, 1284960940]], [[344646740, 1284960940], [386930130, 1288476560]], [[350277470, 1288476560], [386930130, 1310531620]], [[370277730, 1310531620], [386930130, 1320034790]]], ["http://mt0.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&", "http://mt1.gmaptiles.co.kr/mt?v=kr1p.16&hl=en-US&"]]], [["http://cbk0.googleapis.com/cbk?", "http://cbk1.googleapis.com/cbk?"]], [["http://khm0.googleapis.com/kh?v=60&hl=en-US&", "http://khm1.googleapis.com/kh?v=60&hl=en-US&"], 
    null, null, null, null, "60"], [["http://mt0.googleapis.com/mapslt?hl=en-US&", "http://mt1.googleapis.com/mapslt?hl=en-US&"]], [["http://mt0.googleapis.com/mapslt/ft?hl=en-US&", "http://mt1.googleapis.com/mapslt/ft?hl=en-US&"]], [["http://mt0.googleapis.com/vt?hl=en-US&", "http://mt1.googleapis.com/vt?hl=en-US&"]]], ["en-US", "US", null, 0, null, null, "http://maps.gstatic.com/mapfiles/", "http://csi.gstatic.com", "https://maps.googleapis.com", "http://maps.googleapis.com"], ["http://maps.gstatic.com/intl/en_us/mapfiles/api-3/9/13a", 
    "3.9.13a"], [2368370065], 1, null, null, null, null, 0, "", null, null, 0, "http://khm.googleapis.com/mz?v=115&", "AIzaSyAucos4yX7vSdrzQJgEtbF1HphlE04iCh8", "https://earthbuilder.google.com", "https://earthbuilder.googleapis.com"], loadScriptTime)
  };
  var loadScriptTime = (new Date).getTime();
  getScript("http://maps.gstatic.com/intl/en_us/mapfiles/api-3/9/13a/main.js")
})();
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
goog.require("google.maps");
goog.require("clojure.browser.dom");
goog.require("client.const$");
goog.require("client.utils");
goog.require("vertx");
client.core.mainEveneHandller = function mainEveneHandller(event) {
  return client.utils.log_obj.call(null, event)
};
client.core.getBoundsFromResults = function getBoundsFromResults(results) {
  return cljs.core.nth.call(null, results, 0).geometry.bounds
};
client.core.initMap = function initMap() {
  var mapContainer__6181 = clojure.browser.dom.get_element.call(null, "map_canvas");
  var mapConfig__6182 = {"mapTypeId":google.maps.MapTypeId.ROADMAP};
  var geocoderConfig__6183 = {"address":client.const$.maps.call(null, "\ufdd0'default_country")};
  var geocoder__6184 = new google.maps.Geocoder;
  var map__6185 = new google.maps.Map(mapContainer__6181, mapConfig__6182);
  geocoder__6184.geocode(geocoderConfig__6183, function(results, status) {
    if(cljs.core._EQ_.call(null, status, google.maps.GeocoderStatus.OK)) {
      return map__6185.fitBounds(client.core.getBoundsFromResults.call(null, results))
    }else {
      return null
    }
  });
  return null
};
client.core.main = function main() {
  var eb__6187 = new vertx.EventBus("http://localhost:8081/eventbus");
  eb__6187.onopen = function() {
    return client.core.initMap.call(null)
  };
  return eb__6187
};
goog.exportSymbol("client.core.main", client.core.main);
