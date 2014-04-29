/**
 * Dependencies
 */
var css = require('css');

// get the value of a property in a context
exports.get = function get(ctx, prop) {
  var val = ctx
    , thisSymbol = this.thisSymbol;

  // dot notation access, cycle through the prop names, updating
  // val as it goes.
  prop.split('.').forEach(function (part) {
    // don't change context for thisSymbol
    if(part !== thisSymbol) {

      if(!val) return val = null; // yes, an assignment

      if(typeof val[part] === 'function') {
        // call functions to get values
        val = val[part]();
      } else {
        // regular object property access
        val = val[part];
      }
    }
  });

  return val;
};

// get the textual representation of current scope
exports.scope = function (scope, prop) {

  var scopes = []
    , thisSymbol = this.thisSymbol;

  // create a scope tree in an array, excluding thisSymbol
  ((scope || thisSymbol) + "." + prop).split('.').forEach(function (part) {
    if(part !== thisSymbol) scopes.push(part);
  });

  // dot notation string form of scope tree
  return scopes.join('.');
};

// hide element
exports.hide = function (el) {
  css(el, 'display', 'none');
};

// unhide element (does not guarantee that it will be shown, just that it won't be hidden at this level)
exports.show = function (el) {
  css(el, 'display', '');
};
