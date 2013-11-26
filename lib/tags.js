/**
 * Module dependencies
 */

var attr = require('attr')
  , text = require('text')
  , value = require('value')
  , css = require('css')
  , events = require('event')
  , matches = require('matches-selector')
  , children = require('children')
  , siblings = require('siblings');

/**
 * Default template options
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
    render: function (el, ctx, prop, scope) {

      var self = this;

      propSplit(prop, this.separator, this.equals, function (name, val) {
        val = val != null ? get(ctx, val, self.thisSymbol) : null;

        if(attr(el).get(name) !== val) attr(el).set(name, val);
      });

      children(el).forEach(function (child) {
        self._render(child, ctx, scope);
      });
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
    render: function (el, ctx, prop, scope) {
      var val = get(ctx, prop, this.thisSymbol)
        , scope = getScope(scope, prop, this.thisSymbol)
        , self = this;

      show(el);
      if(!val) hide(el);

      children(el).forEach(function (child) {
        self._render(child, val, scope, true);
      });
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
    render: function (el, ctx, prop, scope) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      show(el);
      if(!val || (Array.isArray(val) && val.length === 0)) hide(el);

      children(el).forEach(function (child) {
        self._render(child, ctx, scope);
      });
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
    render: function (el, ctx, prop, scope) {
      var newEl
        , existing = {}
        , after
        , val = get(ctx, prop, this.thisSymbol)
        , self = this;

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

        children(newEl).forEach(function (child) {
          self._render(child, val[i], getScope(scope, prop + '.' + i, self.thisSymbol), true);
        });
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
    render: function (el, ctx, prop, scope) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      text(el, String(val));

      children(el).forEach(function (child) {
        self._render(child, ctx, scope);
      });
    }
  },

  /**
   * Bind form values to context
   * template: <input type="text" oz-val="person.name">
   * context: { person: { name: 'Tobi' } }
   * output: <input type="text" value="Tobi">
   * template.on('change:person.name', fn); // fired when <input> is changed
   */
  value: {
    attr: 'oz-val',
    render: function (el, ctx, prop, scope) {
      var val = get(ctx, prop, this.thisSymbol)
        , self = this;

      // set form value
      value(el, val);

      // listen for changes to values
      onChange(el, function (val) {
        self._change(getScope(scope, prop, self.thisSymbol), val);
      });

      children(el).forEach(function (child) {
        self._render(child, ctx, scope);
      });
    }
  },

  /**
   * Listen for DOM events
   * template: <div oz-evt="click:save"></div>
   * output: template.on('save', fn); // fired when <div> is clicked
   */
  event: {
    attr: 'oz-evt',
    render: function (el, ctx, prop, scope) {
      var self = this;

      propSplit(prop, this.separator, this.equals, function (name, val) {

        // TODO: unbind old events when re-rendered - but only for this particular listener
        events.bind(el, name, function (e) {
          self.emit(val, el, e, ctx);
        });
      });

      children(el).forEach(function (child) {
        self._render(child, ctx, scope);
      });
    }
  }

};


/**
 * Utility functions
 */

// get the value of a property in a context
function get(ctx, prop, thisSymbol) {
  var val = ctx;

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) {
      if(typeof val[part] === 'function') val = val[part]();
      else val = val[part];
    }
  });

  return val;
}

// get the textual representation of current scope
function getScope(scope, prop, thisSymbol) {

  var scopes = [];

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) scopes.push(part);
  });

  return scopes.join('.');
}

// split a property into its constituent parts - similar to inline style declarations
function propSplit(prop, separator, equals, fn) {
  prop.split(separator).forEach(function (prop) {
    if(!prop) return;

    var parts = prop.split(equals).map(trim);

    fn(parts[0], parts[1]);
  });
}

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

function trim(str) {
  return str.trim();
}

function onChange(el, fn) {

  var val = value(el);

  function changed(e) {
    if(value(el) !== val) fn(value(el));
    val = value(el);
  }

  events.bind(el, 'click', changed);
  events.bind(el, 'change', changed);
  events.bind(el, 'keyup', changed);
}