/**
 * Module dependencies
 */

var dom = require('dom')
  , closest = require('closest')
  , children = require('children')
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

  var tagKeys = Object.keys(tags)
    , tmp
    , ret;

  if(!template.length()) return template;

  tmp = wrap(template);

  tagKeys.forEach(function (key) {
    var selector = '[' + tags[key].attr + ']';
    
    findWithSelf(template, selector).select(filterRoot(tagKeys, template.get(0))).each(function (el) {
      var prop = el.attr(tags[key].attr)
        , val = prop === thisSymbol ? ctx : ctx[prop];

      tags[key].render(el, val, thisSymbol, tags);
    });
  });

  console.log(tmp.html());

  return unwrap(tmp);
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
      var newEl;

      if(val.length) {

        for(var i=0; i<val.length; i++) {
          newEl = el.clone();

          // insert the new one above the old one
          // this preserves the ordering of the array
          el.get(0).parentNode.insertBefore(newEl.get(0), el.get(0));

          newEl.find('*').each(function (list) {
            render(list, val[i], thisSymbol, tags);
          });
        }
      }

      // remove template element
      el.remove();
    }
  },
  string: {
    attr: 'oz-text',
    render: function (el, val, thisSymbol, tags) {
      el.text(String(val));

      el.find('*').each(function (list) {
        render(list, null, thisSymbol, tags);
      });
    }
  }
};

/**
 * Utility functions
 */

// wrap the template in a temporary div so we can capture created elements (from arrays)
function wrap(template) {
  var tmp = dom("<div></div>");

  // put the tmp div in the templates place as a placeholder
  if(closest(template.get(0), '*')) {
    dom(closest(template.get(0), '*')).append(tmp);
  }

  tmp.append(template);

  return tmp;
}

// remove the temporary div and put the rendered elements back in their correct place
function unwrap(tmp) {
  var ret = children(tmp.get(0));

  if(closest(tmp.get(0), '*')) {
    dom(closest(tmp.get(0), '*')).append(ret);
  }

  tmp.remove();

  return ret;
}

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