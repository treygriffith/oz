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
  , matchesAttr = require('matches-attribute')
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
 *   template: DOM element(s) that represent the template to be rendered or a string
 *   tags: Object defining how tags are notated and rendered
 *   cache: internal cache of already rendered DOM elements
 *   rendered: the template's output, for use in updates
 *   
 */
function Oz(template) {
  if(!(this instanceof Oz)) return new Oz(template);
  this.thisSymbol = '@';
  this.template = typeof template === 'string' ? domify(template) : template;
  this.tags = clone(Oz.tags);
  this.events = new Events();
  this.cache = [];
}

Emitter(Oz.prototype);

/**
 * Template render
 * @api public
 * @param  {Object}       ctx   Context in which to render the template
 * @return {DOMFragment}        Document fragment containing rendered nodes
 */
Oz.prototype.render = function (ctx) {
  var self = this
    , template = this.template.cloneNode(true)
    , fragment;

  // make sure that the template is encased in a documentFragment
  if(isFragment(template)) {
    fragment = template;
  } else {
    fragment = document.createDocumentFragment();
    fragment.appendChild(template);
  }

  // store an array of our rendered templates so we can update it later
  this.rendered = children(fragment);

  // do the actual data entry into the template
  this.update(ctx);

  // update the rendered array - if new siblings were inserted, we would lose
  // them otherwise
  this.rendered = children(fragment);

  // the fragment can be appended into the doc easily
  // and then it disappears. It's a good transport.
  return fragment;
};

/**
 * Update template
 * @api public
 * @param  {Object} ctx Context in which to render the template
 * @return {Array}      Array of rendered elements corresponding to the updated (in-place) template
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
 * @param {String} scope String representation of the scope tree
 * @param {Mixed}  val   Value that changed
 */
Oz.prototype.change = function (scope, val) {
  var scopes = scope.split('.')
    , notified = [];

  this.emit('change', scope, val); // triggers `.on('change')` with `('person.name', 'Brian')`

  while(scopes.length) {
    notified.push(scopes.shift());
    if(scopes.length) {
      this.emit('change:'+notified.join('.'), scopes.join('.'), val); // triggers `.on('change:person')` with `('name', 'Brian')`
    } else {
      this.emit('change:'+notified.join('.'), val); // triggers `.on('change:person.name')` with `('Brian')`
    }
  }
};

/**
 * Internal iterative rendering
 * @api private
 * @param  {DOM}    el    DOM node to be rendered
 * @param  {Object} ctx   Context in which the template should be rendered
 * @param  {String} scope scope tree representation in dot notation.
 * @return {DOM}          Rendered template
 */
Oz.prototype._render = function (el, ctx, scope) {
  scope = scope || '';

  var self = this
    , _scope = scope
    , _ctx = ctx
    , tags = this.tags
    , tagKeys = Object.keys(tags)
    , keepRendering = true;

  // we don't need to render anything if there are no tags
  if(!tagKeys.length) return el;

  // cycle through all the tags
  tagKeys.forEach(function (key) {
    // TODO: add compatibility for data-* attributes
    var attrs = matchesAttr(el, key);

    // this tag wasn't a match
    if(!attrs) return;

    attrs.forEach(function (name) {

      var prop = attr(el).get(name)
        , ret
        , raw = {
          ctx: ctx,
          prop: prop,
          scope: scope,
          name: name
        };

      // the function should return either null or a string indicating
      // the new scope which affects this element's children.
      // Tags CAN overwrite each other, so you shouldn't use two tags
      // that change scope on the same element.
      // If the function returns false, the child nodes will not be
      // rendered.
      ret = tags[key].call(self, el, self.get(ctx, prop), self.scope(scope, prop), raw);

      if(ret) {
        _scope = ret;
        _ctx = self.get(self.ctx, _scope);
      } else if(ret === false) {
        keepRendering = false;
      }
    });
  });

  if(keepRendering) {
    // render this element's children
    children(el).forEach(function (child) {
      self._render(child, _ctx, _scope);
    });
  }

  return el;
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
 * Global tags, to be used for all new instances
 */
Oz.tags = {};

/**
 * Use a new tag for an instance. When called on Oz, it adds the tag for all new instances.
 * @api public
 * @param {String} name html attribute name that denotes this tag and stores its value
 * @param {Function} render evaluated when a node is rendered or updated.
 * 
 * Render can accept up to 4 arguments:
 *   el: DOM node currently rendering (e.g <div oz-text="name"></div>)
 *   val: the value of the context with the current property (e.g. "Brian")
 *   scope: the current scope chain with the current property (e.g. "people.1.name")
 *   raw: the Raw paramters that this render was called with:
 *     ctx: Object - describes the the context that this node is
 *                   being rendered in (e.g. { name: "Brian" })
 *     prop: String - the value of the attribute tag (e.g. "name")
 *     scope: String - represents the current context tree (e.g. "people.1.name")
 */
Oz.prototype.tag = Oz.tag = function (name, render) {
  if(arguments.length > 1) {
    this.tags[name] = render;
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
