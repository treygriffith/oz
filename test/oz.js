
var Oz = require('oz');
var assert = require('assert');
var text = require('text');
var children = require('children');

describe('Plugins', function(){
  it('should add tags to the instance');
  it('should add tags to all new instances');
});

describe('Rendering', function(){

  it('should allow access to the actual DOM node', function (){
    var template = Oz('<div oz-node="name"></div>');

    var node;

    template.tag('oz-node', function (el, ctx, prop, scope) {
      node = el;
    });

    var fragment = template.render();

    assert(children(fragment)[0] === node);
  });

  it('should use @ to access the current context', function(){
    var template = Oz('<div oz-this="@"></div>');

    template.tag('oz-this', function (el, ctx, prop, scope) {
      assert(ctx === this.get(ctx, prop));
    });

    template.render({});
  });

  it('should pass through undefined values as contexts', function(){
    var template = Oz('<div oz-undefined="name"></div>');

    template.tag('oz-undefined', function (el, ctx, prop, scope) {
      assert(undefined == ctx);
      assert(undefined == this.get(ctx, prop));
    });

    template.render();
  });

  it('should allow access dot notation for value access', function(){
    var template = Oz('<div oz-dot="names.length"></div>');

    template.tag('oz-dot', function (el, ctx, prop, scope) {
      assert(2 === this.get(ctx, prop));
    });

    template.render({ names: ['Tobi', 'Paul'], text: 'something'});
  });

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

  it('should render multiple top level elements', function(){
    var template = Oz('<p oz-top1="name"></p><p oz-top2="text"></p>');

    var node1, node2;

    template.tag('oz-top1', function (el, ctx, prop, scope) {
      var val = this.get(ctx, prop);

      node1 = el;

      assert(val === 'Tobi');
    });

    template.tag('oz-top2', function (el, ctx, prop, scope) {
      var val = this.get(ctx, prop);

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

    template.tag('oz-fn', function (el, ctx, prop, scope) {
      var val = this.get(ctx, prop);

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

    template.tag('oz-ctx', function (el, ctx, prop, scope) {
      var val = this.get(ctx, prop);

      return {
        scope: this.scope(scope, prop),
        ctx: val
      };
    });

    template.tag('oz-test', function (el, ctx, prop, scope) {

      assert(ctx === person);
      assert(scope === 'person');
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

    template.tag('oz-text', function (el, ctx, prop, scope) {
      text(el, this.get(ctx, prop));
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
    var name = 'Brian';

    template.tag('oz-change', function (el, ctx, prop, scope) {
      var self = this;
      setTimeout(function () {
        self.change(self.scope(scope, prop), name);
      }, 0);
    });

    var changeDone = false;
    var changeScopedDone = false;

    template.on('change', function (scope, val) {
      assert(scope === 'person.name');
      assert(val === name);

      changeDone = true;

      if(changeDone && changeScopedDone) {
        done();
      }
    });

    template.on('change:person.name', function (val) {
      assert(val === name);

      changeScopedDone = true;

      if(changeDone && changeScopedDone) {
        done();
      }
    });

    template.render();
  });

});
