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

  this.ctx = ctx || {};
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
  this.emit('change:'+scope, val); // triggers `.on('change:person.name')` with `'Brian'`
  this.emit('change', scope, val); // triggers `.on('change')` with `('person.name', 'Brian')`
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

  // NOTE: what impact does this caching have on multiple tags on the same html element?
  if(~this.cache.indexOf(template) && !ignoreCache) {
    return this.cache[this.cache.indexOf(template)];
  }

  tagKeys.forEach(function (key) {
    // TODO: add compatibility for data-* attributes
    var selector = '[' + tags[key].attr + ']' + (tags[key].not ? ':not(' + tags[key].not + ')' : '');
    
    findWithSelf(template, selector).filter(filterRoot(tags, template)).forEach(function (el) {
      var prop = attr(el).get(tags[key].attr)
        , next = function (_el, _ctx, _scope) {
          // replace empty arguments with defaults
          // fall through for lower argument lengths to pick up all the defaults
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

  this.cache.push(template);

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