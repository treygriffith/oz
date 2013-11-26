
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
    var el2 = template.update({}).children[0];

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
      console.log("save called");
      assert(count === 1);
    });

    template.on('delete', function(){
      next();
    });

    // simulate event
    trigger(el, 'click');
    trigger(el, 'delete');
  });
});

/*
describe('Oz.render(template, context)', function(){
  it('should set values on render', function(){
    var el = Oz.render('<div><p oz-text="name"></p></div>', { name: 'Tobi' });
    assert('Tobi' == el.get(0).children[0].textContent);
  })

  it('should work with multiple bindings', function(){
    var el = domify('<div><span data-text="first"></span><span data-text="last"></span></div>');
    var user = { first: 'Tobi', last: 'Ferret' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
    assert('Ferret' == el.children[1].textContent);
  })

  it('should support getter methods', function(){
    var el = domify('<div><p data-text="first"></p></div>');

    var user = {
      _first: 'Tobi',
      first: function(){ return this._first }
    };

    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);
  });

  it('should support computed values on views', function(){
    var el = domify('<div><p data-text="name"></p></div>');

    var user = {
      first: 'Tobi',
      last: 'Ferret'
    };

    var view = reactive(el, user, {
      name: function(){
        return user.first + ' ' + user.last
      }
    });

    assert('Tobi Ferret' == el.children[0].textContent);
  })

  // it('should support the root element', function(){
  //   var el = domify('<p data-text="name"></p>')[0];
  //   var user = { name: 'Tobi' };
  //   reactive(el, user);
  //   console.log(el);
  //   assert('Tobi' == el.textContent);
  // })
})

describe('on "change <name>"', function(){
  it('should update bindings', function(){
    var el = domify('<div><p data-text="name"></p></div>');

    function User(name) {
      this.name = name;
    }

    Emitter(User.prototype);

    var user = new User('Tobi');
    var view = reactive(el, user);

    assert('Tobi' == el.children[0].textContent);

    user.name = 'Loki';
    user.emit('change name');
    assert('Loki' == el.children[0].textContent);
  })
})

describe('data-text', function(){
  it('should set element text', function(){
    var el = domify('<div><p data-text="name"></p></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].textContent);
  })

  it('should support formatters', function(){
    var el = domify('<div><p data-text="created_at | date:\'%Y/%M/%d\'"></p></div>');
    var now = new Date;
    var user = { created_at: now };

    var view = reactive(el, user, {
      date: function(date, fmt){
        assert(now == date);
        assert(fmt == '%Y/%M/%d');
        return 'formatted date';
      }
    });

    assert('formatted date' == el.children[0].textContent);
  })
})

describe('data-html', function(){
  it('should set element html', function(){
    var el = domify('<div><p data-html="name"></p></div>');
    var user = { name: '<strong>Tobi</strong>' };
    var view = reactive(el, user);
    assert('<strong>Tobi</strong>' == el.children[0].innerHTML);
  })

  it('should support computed values', function(){
    var el = domify('<div><ul data-html="fruits"></ul></div>');
    var user = { diet : [ 'apples', 'pears', 'oranges' ] };
    var view = reactive(el, user, {
      fruits : function(fruits) {
        var html = user.diet.map(function(food) { return '<li>' + food + '</li>'; });
        return html.join('');
      }
    });

    var items = el.querySelectorAll('li');
    assert(3 == items.length);
    for (var i = 0, len = items.length; i < len; i++) {
      assert(user.diet[i] == items[i].textContent);
    }
  })
})

describe('data-visible', function(){
  it('should add .visible when truthy', function(){
    var el = domify('<div><p data-visible="file">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('visible' == el.children[0].className);
  })

  it('should remove .hidden when truthy', function(){
    var el = domify('<div><p data-visible="file" class="file hidden">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file visible' == el.children[0].className);
  })
})

describe('data-hidden', function(){
  it('should add .hidden when truthy', function(){
    var el = domify('<div><p data-hidden="file">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('hidden' == el.children[0].className);
  })

  it('should remove .visible when truthy', function(){
    var el = domify('<div><p data-hidden="file" class="file visible">Has a file</p></div>');
    var item = { file: 'some.png' };
    var view = reactive(el, item);
    assert('file hidden' == el.children[0].className);
  })
})

describe('data-checked', function(){
  it('should check when truthy', function(){
    var el = domify('<div><input data-checked="agree" /></div>');
    var user = { agree: true };
    var view = reactive(el, user);
    assert('checked' == el.children[0].getAttribute('checked'));
  })

  it('should uncheck when falsey', function(){
    var el = domify('<div><input data-checked="agree" /></div>');
    var user = { agree: false };
    var view = reactive(el, user);
    assert(null == el.children[0].getAttribute('checked'));
  })
})

describe('data-append', function(){
  it('should append an element', function(){
    var li = domify('<li>li</li>');
    var el = domify('<div><ul data-append="msg"></ul></div>');
    var view = reactive(el, {}, { msg: li });
    assert(li == el.children[0].children[0]);
  })
})

describe('data-replace', function(){
  it('should replace an element', function(){
    var canvas = document.createElement('canvas');
    var el = domify('<div><div data-replace="canvas"></div></div>');
    var view = reactive(el, {}, { canvas: canvas });
    assert(canvas == el.children[0]);
  })

  it('should carryover attributes', function(){
    var input = document.createElement('input');
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { input: input });
    assert('email' == input.type);
  })

  it('shouldnt wipe out existing attributes', function(){
    var input = document.createElement('input');
    input.type = 'url'
    var el = domify('<div><div type="email" data-replace="input"></div>');
    var view = reactive(el, {}, { input: input });
    assert('url' == input.type);
  })

  it('should carryover classes', function(){
    var toggle = document.createElement('toggle');
    toggle.className = 'toggle';
    var el = domify('<div><div class="integration-toggle" data-replace="toggle"></div></div>');
    var view = reactive(el, {}, { toggle: toggle });
    assert('toggle integration-toggle' == toggle.className);
  })
})

describe('data-[attr]', function(){
  it('should set attribute value', function(){
    var el = domify('<div><input type="text" data-value="name" /></div>');
    var user = { name: 'Tobi' };
    var view = reactive(el, user);
    assert('Tobi' == el.children[0].value);
  })

  it('should support formatters', function(){
    var el = domify('<div><a data-href="url | proxied" data-text="url"></a></div>');
    var now = new Date;
    var link = { url: 'http://google.com' };

    var view = reactive(el, link, {
      proxied: function(url){
        return '/link/' + encodeURIComponent(url);
      }
    });

    var url = encodeURIComponent(link.url);
    assert('/link/' + url == el.children[0].getAttribute('href'));
    assert(link.url == el.children[0].textContent);
  })

  it('should update bindings with formatters', function(){
    var el = domify('<div><p data-text="name | toUpper"></p></div>');

    function User(name) {
      this.name = name;
    }

    Emitter(User.prototype);

    var user = new User('Tobi');
    var view = reactive(el, user, {
      toUpper: function(text) {
        return text.toUpperCase();
      }
    });

    assert('TOBI' == el.children[0].textContent);

    user.name = 'Loki';
    user.emit('change name');
    assert('LOKI' == el.children[0].textContent);
  })
})*/
