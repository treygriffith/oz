;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-domify/index.js", function(exports, require, module){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Wrap map from jquery.
 */

var map = {
  option: [1, '<select multiple="multiple">', '</select>'],
  optgroup: [1, '<select multiple="multiple">', '</select>'],
  legend: [1, '<fieldset>', '</fieldset>'],
  thead: [1, '<table>', '</table>'],
  tbody: [1, '<table>', '</table>'],
  tfoot: [1, '<table>', '</table>'],
  colgroup: [1, '<table>', '</table>'],
  caption: [1, '<table>', '</table>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  _default: [0, '', '']
};

/**
 * Parse `html` and return the children.
 *
 * @param {String} html
 * @return {Array}
 * @api private
 */

function parse(html) {
  if ('string' != typeof html) throw new TypeError('String expected');

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return document.createTextNode(html);
  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = document.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = document.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // Note: when moving children, don't rely on el.children
  // being 'live' to support Polymer's broken behaviour.
  // See: https://github.com/component/domify/pull/23
  if (1 == el.children.length) {
    return el.removeChild(el.children[0]);
  }

  var fragment = document.createDocumentFragment();
  while (el.children.length) {
    fragment.appendChild(el.removeChild(el.children[0]));
  }

  return fragment;
}

});
require.register("treygriffith-closest/index.js", function(exports, require, module){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf, root) {
  element = checkYoSelf ? {parentNode: element} : element

  root = root || document

  // Make sure `element !== document` and `element != null`
  // otherwise we get an illegal invocation
  while ((element = element.parentNode) && element !== document) {

    // document fragments cause illegal invocation
    // in matches, so we skip them
    if(element.nodeType === 11)
      continue
  
    if (matches(element, selector))
      return element
    // After `matches` on the edge case that
    // the selector matches the root
    // (when the root is not the document)
    if (element === root)
      return  
  }
}
});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("component-clone/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
  type = require('type-component');
}

/**
 * Module exports.
 */

module.exports = clone;

/**
 * Clones objects.
 *
 * @param {Mixed} any object
 * @api public
 */

function clone(obj){
  switch (type(obj)) {
    case 'object':
      var copy = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key]);
        }
      }
      return copy;

    case 'array':
      var copy = new Array(obj.length);
      for (var i = 0, l = obj.length; i < l; i++) {
        copy[i] = clone(obj[i]);
      }
      return copy;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

});
require.register("component-query/index.js", function(exports, require, module){
function one(selector, el) {
  return el.querySelector(selector);
}

exports = module.exports = function(selector, el){
  el = el || document;
  return one(selector, el);
};

exports.all = function(selector, el){
  el = el || document;
  return el.querySelectorAll(selector);
};

exports.engine = function(obj){
  if (!obj.one) throw new Error('.one callback required');
  if (!obj.all) throw new Error('.all callback required');
  one = obj.one;
  exports.all = obj.all;
  return exports;
};

});
require.register("component-matches-selector/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var query = require('query');

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matches
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = query.all(selector, el.parentNode);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}

});
require.register("component-css/index.js", function(exports, require, module){

/**
 * Properties to ignore appending "px".
 */

var ignore = {
  columnCount: true,
  fillOpacity: true,
  fontWeight: true,
  lineHeight: true,
  opacity: true,
  orphans: true,
  widows: true,
  zIndex: true,
  zoom: true
};

/**
 * Set `el` css values.
 *
 * @param {Element} el
 * @param {Object} obj
 * @return {Element}
 * @api public
 */

module.exports = function(el, obj){
  for (var key in obj) {
    var val = obj[key];
    if ('number' == typeof val && !ignore[key]) val += 'px';
    el.style[key] = val;
  }
  return el;
};

});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-event/index.js", function(exports, require, module){
var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',
    prefix = bind !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  el[bind](prefix + type, fn, capture || false);

  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  el[unbind](prefix + type, fn, capture || false);

  return fn;
};
});
require.register("treygriffith-events/index.js", function(exports, require, module){
/**
 * Module dependencies
 */
var event = require('event');

/**
 * Exports
 */
module.exports = Events;

/**
 * Create a new events manager
 */
function Events() {
  this._nodes = [];
  this._events = [];
}

/**
 * Bind event listener to an element
 * @api public
 * @param  {DOM Node}   el  DOM Node to add a listener to
 * @param  {String}   evt Event to listen for.
 * @param  {Function} fn  Callback to be triggered when the event occurs.
 * @return {Function}       Attached listener
 */
Events.prototype.bind = function (el, evt, fn) {
  var events = this._initNode(el);

  events[evt] = events[evt] || [];
  events[evt].push(fn);

  event.bind(el, evt, fn);

  return fn;
};

/**
 * Unbind event listener(s) from an element
 * @api public
 * @param  {DOM Node}   el  DOM Node to remove listeners from
 * @param  {String}   evt Optional event to remove listeners for. If omitted, removes listeners for all events
 * @param  {Function} fn  Specific listener to remove. If omitted, removes all listeners for an event
 * @return {Array}       Listeners removed
 */
Events.prototype.unbind = function (el, evt, fn) {
  var unbound = []
    , events
    , i;

  if(!~this._nodes.indexOf(el)) return unbound;

  events = this._events[this._nodes.indexOf(el)];

  if(!evt) {
    for(evt in events) {
      unbound = unbound.concat(this.unbind(el, evt, fn));
    }

    return unbound;
  }
  
  if(!events[evt] || !events[evt].length) return unbound;

  i = events[evt].length;

  while(i--) {
    if(!fn || fn === events[evt][i]) {
      event.unbind(el, evt, events[evt][i]);
      unbound.push(events[evt][i]);
      events[evt].splice(i, 1);
    }
  }

  return unbound;
};

/**
 * Initialize event management for a DOM node
 * @api private
 * @param  {DOM Node} el DOM node to manage events for
 * @return {Object}    Dictionary of events managed for this element
 */
Events.prototype._initNode = function (el) {
  var index = this._nodes.indexOf(el);

  if(!~index) index = (this._nodes.push(el) - 1);

  this._events[index] = this._events[index] || {};

  return this._events[index];
};


});
require.register("ramitos-children/src/children.js", function(exports, require, module){
var matches = require('matches-selector')

// same code as jquery with just the adition of selector matching
module.exports = function (el, selector) {
  var n = el.firstChild
  var matched = [];

  for(; n; n = n.nextSibling) {
    if(n.nodeType === 1 && (!selector || (selector && matches(n, selector))))
      matched.push(n)
  }

  return matched
}
});
require.register("ramitos-siblings/src/siblings.js", function(exports, require, module){
var children = require('children')

module.exports = function (el, selector) {
  return children(el.parentNode, selector).filter(function (sibling) {
    return sibling !== el
  })
}
});
require.register("timoxley-to-array/index.js", function(exports, require, module){
/**
 * Convert an array-like object into an `Array`.
 * If `collection` is already an `Array`, then will return a clone of `collection`.
 *
 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`
 * @return {Array} Naive conversion of `collection` to a new `Array`.
 * @api private
 */

module.exports = function toArray(collection) {
  if (typeof collection === 'undefined') return []
  if (collection === null) return [null]
  if (collection === window) return [window]
  if (typeof collection === 'string') return [collection]
  if (Array.isArray(collection)) return collection.slice()
  if (typeof collection.length != 'number') return [collection]
  if (typeof collection === 'function') return [collection]

  var arr = []
  for (var i = 0; i < collection.length; i++) {
    if (collection.hasOwnProperty(i) || i in collection) {
      arr.push(collection[i])
    }
  }
  if (!arr.length) return []
  return arr
}

});
require.register("ForbesLindesay-to-element-array/index.js", function(exports, require, module){
var toArray = require('to-array');

module.exports = toElementArray;
function toElementArray(elements) {
  if (typeof elements === 'string') {
    return toArray(document.querySelectorAll(elements));
  } else {
    return toArray(elements);
  }
}
});
require.register("treygriffith-find-with-self/index.js", function(exports, require, module){
var matches = require('matches-selector')
  , query = require('query')
  , toArray = require('to-element-array');

module.exports = findWithSelf;

function findWithSelf(el, selector) {
  var selected = toArray(query.all(selector, el));

  if(matches(el, selector)) selected.push(el);
  
  return selected;
}
});
require.register("matthewp-attr/index.js", function(exports, require, module){
/*
** Fallback for older IE without get/setAttribute
 */
function fetch(el, attr) {
  var attrs = el.attributes;
  for(var i = 0; i < attrs.length; i++) {
    if (attr[i] !== undefined) {
      if(attr[i].nodeName === attr) {
        return attr[i];
      }
    }
  }
  return null;
}

function Attr(el) {
  this.el = el;
}

Attr.prototype.get = function(attr) {
  return (this.el.getAttribute && this.el.getAttribute(attr))
    || (fetch(this.el, attr) === null ? null : fetch(this.el, attr).value);
};

Attr.prototype.set = function(attr, val) {
  if(this.el.setAttribute) {
    this.el.setAttribute(attr, val);
  } else {
    fetch(this.el, attr).value = val;
  }

  return this;
};

Attr.prototype.has = function(attr) {
  return (this.el.hasAttribute && this.el.hasAttribute(attr))
    || fetch(this.el, attr) !== null;
};

module.exports = function(el) {
  return new Attr(el);
};

module.exports.Attr = Attr;

});
require.register("matthewp-text/index.js", function(exports, require, module){

var text = 'innerText' in document.createElement('div')
  ? 'innerText'
  : 'textContent'

module.exports = function (el, val) {
  if (val == null) return el[text];
  el[text] = val;
};

});
require.register("component-value/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var typeOf = require('type');

/**
 * Set or get `el`'s' value.
 *
 * @param {Element} el
 * @param {Mixed} val
 * @return {Mixed}
 * @api public
 */

module.exports = function(el, val){
  if (2 == arguments.length) return set(el, val);
  return get(el);
};

/**
 * Get `el`'s value.
 */

function get(el) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (el.checked) {
        var attr = el.getAttribute('value');
        return null == attr ? true : attr;
      } else {
        return false;
      }
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        if (radio.checked) return radio.value;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        if (option.selected) return option.value;
      }
      break;
    default:
      return el.value;
  }
}

/**
 * Set `el`'s value.
 */

function set(el, val) {
  switch (type(el)) {
    case 'checkbox':
    case 'radio':
      if (val) {
        el.checked = true;
      } else {
        el.checked = false;
      }
      break;
    case 'radiogroup':
      for (var i = 0, radio; radio = el[i]; i++) {
        radio.checked = radio.value === val;
      }
      break;
    case 'select':
      for (var i = 0, option; option = el.options[i]; i++) {
        option.selected = option.value === val;
      }
      break;
    default:
      el.value = val;
  }
}

/**
 * Element type.
 */

function type(el) {
  var group = 'array' == typeOf(el) || 'object' == typeOf(el);
  if (group) el = el[0];
  var name = el.nodeName.toLowerCase();
  var type = el.getAttribute('type');

  if (group && type && 'radio' == type.toLowerCase()) return 'radiogroup';
  if ('input' == name && type && 'checkbox' == type.toLowerCase()) return 'checkbox';
  if ('input' == name && type && 'radio' == type.toLowerCase()) return 'radio';
  if ('select' == name) return 'select';
  return name;
}

});
require.register("oz/index.js", function(exports, require, module){
module.exports = require('./lib/oz');
});
require.register("oz/lib/oz.js", function(exports, require, module){
/**
 * Module dependencies
 */

var Emitter = require('emitter')
  , Events = require('events')
  , domify = require('domify')
  , closest = require('closest')
  , children = require('children')
  , matches = require('matches-selector')
  , clone = require('clone')
  , findWithSelf = require('find-with-self')
  , attr = require('attr')
  , utils = require('./utils')
  , tags = require('./tags');

/**
 * Exports
 */

module.exports = Oz;

/**
 * Template constructor
 * @param {String | DOM} template Representation of the template,
 * either as a string or a DOM node (or document fragment of several DOM nodes)
 * 
 * properties:
 *   thisSymbol: Symbol used in template declarations to indicate that the current context is to be used as the value.
 *     default: '@'
 *   separator: Symbol used to separate attributes
 *     default: ';'
 *   equals: Symbol used to separate attribute name from value
 *     default: ':'
 *   template: DOM element(s) that represent the template to be rendered
 *   tags: Object defining how tags are notated and rendered
 *     default: Oz.tags
 *   cached: internal cache of already rendered DOM elements
 *   rendered: the template's output, for use in updates
 *   
 */
function Oz(template) {
  if(!(this instanceof Oz)) return new Oz(template);
  this.thisSymbol = '@';
  this.equals = ':';
  this.separator = ';';
  this.template = typeof template === 'string' ? domify(template) : template;
  this.tags = clone(Oz.tags);
  this.events = new Events();
  this.cached = [];
}

Emitter(Oz.prototype);

/**
 * Template render
 * @api public
 * @param  {Object} ctx Context in which to render the template
 * @return {DOMFragment}     Document fragment containing rendered nodes
 */
Oz.prototype.render = function (ctx) {
  var self = this
    , template = this.template.cloneNode(true)
    , fragment;

  if(isFragment(template)) {
    fragment = template;
  } else {
    fragment = document.createDocumentFragment();
    fragment.appendChild(template);
  }

  this.rendered = children(fragment);

  this.update(ctx);

  return fragment;
};

/**
 * Update template
 * @api public
 * @param  {Object} ctx Context in which to render the template
 * @return {Array}     Array of rendered elements corresponding to the updated (in-place) template
 */
Oz.prototype.update = function (ctx) {
  var self = this;

  this.ctx = {};
  this.cache = [];

  this.rendered.forEach(function (el) {
    unbindAll(self.events, el);
    self._render(el, ctx);
  });

  return this.rendered;
};

/**
 * Update coming from the template
 * @api private
 */
Oz.prototype._change = function (scope, val) {
  var split;

  this.emit('change:'+scope, val); // triggers .on('change:person.name')

  if(~scope.indexOf('.')) {
    split = scope.split('.');
    this.emit('change:'+split[0]); // triggers .on('change:person')
  }

  this.emit('change', scope, val); // triggers .on('change')
};

/**
 * Internal iterative rendering
 * @api private
 * @param  {DOM} template    DOM node to be rendered
 * @param  {Object} ctx         Context in which the template should be rendered
 * @param  {Boolean} ignoreCache Flag determining if this template should be re-rendered if it has already been rendered.
 *                               This is to allow tags that change scope (oz and oz-each) to make sure that the subordinate nodes are rendered properly
 * @return {DOM}             Rendered template
 */
Oz.prototype._render = function (template, ctx, scope, ignoreCache) {
  var self = this
    , tags = this.tags
    , thisSymbol = this.thisSymbol
    , tagKeys = Object.keys(tags)
    , tmp;

  scope = scope || '';

  if(~this.cache.indexOf(template) && !ignoreCache) {
    return this.cache[this.cache.indexOf(template)];
  }

  tmp = wrap(template);

  tagKeys.forEach(function (key) {
    var selector = '[' + tags[key].attr + ']' + (tags[key].not ? ':not(' + tags[key].not + ')' : '');
    
    findWithSelf(template, selector).filter(filterRoot(tags, template)).forEach(function (el) {
      var prop = attr(el).get(tags[key].attr)
        , next = function (_el, _ctx, _scope) {
          // replace empty arguments with defaults
          switch(arguments.length) {
            case 0:
              _el = el;
            case 1:
              _ctx = ctx;
            case 2:
              _scope = scope;
          }

          // render this element's children
          children(_el).forEach(function (child) {
            // ignore cache on context change
            self._render(child, _ctx, _scope, (_scope !== scope && _ctx !== ctx));
          });
        };

      tags[key].render.call(self, el, ctx, prop, scope, next);
    });
  });

  this.cache.push(unwrap(tmp));

  return this.cache[this.cache.length - 1];
};

/**
 * Shortcut to creating and rendering a template
 * @api public
 * @param  {String | DOM} template The string or DOM node(s) representing the template
 * @param  {Object} ctx      context in which the template should be rendered
 * @return {Array}          Array of DOM nodes of the rendered template
 */
Oz.render = function (template, ctx) {
  return (new Oz(template)).render(ctx);
};

/**
 * Default template options
 * updating tags on the constructor will update the tags for all templates created thereafter
 */
Oz.tags = tags;

/**
 * Utilities for extended tags to use
 */
for(var p in utils) Oz[p] = utils[p];


/**
 * Utility functions
 */

// unbind all event listeners from this node and all descendents
function unbindAll(events, el) {
  findWithSelf(el, '*').forEach(function (el) {
    events.unbind(el);
  });
}


// wrap the template in a fragment so we can capture created elements (from arrays)
function wrap(template) {
  var tmp = document.createDocumentFragment()
    , nearest = template.parentNode && isFragment(template.parentNode) ? template.parentNode : closest(template, '*');

  tmp.appendChild(template);

  if(nearest) nearest.appendChild(tmp);

  return tmp;
}

// remove the temporary fragment and put the rendered elements back in their correct place
function unwrap(tmp) {
  return children(tmp);
}

// check if the DOM node is a document fragment
function isFragment(el) {
  return el.nodeType === 11;
}

// filter nodes that are not at the top level of tags
function filterRoot(tags, root) {
  var tagKeys = Object.keys(tags);

  return function (el) {
    for(var i=0; i<tagKeys.length; i++) {

      var closestEl = closest(el, '[' + tags[tagKeys[i]].attr + ']', true, root);

      if(closestEl != null && closestEl !== el) return false;
    }

    return true;
  };
}
});
require.register("oz/lib/tags.js", function(exports, require, module){
/**
 * Module dependencies
 */

var attr = require('attr')
  , text = require('text')
  , value = require('value')
  , css = require('css')
  , matches = require('matches-selector')
  , children = require('children')
  , siblings = require('siblings')
  , utils = require('./utils');

/**
 * Default template options
 *
 * Tag properties:
 *   attr: String - html attribute name that denotes this tag and stores its value
 *   not: String - CSS selector that describes which nodes with `attr` should be ignored when rendering or updating
 *   render: Function - evaluated when a node is rendered or updated. Should accept 5 arguments:
 *     el: DOM node currently rendering
 *     ctx: Object - describes the the context that this node is being rendered in
 *     prop: String - the value of the attribute tag
 *     scope: String - represents the current context tree (e.g. "people.1.name")
 *     next: Function - should be evaluated after the node has been rendered with 3 arguments:
 *       el: the element that has been rendered - default: current el
 *       ctx: the context of this `el`'s children - default: current context
 *       scope: the scope of this `el`'s children - default: current scope
 */

var tags = module.exports = {

  /**
   * Render an attribute
   * template: <img oz-attr="src:mysrc;class:myclass" />
   * context: { mysrc: "something.jpg", myclass: "photo" }
   * output: <img src="something.jpg" class="photo" />
   */
  attr: {
    attr: 'oz-attr',
    render: function (el, ctx, prop, scope, next) {

      var self = this;

      utils.propSplit(prop, this.separator, this.equals, function (name, val) {
        val = val != null ? utils.get(ctx, val, self.thisSymbol) : null;

        if(attr(el).get(name) !== val) attr(el).set(name, val);
      });

      next();
    }
  },

  /**
   * Namespace subordinate nodes to this object
   * template: <div oz="person"><p oz-text="name"></p></div>
   * context: { person: {name: 'Tobi'} }
   * output: <div oz="person"><p oz-text="name">Tobi</p></div>
   */
  object: {
    attr: 'oz',
    render: function (el, ctx, prop, scope, next) {
      var val = utils.get(ctx, prop, this.thisSymbol)
        , self = this;

      scope = utils.getScope(scope, prop, this.thisSymbol)

      show(el);
      if(!val) hide(el);

      next(el, val, scope);
    }
  },

  /**
   * Hide nodes for falsey values
   * template: <div oz-if="person.active"></div>
   * context: { person: {active: false} }
   * output: <div oz-if="person.active" style="display:none"></div>
   */
  bool: {
    attr: 'oz-if',
    render: function (el, ctx, prop, scope, next) {
      var val = utils.get(ctx, prop, this.thisSymbol)
        , self = this;

      show(el);
      if(!val || (Array.isArray(val) && val.length === 0)) hide(el);

      next();
    }
  },

  /**
   * Iterate over array-like objects and namespace the resulting nodes to the value iterated over
   * template: <div oz-each="people"><p oz-text="name"></p></div>
   * context: { people: [ {name: 'Tobi'}, {name: 'Brian'} ] }
   * output: <div oz-each="people" oz-each-index="0"><p oz-text="name">Tobi</p></div>
   *         <div oz-each="people" oz-each-index="1"><p oz-text="name">Brian</p></div>
   */
  array: {
    attr: 'oz-each',
    not: '[oz-each-index]',
    render: function (el, ctx, prop, scope, next) {
      var newEl
        , existing = {}
        , after
        , val = utils.get(ctx, prop, this.thisSymbol)
        , self = this;

      // nothing to do if there is no array at all
      if(!val) return hide(el);

      show(el);

      // find all the existing elements
      siblings(el, '[oz-each-index]').forEach(function (el, i) {

        // remove elements that are no longer around
        if(i >= val.length) return el.parentNode.removeChild(el);

        existing[i] = el;
      });

      // use a for loop instead of `.forEach` to allow array-like values with a length property
      for(var i=0; i<val.length; i++) {

        after = existing[i + 1] || el;
        newEl = existing[i] || el.cloneNode(true);

        // we need to be able to reference this element later
        attr(newEl).set('oz-each-index', i);

        // insert in the correct ordering
        after.parentNode.insertBefore(newEl, after);

        next(newEl, val[i], utils.getScope(scope, prop + '.' + i, self.thisSymbol));
      }

      // hide template element
      hide(el);
    }
  },

  /**
   * Add text content to nodes
   * template: <div oz-text="person.name"></div>
   * context: { person: {name: 'Tobi'} }
   * output: <div oz-text="person.name">Tobi</div>
   */
  string: {
    attr: 'oz-text',
    render: function (el, ctx, prop, scope, next) {
      var val = utils.get(ctx, prop, this.thisSymbol) || ''
        , self = this;

      text(el, String(val));

      next();
    }
  },

  /**
   * Bind form values to context
   * template: <input type="text" oz-val="person.name">
   * context: { person: { name: 'Tobi' } }
   * output: <input type="text" value="Tobi">
   * template.on('change:person.name', fn); // fired when <input> is changed
   */
  // TODO: handle form elements like checkboxes, radio buttons
  value: {
    attr: 'oz-val',
    render: function (el, ctx, prop, scope, next) {
      var val = utils.get(ctx, prop, this.thisSymbol)
        , self = this;

      // set form value
      value(el, val);

      // listen for changes to values
      onChange(self.events, el, function (val) {
        self._change(utils.getScope(scope, prop, self.thisSymbol), val);
      });

      next();
    }
  },

  /**
   * Listen for DOM events
   * template: <div oz-evt="click:save"></div>
   * output: template.on('save', fn); // fired when <div> is clicked
   */
  event: {
    attr: 'oz-evt',
    render: function (el, ctx, prop, scope, next) {
      var self = this;

      utils.propSplit(prop, this.separator, this.equals, function (name, val) {

        self.events.bind(el, name, function (e) {
          self.emit(val, el, e, ctx);
        });
      });

      next();
    }
  }

};


/**
 * Utility functions
 */

// hide element
function hide(el) {
  css(el, {
    display: 'none'
  });
}

// unhide element (does not guarantee that it will be shown, just that it won't be hidden at this level)
function show(el) {
  css(el, {
    display: ''
  });
}

// bind an element to all potential `change` events, but only trigger when content changes
function onChange(events, el, fn) {

  var val = value(el);

  function changed(e) {
    if(value(el) !== val) fn(value(el));
    val = value(el);
  }

  events.bind(el, 'click', changed);
  events.bind(el, 'change', changed);
  events.bind(el, 'keyup', changed);
}
});
require.register("oz/lib/utils.js", function(exports, require, module){
// get the value of a property in a context
exports.get = function get(ctx, prop, thisSymbol) {
  var val = ctx;

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) {
      if(!val) return val = null;
      if(typeof val[part] === 'function') val = val[part]();
      else val = val[part];
    }
  });

  return val;
};

// get the textual representation of current scope
exports.getScope = function getScope(scope, prop, thisSymbol) {

  var scopes = [];

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) scopes.push(part);
  });

  return scopes.join('.');
};

// split a property into its constituent parts - similar to inline style declarations
exports.propSplit = function propSplit(prop, separator, equals, fn) {
  prop.split(separator).forEach(function (prop) {
    if(!prop) return;

    var parts = prop.split(equals).map(trim);

    fn(parts[0], parts[1]);
  });
};

// convenience trim function
function trim(str) {
  return str.trim();
}
});













require.alias("component-domify/index.js", "oz/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("treygriffith-closest/index.js", "oz/deps/closest/index.js");
require.alias("treygriffith-closest/index.js", "oz/deps/closest/index.js");
require.alias("treygriffith-closest/index.js", "closest/index.js");
require.alias("component-matches-selector/index.js", "treygriffith-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("treygriffith-closest/index.js", "treygriffith-closest/index.js");
require.alias("component-clone/index.js", "oz/deps/clone/index.js");
require.alias("component-clone/index.js", "clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-matches-selector/index.js", "oz/deps/matches-selector/index.js");
require.alias("component-matches-selector/index.js", "matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-css/index.js", "oz/deps/css/index.js");
require.alias("component-css/index.js", "css/index.js");

require.alias("component-emitter/index.js", "oz/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("treygriffith-events/index.js", "oz/deps/events/index.js");
require.alias("treygriffith-events/index.js", "oz/deps/events/index.js");
require.alias("treygriffith-events/index.js", "events/index.js");
require.alias("component-event/index.js", "treygriffith-events/deps/event/index.js");

require.alias("treygriffith-events/index.js", "treygriffith-events/index.js");
require.alias("ramitos-children/src/children.js", "oz/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "oz/deps/children/index.js");
require.alias("ramitos-children/src/children.js", "children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "oz/deps/siblings/src/siblings.js");
require.alias("ramitos-siblings/src/siblings.js", "oz/deps/siblings/index.js");
require.alias("ramitos-siblings/src/siblings.js", "siblings/index.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "ramitos-siblings/index.js");
require.alias("treygriffith-find-with-self/index.js", "oz/deps/find-with-self/index.js");
require.alias("treygriffith-find-with-self/index.js", "oz/deps/find-with-self/index.js");
require.alias("treygriffith-find-with-self/index.js", "find-with-self/index.js");
require.alias("component-query/index.js", "treygriffith-find-with-self/deps/query/index.js");

require.alias("component-matches-selector/index.js", "treygriffith-find-with-self/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ForbesLindesay-to-element-array/index.js", "treygriffith-find-with-self/deps/to-element-array/index.js");
require.alias("timoxley-to-array/index.js", "ForbesLindesay-to-element-array/deps/to-array/index.js");

require.alias("treygriffith-find-with-self/index.js", "treygriffith-find-with-self/index.js");
require.alias("matthewp-attr/index.js", "oz/deps/attr/index.js");
require.alias("matthewp-attr/index.js", "attr/index.js");

require.alias("matthewp-text/index.js", "oz/deps/text/index.js");
require.alias("matthewp-text/index.js", "text/index.js");

require.alias("component-value/index.js", "oz/deps/value/index.js");
require.alias("component-value/index.js", "oz/deps/value/index.js");
require.alias("component-value/index.js", "value/index.js");
require.alias("component-type/index.js", "component-value/deps/type/index.js");

require.alias("component-value/index.js", "component-value/index.js");
require.alias("oz/index.js", "oz/index.js");if (typeof exports == "object") {
  module.exports = require("oz");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("oz"); });
} else {
  this["Oz"] = require("oz");
}})();