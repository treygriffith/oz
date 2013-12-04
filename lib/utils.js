// get the value of a property in a context
exports.get = function get(ctx, prop, thisSymbol) {
  var val = ctx;

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) {
      if(!val) return val = null;
      if(typeof val[part] === 'function') val = val[part]();
      else val = val[part];
    }
  });

  return val;
};

// get the textual representation of current scope
exports.getScope = function getScope(scope, prop, thisSymbol) {

  var scopes = [];

  prop.split('.').forEach(function (part) {
    if(part !== thisSymbol) scopes.push(part);
  });

  return scopes.join('.');
};

// split a property into its constituent parts - similar to inline style declarations
exports.propSplit = function propSplit(prop, separator, equals, fn) {
  prop.split(separator).forEach(function (prop) {
    if(!prop) return;

    var parts = prop.split(equals).map(trim);

    fn(parts[0], parts[1]);
  });
};

// convenience trim function
function trim(str) {
  return str.trim();
}