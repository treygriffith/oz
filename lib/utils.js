var css = require('css');

// get the value of a property in a context
exports.get = function get(ctx, prop) {
  var val = ctx;

  prop.split('.').forEach(function (part) {
    if(part !== this.thisSymbol) {
      if(!val) return val = null;
      if(typeof val[part] === 'function') val = val[part]();
      else val = val[part];
    }
  });

  return val;
};

// get the textual representation of current scope
exports.scope = function (scope, prop) {

  var scopes = [];

  ((scope || this.thisSymbol) + "." + prop).split('.').forEach(function (part) {
    if(part !== this.thisSymbol) scopes.push(part);
  });

  return scopes.join('.');
};

// split a property into its constituent parts - similar to inline style declarations
exports.split = function (prop, fn) {
  prop.split(this.separator).forEach(function (prop) {
    if(!prop) return;

    var parts = prop.split(this.equals).map(trim);

    fn(parts[0], parts[1]);
  });
};

// hide element
exports.hide = function (el) {
  css(el, 'display', 'none');
};

// unhide element (does not guarantee that it will be shown, just that it won't be hidden at this level)
exports.show = function (el) {
  css(el, 'display', '');
};

// convenience trim function
function trim(str) {
  return str.trim();
}

