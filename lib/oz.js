/**
 * Module dependencies
 */

var Emitter = require('emitter')
  , domify = require('domify')
  , closest = require('closest')
  , children = require('children')
  , matches = require('matches-selector')
  , clone = require('clone')
  , findWithSelf = require('find-with-self')
  , attr = require('attr')
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
  this.cached = [];
  this.rendered = [];
}

Emitter(Oz.prototype);

/**
 * Template render
 * @param  {Object} ctx Context in which to render the template
 * @return {DOMFragment}     Document fragment containing rendered nodes
 */
Oz.prototype.render = function (ctx) {
  var self = this
    , template = this.template.cloneNode(true);

  if(isFragment(template)) {
    this.rendered = template;
  } else {
    this.rendered = document.createDocumentFragment();
    this.rendered.appendChild(template);
  }

  return this.update(ctx);
};

/**
 * Update template
 * @param  {Object} ctx Context in which to render the template
 * @return {Array}     Document fragment corresponding to the updated (in-place) template
 */
Oz.prototype.update = function (ctx) {
  var self = this;

  this.cache = [];

  children(this.rendered).forEach(function (el) {
    self._render(el, ctx);
  });

  return this.rendered;
};

/**
 * Update coming from the template
 */
Oz.prototype._change = function (scope, val) {
  this.emit('change:'+scope, val);
  this.emit('change:'+scope.split('.')[0]);
  this.emit('change', scope, val);
};

/**
 * Internal iterative rendering
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
    , scope = scope || ''
    , tmp;

  ctx = ctx || {};

  if(~this.cache.indexOf(template) && !ignoreCache) {
    return this.cache[this.cache.indexOf(template)];
  }

  tmp = wrap(template);

  tagKeys.forEach(function (key) {
    var selector = '[' + tags[key].attr + ']' + (tags[key].not ? ':not(' + tags[key].not + ')' : '');
    
    findWithSelf(template, selector).filter(filterRoot(tags, template)).forEach(function (el) {
      var prop = attr(el).get(tags[key].attr);

      tags[key].render.call(self, el, ctx, prop, scope);
    });
  });

  this.cache.push(unwrap(tmp));

  return this.cache[this.cache.length - 1];
};

/**
 * Shortcut to creating and rendering a template
 * @param  {String | DOM} template The string or DOM node(s) representing the template
 * @param  {Object} ctx      context in which the template should be rendered
 * @return {Array}          Array of DOM nodes of the rendered template
 */
Oz.render = function (template, ctx) {
  return (new Oz(template)).render(ctx);
};

/**
 * Default template options
 */
Oz.tags = tags;



/**
 * Utility functions
 */


// wrap the template in a fragment so we can capture created elements (from arrays)
function wrap(template) {
  var tmp = document.createDocumentFragment()
    , nearest = template.parentNode && isFragment(template.parentNode) ? template.parentNode : closest(template, '*');

  tmp.appendChild(template);

  if(nearest) nearest.appendChild(tmp);

  return tmp;
}

// remove the temporary div and put the rendered elements back in their correct place
function unwrap(tmp) {
  return children(tmp);
}


function isFragment(el) {
  return el.nodeType === 11;
}

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