
var Oz = require('oz');
var Emitter = require('emitter');
var assert = require('assert');
var trigger = require('trigger-event');

describe('Rendering', function(){
  it('should set text values', function(){
    var el = Oz.render('<div><p oz-text="name"></p></div>', { name: 'Tobi' }).children[0];
    assert('Tobi' == el.children[0].textContent);
  });

  it('should set text values in the context of objects', function(){
    var el = Oz.render('<div oz="person"><p oz-text="name"></p></div>', { person: { name: 'Tobi' }, name: 'John' }).children[0];
    assert('Tobi' == el.children[0].textContent);
  });

  it('should set text values as array elements', function(){
    var el = Oz.render('<div oz-each="names"><p oz-text="@"></p></div>', { names: ['Tobi', 'Paul']}).children;
    assert('Tobi' == el[0].children[0].textContent);
    assert('Paul' == el[1].children[0].textContent);
  });

  it('should use object values as array elements', function(){
    var el = Oz.render('<div oz-each="people"><p oz-text="name"></p></div>', { people: [ {name: 'Tobi'}, {name: 'Paul'} ]}).children;
    assert('Tobi' == el[0].children[0].textContent);
    assert('Paul' == el[1].children[0].textContent);
  });

  it('should hide non-array-like objects that are `each`ed', function(){
    var el = Oz.render('<div oz-each="people"><p oz-text="name"></p></div>', {}).children;
    assert(el[0].style.display === 'none');
  });

  it('should pass through undefined values as contexts', function(){
    var el = Oz.render('<div oz-each="people"><p oz-text="@"></p></div>', {people: [undefined, true]}).children;
    console.log(el[0]);
    assert(el[0].children[0].textContent === '');
  });

  it('should hide elements that have falsey values', function(){
    var el = Oz.render('<div oz-if="bool"></div>', { bool: false }).children;
    assert(el[0].style.display === 'none');
  });

  it('should not change context for bool values', function(){
    var el = Oz.render('<div oz-if="bool"><p oz-text="name"></p></div>', { name: 'Tobi', bool: true }).children;
    assert('Tobi' == el[0].children[0].textContent);
  });

  it('should allow access dot notation for value access', function(){
    var el = Oz.render('<div oz-if="names.length"><p oz-text="text"></p></div>', { names: ['Tobi', 'Paul'], text: 'something'}).children;
    assert('something' == el[0].children[0].textContent);
  });

  it('should not choke on undefined objects', function () {
    var el = Oz.render('<div oz-if="names.length"></div>', {}).children[0];
    assert(el.style.display === 'none');
  })

  it('should set attributes without changing context', function(){
    var el = Oz.render('<div oz-attr="class:name"><p oz-text="text"></p></div>', { name: 'Tobi', text: 'something'}).children;
    assert('Tobi' == el[0].className);
    assert('something' == el[0].children[0].textContent);
  });

  it('should render multiple attributes in one tag', function(){
    var el = Oz.render('<div oz-attr="class:name;data-active:active"></div>', { name: 'Tobi', active: true}).children; 
    assert('Tobi' == el[0].className);
    assert('true' == el[0].getAttribute('data-active'));
  });

  it('should render multiple top level elements', function(){
    var el = Oz.render('<p oz-text="name"></p><p oz-text="text"></p>', { name: 'Tobi', text: 'something'}).children;
    assert('Tobi' == el[0].textContent);
    assert('something' == el[1].textContent);
  });

  it('should call functions to get values', function(){
    var el = Oz.render('<div oz="person"><p oz-text="name"></p></div>', { person: function () { return { name: 'Tobi' }; }}).children;
    assert('Tobi' == el[0].children[0].textContent);
  });

  it('should render form values', function(){
    var el = Oz.render('<div oz="person"><input type="text" oz-val="name" /></div>', { person: { name: 'Tobi' } }).children[0];
    assert('Tobi' == el.children[0].value);
  });
});

describe("Updating", function() {
  it('should keep the same dom node when updating', function(){
    var template = Oz('<div></div>');

    var el = template.render({}).children[0];
    var el2 = template.update({})[0];

    assert(el === el2);
  });

  it('should update text values', function(){

    var template = Oz('<div><p oz-text="name"></p></div>');
    var el = template.render({ name: 'Tobi' }).children[0];

    assert('Tobi' == el.children[0].textContent);

    template.update({ name: 'Brian' });

    assert('Brian' == el.children[0].textContent);
  });

  it('should update text of a nested value', function(){

    var template = Oz('<div oz="person"><p oz-text="name"></p></div>');
    var el = template.render({ person: { name: 'Tobi' } }).children[0];

    assert('Tobi' == el.children[0].textContent);

    template.update({person: { name: 'Brian' }});

    assert('Brian' == el.children[0].textContent);
  });

  it('should update text values as array elements', function(){

    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var el = template.render({ names: ['Tobi', 'Paul']}).children;
    assert('Tobi' == el[0].children[0].textContent);
    assert('Paul' == el[1].children[0].textContent);

    template.update({names: ['Tobi', 'Brian']});

    assert('Tobi' == el[0].children[0].textContent);
    assert('Brian' == el[1].children[0].textContent);
  });

  it('should add new array elements', function(){
    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var el = template.render({ names: ['Tobi', 'Paul']}).children;

    template.update({names: ['Tobi', 'Paul', 'Brian']});

    assert('Brian' == el[2].children[0].textContent);
  });

  it('should remove deleted array elements', function(){
    var template = Oz('<div oz-each="names"><p oz-text="@"></p></div>');
    var el = template.render({ names: ['Tobi', 'Paul', 'Brian']}).children;

    template.update({names: ['Tobi', 'Paul']});

    assert(el[3] == null);
    assert(el[2].children[0].textContent === '');
  });

  it('should show elements that have truthy values', function(){
    var template = Oz('<div oz-if="bool"></div>');
    var el = template.render({ bool: false }).children;
    assert(el[0].style.display === 'none');

    template.update({bool: true});
    assert(el[0].style.display === '');
  });

  it('should update multiple attributes in one tag', function(){
    var template = Oz('<div oz-attr="class:name;data-active:active"></div>');
    var el = template.render({ name: 'Tobi', active: true}).children;
    assert('Tobi' == el[0].className);
    assert('true' == el[0].getAttribute('data-active'));

    template.update({ name: 'Paul', active: false});
    assert('Paul' == el[0].className);
    assert('false' == el[0].getAttribute('data-active'));
  });

  it('should update form values', function(){

    var template = Oz('<div oz="person"><input type="text" oz-val="name" /></div>');
    var el = template.render({ person: { name: 'Tobi' } }).children[0];
    assert('Tobi' == el.children[0].value);

    template.update({ person: { name: 'Brian' } });

    assert('Brian' == el.children[0].value);
  });

  it('should update elements after attaching to the DOM', function(){
    var template = Oz('<div oz="person"><input type="text" oz-val="name" /></div>');
    var fragment = template.render({ person: { name: 'Tobi' } });
    var el = fragment.children[0];
    assert('Tobi' == el.children[0].value);

    document.body.appendChild(fragment);

    template.update({ person: { name: 'Brian' } });

    assert('Brian' == el.children[0].value);
  });
});

describe("Events", function(){
  it('should send a change event when a form value is updated', function(){

  });

  it('should emit events based on DOM events', function(next){
    var template = Oz('<div oz-evt="click:save"></div>');
    var el = template.render().children[0];

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
    var el = template.render(person).children[0];

    template.on('save', function (_el, e, ctx) {
      assert(ctx === person);
      next();
    });

    // simulate event
    trigger(el, 'click');
  });

  it('should only execute one event, even after re-rendering', function(next){
    var template = Oz('<div oz-evt="click:save;dblclick:delete"></div>');
    var el = template.render().children[0];
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