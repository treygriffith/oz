/**
 * Module dependencies
 */

var attr = require('attr')
  , children = require('children')
  , clone = require('clone')
  , closest = require('closest')
  , domify = require('domify')
  , Emitter = require('emitter')
  , Events = require('events')
  , findWithSelf = require('find-with-self')
  , matches = require('matches-selector')
  , utils = require('./utils');

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
 *   cache: internal cache of already rendered DOM elements
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
  this.cache = [];
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
 * @api public
 */
Oz.prototype.change = function (scope, val) {
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
    , selector = '';

  scope = scope || '';

  // don't try to render undefined stuff - this happens when a node has no children
  if(!template) return template;

  // we don't need to render anything if there are no tags
  if(!tagKeys.length) return template;

  // use a combined selector to get all of the elements with tags
  // TODO: add compatibility for data-* attributes
  selector = tagKeys.map(function (key) {
    return '[' + key + ']' + (tags[key].not ? ':not(' + tags[key].not + ')' : '');
  }).join(',');

  // get all of the top level (i.e. not inside another oz tag element) elements.
  // There can be more than one.
  findWithSelf(template, selector).filter(filterRoot(tagKeys, template)).forEach(function (el) {
    var _scope = scope
      , _ctx = ctx;

    // cycle through all the tags
    tagKeys.forEach(function (key) {
      var prop
        , ret;

      // skip tags that aren't on this element
      if(!matches(el, '[' + key + ']')) return;

      prop = attr(el).get(key);

      // the function should return either null or a string indicating
      // the new scope which affects this element's children.
      // Tags CAN overwrite each other, so you shouldn't use two tags
      // that change scope on the same element.
      ret = tags[key].render.call(self, el, self.get(ctx, prop), self.scope(scope, prop), { ctx: ctx, prop: prop, scope: scope });

      if(ret) {
        _scope = ret;
        _ctx = self.get(self.ctx, _scope);
      }
    });

    // render this element's children
    children(el).forEach(function (child) {
      self._render(child, _ctx, _scope);
    });

  });

  return template;
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


Oz.tags = {};

/**
 * Use a new tag for an instance. When called on Oz, it adds the tag for all new instances.
 * @api public
 * @param {String} name html attribute name that denotes this tag and stores its value
 * @param {Function} render evaluated when a node is rendered or updated.
 * @param {String} not Optional CSS selector that describes which nodes with `attr` should be ignored when rendering or updating
 *
 * Render should accept 5 arguments:
 *   el: DOM node currently rendering
 *   ctx: Object - describes the the context that this node is being rendered in
 *   prop: String - the value of the attribute tag
 *   scope: String - represents the current context tree (e.g. "people.1.name")
 *   next: Function - should be evaluated after the node has been rendered with 3 arguments:
 *     el: the element that has been rendered - default: current el
 *     ctx: the context of this `el`'s children - default: current context
 *     scope: the scope of this `el`'s children - default: current scope
 */
Oz.prototype.tag = Oz.tag = function (name, render, not) {
  if(arguments.length > 1) {
    this.tags[name] = {
      render: render,
      not: not
    };
  }

  return this.tags[name];
};

/**
 * Plugin for tags to identify themselves
 */
Oz.prototype.use = Oz.use = function (plugin) {
  plugin(this);
  return this;
};

/**
 * Utilities for tags to use
 */
for(var p in utils) Oz.prototype[p] = utils[p];

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
function filterRoot(tagKeys, root) {

  return function (el) {
    for(var i=0; i<tagKeys.length; i++) {

      var closestEl = closest(el, '[' + tagKeys[i] + ']', true, root);

      if(closestEl != null && closestEl !== el) return false;
    }

    return true;
  };
}
