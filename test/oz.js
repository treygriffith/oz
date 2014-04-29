
var Oz = require('oz');
var assert = require('assert');
var text = require('text');
var children = require('children');

describe('Plugins', function(){

  it('should add tags to the instance', function (){
    var template = Oz('<div></div>');

    var render = function () {};
    template.tag('oz-tag', render);

    assert(template.tags['oz-tag'] === render);
  });

  it('should add tags to all new instances', function (){
    var render = function () {};

    Oz.tag('oz-universal', render);

    var template = Oz('<div></div>');

    assert(template.tags['oz-universal'] === render);
  });
});

describe('Rendering', function(){

  it('should allow access to the actual DOM node', function (){
    var template = Oz('<div oz-node="name"></div>');

    var node;

    template.tag('oz-node', function (el, val) {
      node = el;
    });

    var fragment = template.render();

    assert(children(fragment)[0] === node);
  });

  it('should use @ to access the current context', function(){
    var template = Oz('<div oz-this="@"></div>');

    template.tag('oz-this', function (el, val, scope, raw) {
      assert(raw.ctx === val);
    });

    template.render({});
  });

  it('should pass through undefined values as contexts', function(){
    var template = Oz('<div oz-undefined="name"></div>');

    template.tag('oz-undefined', function (el, val, scope, raw) {
      assert(undefined == raw.ctx);
      assert(undefined == val);
    });

    template.render();
  });

  it('should allow access dot notation for value access', function(){
    var template = Oz('<div oz-dot="names.length"></div>');

    template.tag('oz-dot', function (el, val) {
      assert(2 === val);
    });

    template.render({ names: ['Tobi', 'Paul'], text: 'something'});
  });

  /*
  it('should render multiple props in one tag', function(){
    var template = Oz('<div oz-multiprops="prop1:name;prop2:active"></div>');

    var context = { name: 'Tobi', active: true };

    template.tag('oz-multiprops', function (el, ctx, prop, scope) {
      var self = this;

      this.split(prop, function (name, val) {
        val = val != null ? self.get(ctx, val) : null;

        if(name === 'prop1') {
          assert(val === context.name);
        } else {
          assert(val === context.active);
        }
      });

    });

    template.render(context);
  });
  */

  it('should render multiple tags in one element', function(){
    var template = Oz('<div oz-multitags="name" oz-multitags2="active"></div>');

    var context = { name: 'Tobi', active: true };

    template.tag('oz-multitags', function (el, val, scope) {
      var self = this;

      assert(val === context.name);

    });

    template.tag('oz-multitags2', function (el, val, scope) {
      var self = this;

      assert(val === context.active);

    });

    template.render(context);
  });

  it('should render multiple top level elements', function(){
    var template = Oz('<p oz-top1="name"></p><p oz-top2="text"></p>');

    var node1, node2;

    template.tag('oz-top1', function (el, val) {
      node1 = el;

      assert(val === 'Tobi');
    });

    template.tag('oz-top2', function (el, val) {
      node2 = el;

      assert(val === 'something');
    });

    var els = template.render({ name: 'Tobi', text: 'something'});

    assert(node1 === children(els)[0]);
    assert(node2 === children(els)[1]);
  });

  it('should call functions to get values', function(){
    var template = Oz('<div oz-fn="person"></div>');

    var person = { name: 'Tobi' };

    template.tag('oz-fn', function (el, val) {

      assert(val === person);

    });

    template.render({ person: function () { return person; }});
  });

  it('should allow tags to change context for children', function(){
    var template = Oz('<div oz-ctx="person"><div oz-test="name"></div></div>');

    var person = { name: 'Tobi' };
    var ctx = {
      person: person
    };

    template.tag('oz-ctx', function (el, val, scope) {

      return scope;
    });

    template.tag('oz-test', function (el, val) {
      assert(val === person.name);
    });

  });

});

describe("Updating", function() {
  it('should keep the same dom node when updating', function(){
    var template = Oz('<div></div>');

    var el = children(template.render({}))[0];
    var el2 = template.update({})[0];

    assert(el === el2);
  });

  it('should update elements after attaching to the DOM', function(){
    var template = Oz('<div oz-text="name"></div>');

    template.tag('oz-text', function (el, val) {
      text(el, val);
    });

    var fragment = template.render({ name: 'Tobi' });
    var el = children(fragment)[0];
    assert('Tobi' == text(el));

    document.body.appendChild(fragment);

    template.update({ name: 'Brian' });

    assert('Brian' == text(el));
  });
});

describe("Events", function(){
  it('should send a change event to the template', function(done){

    var template = Oz('<div oz-change="person.name"></div>');
    var person = {
      name: 'Brian'
    };

    template.tag('oz-change', function (el, val, scope) {
      var self = this;
      setTimeout(function () {
        self.change(scope, val);
      }, 0);
    });

    var changeDone = false;
    var changeScopedDone = false;

    template.on('change', function (scope, val) {
      assert(scope === 'person.name');
      assert(val === person.name);

      changeDone = true;

      if(changeDone && changeScopedDone) {
        done();
      }
    });

    template.on('change:person.name', function (val) {
      assert(val === person.name);

      changeScopedDone = true;

      if(changeDone && changeScopedDone) {
        done();
      }
    });

    template.render({ person: person });
  });

});
