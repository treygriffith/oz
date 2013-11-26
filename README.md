Oz.js
=====
Oz.js is a lightweight*, simple, declarative templating method with built-in events, two-way bindings, and efficient rendering.

It is built on a philosophy of:

1. taking advantage of the DOM instead of string manipulation
2. making the minimum amount of DOM changes as possible to increase rendering speed
3. not adding template-specific DOM nodes to the DOM tree
4. being completely agnostic to any other part of the application (i.e. modeling, routing, etc)
5. letting the application never touch the DOM

* Oz.js is 24 KB when uglified, and 6 KB gzipped, including all dependencies.

Installation
------------
Using [component](http://github.com/component):

    $ component install treygriffith/events

As a standalone (using the scripts in `dist/`):

    <script src="oz.js"></script>


Usage
-----

### Creating a template
To create a template, simply call the `Oz` constructor function on a string of HTML text or directly on a DOM node (it will be cloned for rendering)

```javascript
var template = Oz('<div></div>');
```

### Rendering a template
To render a template, just call the returned Oz instance's `render` method with the rendering context. This will return a `documentFragment` that can be appended to the DOM.
  
```javascript
var fragment = template.render();
document.body.appendChild(fragment);
```

There is also a convenience method attached to the Oz constructor to build and render the template in a single call:

```javascript
Oz.render('<div></div>');
```

### Oz Tags
The neat parts of Oz are in the tags that you add as HTML attributes. You can very easily add your own tags, but Oz comes with tags that should satisfy most templating needs.

  * __Object__

    Notation: `<div oz="person"></div>`

    Usage: All child nodes will be rendered within the context of `person`

    Example:

      ```javascript
      var context = {
        person: {
          name: 'Tobi'
        }
      };
      ```

      ```html
      <div oz="person">
        <span oz-text="name">Tobi</span>
      </div>
      ```
  * __Array__

    Notation: `<div oz-each="people"></div>`

    Usage: This node will be replicated for each element in `people`, and child nodes will be namespaced to that element

    Example:

      ```javascript
      var context = {
        people: [
          'Tobi',
          'Brian'
        ]
      };
      ```

      ```html
      <div oz-each="people" oz-each-index="0">
        <span oz-text="@">Tobi</span>
      </div>
      <div oz-each="people" oz-each-index="1">
        <span oz-text="@">Brian</span>
      </div>
      ```
  * __Boolean__

    Notation: `<div oz-if="person.active"></div>`

    Usage: This node will be hidden if the property is falsey, or not if it's truthy. Does not change context for child nodes.

    Example:

      ```javascript
      var context = {
        person: {
          name: 'Tobi',
          active: true
        }
      };
      ```

      ```html
      <div oz-if="person.active">
        <span oz-text="person.name">Tobi</span>
      </div>
      ```
  * __String__

    Notation: `<div oz-text="name"></div>`

    Usage: Adds a text node to the current node with the string content of the named property

    Example:

      ```javascript
      var context = {
        name: 'Tobi'
      };
      ```

      ```html
      <span oz-text="name">Tobi</span>
      ```
  * __Attribute__

    Notation: `<img oz-attr="src:imageUrl">`

    Usage: Bind an attribute's value to the value of the named property

    Example:

      ```javascript
      var context = {
        imageUrl: "https://www.google.com/images/srpr/logo11w.png"
      };
      ```

      ```html
      <img oz-attr="src:imageUrl" src="https://www.google.com/images/srpr/logo11w.png">
      ```
  * __Form Value__

    Notation: `<input oz-val="name">`

    Usage: Bind a form element's value to a template property. See [Two-way Bindings](#two-way-bindings) for information on how to update the data model with data from the template.

    Example: 

      ```javascript
      var context = {
        name: "Tobi"
      };
      ```

      ```html
      <input oz-val="name" value="Tobi">
      ```
  * __Event__

    Notation: `<button oz-evt="click:save">Save</button>`

    Usage: Trigger an event on the template when an event occurs in the DOM. See [Events](#events) for more information.

    Example:

      ```javascript
      template.on('save', saveHandler);
      ```

      ```html
      <button oz-evt="click:save">Save</button>
      ```

### Updating a template
Oz is completely agnostic to whatever you use to model your data. To let Oz know that your data model has updated, simple call the `update` method with the new data model. Oz smartly re-renders the template, so updating the entire data model is not as expensive as with other templating libraries.

```javascript
var template = Oz('<div oz="person"><span oz-text="name"></span></div>');
template.render({ person: { name: "Tobi" } }); // outputs <div oz="person"><span oz-text="name">Tobi</span></div>
template.update({ person: { name: "Fred" } }); // updates existing node to <div oz="person"><span oz-text="name">Fred</span></div>
```

In a practical sense, you don't want to be manually updating your templates. Instead you should hook up the update function as a listener for change events on your data model. For instance, if you were using Backbone to model your data, you might have a set up like this:

```javascript
var person = new Backbone.Model({
  firstName: "Jeremy",
  lastName: "Ashkenas"
});

var personTemplate = Oz('<span oz-text="firstName"></span><span oz-text="lastName"></span>');

// register our change listener
person.on('change', function (model) {
  personTemplate.update(model.attributes);
});

// render the initial template
document.body.appendChild(personTemplate.render(person.attributes)); // outputs <span oz-text="firstName">Jeremy</span><span oz-text="lastName">Ashkenas</span>

// update one of the attributes
person.set('firstName', 'J'); // template is now <span oz-text="firstName">J</span><span oz-text="lastName">Ashkenas</span>

```

### Events
Part of Oz's philosophy is to let applications push data into the DOM and receive meaningful events from the DOM without ever interacting with the DOM itself. This allows the application logic to be decoupled from the template, which acts as a View.

To get events out of the DOM, you use the `oz-evt` tag, and define a DOM event as a key (e.g. `click`) and a more meaningful event as a value (e.g. `save`). The template will emit the more meaningful event every time the lower-level DOM event occurs. An example of how this might be used is shown below in Backbone:

```javascript
var person = new Backbone.Model({
  firstName: "Jeremy",
  lastName: "Ashkenas"
});

var personTemplate = Oz('<input oz-val="firstName"><br><input oz-val="lastName"><br><button oz-evt="click:save">Save</button>');

// listen for save events
personTemplate.on('save', function () {
  person.save();
});

// render the initial template
document.body.appendChild(personTemplate.render(person.attributes));
```


### Two-way Bindings
Oz exposes an internal method for tags to notify the template that an attribute has changed. This is just one case of an Oz event, and the Oz template notifies any listeners of the `chagne` event. This is used to bind models to changes in the template. The only default tag that uses this functionality is `oz-val`, but it could potentially be used by others.

Here again, Oz is totally agnostic to how you model your data, you simply have to listen for change events and set your data in whatever way it prefers. Using Backbone:

```javascript
var person = new Backbone.Model({
  firstName: "Jeremy",
  lastName: "Ashkenas"
});

var personTemplate = Oz('<input oz-val="firstName"><br><input oz-val="lastName">');

// listen for changes to the template
personTemplate.on('change', function (attr, val) {
  person.set(attr, val);
});

// render the initial template
document.body.appendChild(personTemplate.render(person.attributes));
```

### Getters
When a property being rendered is a function, Oz calls that function. In that way, there is not really a concept of a "getter" in Oz so much as a function that defines a property. This pattern makes it easier to include different displays of data without mangling your templates. For example, in a previous example I templated a `firstName` and `lastName` property separately. I could have just as easily defined a `fullName` function property like so:

```javascript
var person = {
  firstName: "Trey",
  lastName: "Griffith",
  fullName: function () {
    return this.firstName + " " + this.lastName
  }
};

var personTemplate = Oz('<span oz-text="fullName"></span>');

personTemplate.render(person); // outputs <span oz-text="fullName">Trey Griffith</span>
```


## Extending Oz
The default tags included with Oz are intended to take care of most templating use cases. However, to allow for additional uses, and for more efficient or feature-rich versions of existing tags, Oz is designed to allow additional tags to be added as first-class citizens. To add a tag, simply add a new property to the `Oz.tags` object with the following properties:

* `attr` - the attribute to be used in the DOM (e.g. `oz-text`)
* `render` - function responsible for modifying the node. It should accept 5 arguments:
  * `el` - DOM Node being rendered
  * `ctx` - the current context
  * `prop` - the value in the HTML attribute
  * `scope` - string representation of the current scope tree
  * `next` - function to be called when rendering is completed

See the source for more information, as all the default tags are defined this way in [lib/tags.js](blob/master/lib/tags.js).