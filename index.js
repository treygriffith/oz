/**
 * Module dependencies
 */

var dom = require('dom')
  , closest = require('closest')
  , clone = require('clone');

/**
 * Exports
 */

module.exports = Oz;

/**
 * Template constructor
 */

function Oz(template) {
  if(!(this instanceof Oz)) return new Oz(template);
  this.thisSymbol = '@';
  this.template = dom(template);
  this.tags = clone(tags);
}

/**
 * Template render
 */

Oz.prototype.render = function (ctx) {
  return render(this.template.clone(), ctx, this.thisSymbol, this.tags);
};

/**
 * Convenience function
 */

Oz.render = function (template, ctx) {
  var t = new Oz(template);

  return t.render(ctx);
};

/**
 * Iterative Rendering function
 */

function render(template, ctx, thisSymbol, tags) {
  ctx = ctx || {};

  Object.keys(tags).forEach(function (key) {
    template.find('[' + tags[key].attr + ']').select(filterRoot).each(function (el) {
      var prop = el.attr(tags[key].attr)
        , val = prop === thisSymbol ? ctx : ctx[prop];

      tags[key].render(el, val);
    });
  });

  return template;
}

/**
 * Default template options
 */

var tags = {
  object: {
    attr: 'oz',
    render: function (el, val) {
      if(!val) el.css('display', 'none');

      render(el, val);
    }
  },
  bool: {
    attr: 'oz-if',
    render: function (el, val) {
      if(!val || (Array.isArray(val) && val.length === 0)) el.css('display', 'none');

      render(el, val);
    }
  },
  array: {
    attr: 'oz-each',
    render: function (el, val) {
      if(Array.isArray(val) && val.length) {
        // need some way to reference the dup'ed el's so that the other parts can put their shit in
        val.forEach(function (val) {
          var newEl = el.clone();
          newEl.insertAfter(el);
          render(newEl, val);
        });
      }

      el.remove();
    }
  },
  string: {
    attr: 'oz-text',
    render: function (el, val) {
      el.text(String(val));

      render(el);
    }
  }
};

/**
 * Utility functions
 */

function filterRoot(el) {
  for(var i=0; i<tagKeys.length; i++) {
    if(closest(el.get(0), '[' + tags[tagKeys[i]] + ']') !== null) return false;
  }

  return true;
}