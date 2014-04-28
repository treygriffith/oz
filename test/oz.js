
var Oz = require('oz');
var Emitter = require('emitter');
var assert = require('assert');
var trigger = require('trigger-event');
var text = require('text');
var children = require('children');

describe('Rendering', function(){
  it('should set text values', function(){
    var el = children(Oz.render('<div><p oz-text="name"></p></div>', { name: 'Tobi' }))[0];
    assert('Tobi' == text(children(el)[0]));
  });

  it('should set text values in the context of objects', function(){
    var el = children(Oz.render('<div oz="person"><p oz-text="name"></p></div>', { person: { name: 'Tobi' }, name: 'John' }))[0];
    assert('Tobi' == text(children(el)[0]));
  });

  it('should set text values as array elements', function(){
    var el = children(Oz.render('<div oz-each="names"><p oz-text="@"></p></div>', { names: ['Tobi', 'Paul']}));
    assert('Tobi' == text(children(el[0])[0]));
    assert('Paul' == text(children(el[1])[0]));
  });

  it('should use object values as array elements', function(){
    var el = children(Oz.render('<div oz-each="people"><p oz-text="name"></p></div>', { people: [ {name: 'Tobi'}, {name: 'Paul'} ]}));
    assert('Tobi' == text(children(el[0])[0]));
    assert('Paul' == text(children(el[1])[0]));
  });

  it('should hide non-array-like objects that are `each`ed', function(){
    var el = children(Oz.render('<div oz-each="people"><p oz-text="name"></p></div>', {}));
    assert(el[0].style.display === 'none');
  });

  it('should pass through undefined values as contexts', function(){
    var el = children(Oz.render('<div oz-each="people"><p oz-text="@"></p></div>', {people: [undefined, true]}));
    assert(text(children(el[0])[0]) === '');
  });

  it('should not display undefined as a text or form value', function(){
    var els = children(Oz.render('<div oz-text="name"></div><input oz-val="name">', {}));

    assert(text(els[0]) === '');
    assert(els[1].value === '');
  });

  it('should hide elements that have falsey values', function(){
    var el = children(Oz.render('<div oz-if="bool"></div>', { bool: false }));
    assert(el[0].style.display === 'none');
  });

  it('should not change context for bool values', function(){
    var el = children(Oz.render('<div oz-if="bool"><p oz-text="name"></p></div>', { name: 'Tobi', bool: true }));
    assert('Tobi' == text(children(el[0])[0]));
  });

  it('should allow access dot notation for value access', function(){
    var el = children(Oz.render('<div oz-if="names.length"><p oz-text="text"></p></div>', { names: ['Tobi', 'Paul'], text: 'something'}));
    assert('something' == text(children(el[0])[0]));
  });

  it('should not choke on undefined objects', function () {
    var el = children(Oz.render('<div oz-if="names.length"></div>', {}))[0];
    assert(el.style.display === 'none');
  })

  it('should set attributes without changing context', function(){
    var el = children(Oz.render('<div oz-attr="class:name"><p oz-text="text"></p></div>', { name: 'Tobi', text: 'something'}));
    assert('Tobi' == el[0].className);
    assert('something' == text(children(el[0])[0]));
  });

  it('should render multiple attributes in one tag', function(){
    var el = children(Oz.render('<div oz-attr="class:name;data-active:active"></div>', { name: 'Tobi', active: true})); 
    assert('Tobi' == el[0].className);
    assert('true' == el[0].getAttribute('data-active'));
  });

  it('should render multiple top level elements', function(){
    var el = children(Oz.render('<p oz-text="name"></p><p oz-text="text"></p>', { name: 'Tobi', text: 'something'}));
    assert('Tobi' == text(el[0]));
    assert('something' == text(el[1]));
  });

  it('should call functions to get values', function(){
    var el = children(Oz.render('<div oz="person"><p oz-text="name"></p></div>', { person: function () { return { name: 'Tobi' }; }}));
    assert('Tobi' == text(children(el[0])[0]));
  });

  it('should render form values', function(){
    var el = children(Oz.render('<div oz="person"><input type="text" oz-val="name" /></div>', { person: { name: 'Tobi' } }))[0];
    assert('Tobi' == children(el)[0].value);
  });
});

describe("Updating", function() {
  it('should keep the same dom node when updating', function(){
    var template = Oz('<div></div>');

    var el = children(template.render({}))[0];
    var el2 = template.update({})[0];

    assert(el === el2);
  });

  it('should update text values', function(){

    var template = Oz('<div><p oz-text="name"></p></div>');
    var el = children(template.render({ name: 'Tobi' }))[0];

    assert('Tobi' == text(children(el)[0]));

    template.update({ name: 'Brian' });

    assert('Brian' == text(children(el)[0]));
  });

  it('should update text of a nested value', function(){

    var template = Oz('<div oz="person"><p oz-text="name"></p></div>');
    var el = children(template.render({ person: { name: 'Tobi' } }))[0];

    assert('Tobi' == text(children(el)[0]));

    template.update({person: { name: 'Brian' }});

    assert('Brian' == text(children(el)[0]));
  });

  it('should update text values as array elements', function(){

    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var el = children(template.render({ names: ['Tobi', 'Paul']}));
    assert('Tobi' == text(children(el[0])[0]));
    assert('Paul' == text(children(el[1])[0]));

    template.update({names: ['Tobi', 'Brian']});

    assert('Tobi' == text(children(el[0])[0]));
    assert('Brian' == text(children(el[1])[0]));
  });

  it('should add new array elements', function(){
    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var fragment = template.render({ names: ['Tobi', 'Paul']});

    template.update({names: ['Tobi', 'Paul', 'Brian']});

    assert('Brian' == text(children(children(fragment)[2])[0]));
  });

  it('should remove deleted array elements', function(){
    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var fragment = template.render({ names: ['Tobi', 'Paul', 'Brian']});

    template.update({names: ['Tobi', 'Paul']});

    assert(children(fragment)[3] == null);
    assert(text(children(children(fragment)[2])[0]) === '');
  });

  it('should show elements that have truthy values', function(){
    var template = Oz('<div oz-if="bool"></div>');
    var el = children(template.render({ bool: false }));
    assert(el[0].style.display === 'none');

    template.update({bool: true});
    assert(el[0].style.display === '');
  });

  it('should update multiple attributes in one tag', function(){
    var template = Oz('<div oz-attr="class:name;data-active:active"></div>');
    var el = children(template.render({ name: 'Tobi', active: true}));
    assert('Tobi' == el[0].className);
    assert('true' == el[0].getAttribute('data-active'));

    template.update({ name: 'Paul', active: false});
    assert('Paul' == el[0].className);
    assert('false' == el[0].getAttribute('data-active'));
  });

  it('should update form values', function(){

    var template = Oz('<div oz="person"><input type="text" oz-val="name" /></div>');
    var el = children(template.render({ person: { name: 'Tobi' } }))[0];
    assert('Tobi' == children(el)[0].value);

    template.update({ person: { name: 'Brian' } });

    assert('Brian' == children(el)[0].value);
  });

  it('should emit scoped form events', function (next) {
    var template = Oz('<div oz="person"><input oz-val="name"></div>');

    var el = children(children(template.render())[0])[0];

    template.on('change:name', function () {
      assert(false);
    });

    template.on('change:person.name', function () {
      assert(true);
      next();
    });

    el.value = 'Tobi';

    trigger(el, 'change');
  });

  it('should update elements after attaching to the DOM', function(){
    var template = Oz('<div oz="person"><input type="text" oz-val="name" /></div>');
    var fragment = template.render({ person: { name: 'Tobi' } });
    var el = children(fragment)[0];
    assert('Tobi' == children(el)[0].value);

    document.body.appendChild(fragment);

    template.update({ person: { name: 'Brian' } });

    assert('Brian' == children(el)[0].value);
  });
});

describe("Events", function(){
  it('should send a change event when a form value is updated', function(){

  });

  it('should emit events based on DOM events', function(next){
    var template = Oz('<div oz-evt="click:save"></div>');
    var el = children(template.render())[0];

    template.on('save', function (_el) {
      assert(_el === el);
      next();
    });

    // simulate event
    trigger(el, 'click');
    
  });

  it('should pass the current context to the event handler', function(next){
    var template = Oz('<div oz-evt="click:save"></div>');
    var person = { name: 'Tobi' };
    var el = children(template.render(person))[0];

    template.on('save', function (_el, e, ctx) {
      assert(ctx === person);
      next();
    });

    // simulate event
    trigger(el, 'click');
  });

  it('should only execute one event, even after re-rendering', function(next){
    var template = Oz('<div oz-evt="click:save;dblclick:delete"></div>');
    var el = children(template.render())[0];
    template.update();

    var count = 0;

    template.on('save', function () {
      count++;
      assert(count === 1);
    });

    template.on('delete', function(){
      next();
    });

    // simulate event
    trigger(el, 'click');
    trigger(el, 'dblclick');
  });
});
