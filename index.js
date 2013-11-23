/**
 * Module dependencies
 */

var domify = require('domify')
  , closest = require('closest')
  , children = require('children')
  , matches = require('matches-selector')
  , clone = require('clone')
  , findWithSelf = require('find-with-self')
  , text = require('text')
  , attr = require('attr')
  , css = require('css');

/**
 * Exports
 */

module.exports = Oz;

/**
 * Template constructor
 */

function Oz(template, ctx) {
  if(!(this instanceof Oz)) return new Oz(template, ctx);
  this.thisSymbol = '@';
  this.separator = ':';
  this.template = domify(template);
  this.tags = clone(Oz.tags);
  this.cached = [];
  this.rendered = [];

  if(ctx) return this.render(ctx);
}

/**
 * Template render
 */

Oz.prototype.render = function (ctx) {
  var self = this
    , template = this.template.cloneNode(true)
    , out = [];

  this.cache = [];

  if(isFragment(template)) {

    children(template).forEach(function (el) {
      out = out.concat(self._render(el, ctx));
    });

  } else {
    out = out.concat(self._render(template, ctx));
  }

  this.rendered = out;

  return out;
};

/**
 * Update template
 */

Oz.prototype.update = function (prop, value) {
 // updating probably needs to happen at the same level rendering does if it's going to be fast
 // this is where we need our natural object listener
};

/**
 * Iterative Rendering function
 */

Oz.prototype._render = function (template, ctx, ignoreCache) {
  var self = this
    , tags = this.tags
    , thisSymbol = this.thisSymbol
    , tagKeys = Object.keys(tags)
    , tmp;

  ctx = ctx || {};

  if(~this.cache.indexOf(template) && !ignoreCache) {
    return this.cache[this.cache.indexOf(template)];
  }

  tmp = wrap(template);

  tagKeys.forEach(function (key) {
    var selector = '[' + tags[key].attr + ']';
    
    findWithSelf(template, selector).filter(filterRoot(tagKeys, template)).forEach(function (el) {
      var prop = attr(el).get(tags[key].attr);

      tags[key].render.call(self, el, ctx, prop);
    });
  });

  this.cache.push(unwrap(tmp));

  return this.cache[this.cache.length - 1];
};

/**
 * Default template options
 */

Oz.tags = {

  // TODO: multiple attributes on the same tag
  attr: {
    attr: 'oz-attr',
    render: function (el, ctx, prop) {
      var parts = prop.split(this.separator)
        , attribute = parts[0]
        , val = get(ctx, parts[1], this.thisSymbol)
        , self = this;

      attr(el).set(attribute, val);

      children(el).forEach(function (child) {
        self._render(child, ctx);
      });
    }
  },

  object: {
    attr: 'oz',
    render: function (el, ctx, prop) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      if(!val) hide(el);

      children(el).forEach(function (child) {
        self._render(child, val, true);
      });
    }
  },

  bool: {
    attr: 'oz-if',
    render: function (el, ctx, prop) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      if(!val || (Array.isArray(val) && val.length === 0)) hide(el);

      children(el).forEach(function (child) {
        self._render(child, ctx);
      });
    }
  },

  array: {
    attr: 'oz-each',
    render: function (el, ctx, prop) {
      var newEl
        , val = get(ctx, prop, this.thisSymbol)
        , self = this;

      for(var i=0; i<val.length; i++) {
        newEl = el.cloneNode(true);

        // mark this as a non-template copy
        attr(newEl).set('oz-each-index', i);

        // insert the new one above the old one
        // this preserves the ordering of the array
        el.parentNode.insertBefore(newEl, el);

        children(newEl).forEach(function (child) {
          self._render(child, val[i], true);
        });
      }

      // hide template element
      hide(el);
    }
  },

  string: {
    attr: 'oz-text',
    render: function (el, ctx, prop) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      text(el, String(val));

      children(el).forEach(function (child) {
        self._render(child, ctx);
      });
    }
  }

};

/**
 * Utility functions
 */

// get the value of a property in a context
function get(ctx, prop, thisSymbol) {
  var parts = prop.split('.')
    , val = ctx;

  parts.forEach(function (part) {
    if(part !== thisSymbol) val = ctx[part];
  });

  return val;
}

// wrap the template in a temporary div so we can capture created elements (from arrays)
function wrap(template) {
  var tmp = document.createDocumentFragment()
    , nearest = closest(template, '*');

  tmp.appendChild(template);

  if(nearest) nearest.appendChild(tmp);

  return tmp;
}

// remove the temporary div and put the rendered elements back in their correct place
function unwrap(tmp) {
  return children(tmp);
}

function filterRoot(tagKeys, root) {
  return function (el) {
    for(var i=0; i<tagKeys.length; i++) {

      var closestEl = closest(el, '[' + tags[tagKeys[i]].attr + ']', true, root);

      if(closestEl != null && closestEl !== el) return false;
    }

    return true;
  };
}

function isFragment(el) {
  return el.nodeType === 11;
}

function hide(el) {
  css(el, {
    display: 'none'
  });
}