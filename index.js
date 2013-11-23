/**
 * Module dependencies
 */

var dom = require('dom')
  , closest = require('closest')
  , matches = require('matches-selector')
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

  var tagKeys = Object.keys(tags);

  console.log("template", template.get(0));
  console.log("context", ctx);

  if(!template.length()) return template;

  tagKeys.forEach(function (key) {
    var selector = '[' + tags[key].attr + ']';

    console.log(key, findWithSelf(template, selector));
    
    findWithSelf(template, selector).select(filterRoot(tagKeys, template.get(0))).each(function (el) {
      var prop = el.attr(tags[key].attr)
        , val = prop === thisSymbol ? ctx : ctx[prop];

      console.log(key, el, prop, val);

      tags[key].render(el, val, thisSymbol, tags);
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
    render: function (el, val, thisSymbol, tags) {
      if(!val) el.css('display', 'none');

      el.find('*').each(function (list) {
        console.log("val", val);
        render(list, val, thisSymbol, tags);
      });
    }
  },
  bool: {
    attr: 'oz-if',
    render: function (el, val, thisSymbol, tags) {
      if(!val || (Array.isArray(val) && val.length === 0)) el.css('display', 'none');

      el.find('*').each(function (list) {
        render(list, val, thisSymbol, tags);
      });
    }
  },
  array: {
    attr: 'oz-each',
    render: function (el, val, thisSymbol, tags) {
      if(Array.isArray(val) && val.length) {
        // need some way to reference the dup'ed el's so that the other parts can put their shit in
        val.forEach(function (val) {
          var newEl = el.clone();
          newEl.insertAfter(el);

          newEl.find('*').each(function (list) {
            render(list, val, thisSymbol, tags);
          });
        });
      }

      el.remove();
    }
  },
  string: {
    attr: 'oz-text',
    render: function (el, val, thisSymbol, tags) {
      el.text(String(val));

      console.log("rendering ", el.get(0), val);

      el.find('*').each(function (list) {
        render(list, null, thisSymbol, tags);
      });
    }
  }
};

/**
 * Utility functions
 */

function filterRoot(tagKeys, root) {
  return function (el) {
    for(var i=0; i<tagKeys.length; i++) {
      var closestEl = closest(el.get(0), '[' + tags[tagKeys[i]].attr + ']', true, root);

      if(closestEl != null && closestEl !== el.get(0)) return false;
    }

    return true;
  };
}

function findWithSelf(list, selector) {
  var selected = list.find(selector);

  if(matches(list.get(0), selector)) {

    // transform dom list to an array of nodes
    selected = selected.map(function (el) {
      return el.get(0);
    });

    // create a new dom list from the combination of the old array and the self node
    selected = dom(selected.concat(list.get(0)));
  }
  
  return selected;
}