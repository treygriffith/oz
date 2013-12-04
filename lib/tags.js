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