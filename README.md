Oz.js
=====
Oz.js is a lightweight†, simple, declarative templating method with built-in events, two-way bindings, and efficient rendering.

It is built on a philosophy of:

1. taking advantage of the DOM instead of string manipulation
2. making the minimum amount of DOM changes as possible to increase rendering speed
3. not adding template-specific DOM nodes to the DOM tree
4. being completely agnostic to any other part of the application (i.e. modeling, routing, etc)
5. letting the application never touch the DOM

† Oz.js is 29 KB when uglified, and 8 KB gzipped, including all dependencies.

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
You define which actions the template should take using HTML attributes that are registered as Oz tags. While Oz core does not have any tags included, There is a bundle that includes the most common tags. See [Extending Oz](#extending-oz) for more information.

Here's a quick example of what a tag looks like:

```javascript
var context = {
  name: 'Tobi'
};

Oz.render('<span oz-text="name"></span>', context);
```

Produces:

```html
<span oz-text="name">Tobi</span>
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

Any Oz tag can trigger a template event based on a lower level DOM event. The [`oz-evt` tag](http://github.com/treygriffith/oz-evt) allows you to define a DOM event as a key (e.g. `click`) and a more meaningful event as a value (e.g. `save`). The template will emit the more meaningful event every time the lower-level DOM event occurs. An example of how this might be used is shown below in Backbone:

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
Oz has an internal method for tags to notify the template that an attribute has changed. This is one case of an Oz event, and the Oz template notifies any listeners of the `change` event, as it would for any other event. This is used to bind models to changes in the template. This binding is exemplified by the [`oz-val` tag](http://github.com/treygriffith/oz-val).

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

// make changes in our model be reflected in the template for true two-way binding
person.on('change', function (model) {
  personTemplate.update(model.attributes);
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
Oz does not include any tags in its core. There are however, a few tags that were developed for a baseline Oz use case. Those tags are:

* [oz-attr](http://github.com/treygriffith/oz-attr) Bind an attribute value to a property
* [oz-each](http://github.com/treygriffith/oz-each) Render each element for each member of an Array
* [oz-evt](http://github.com/treygriffith/oz-evt) Propagate events from the DOM to the template
* [oz-if](http://github.com/treygriffith/oz-if) Boolean show/hide
* [oz-scope](http://github.com/treygriffith/oz-scope) Scope child nodes to a property
* [oz-text](http://github.com/treygriffith/oz-text) Render a text node
* [oz-val](http://github.com/treygriffith/oz-val) Add a form value, and get notified when they change

See the above libraries for examples of implementing a tag, but in short:

The new tag should expose a plugin function that, when called with the Oz instance or constructor as the only parameter, will add the tag to the Oz instance or constructor. A tag is added by calling the `tag` method of the instance or constructor. `tag` takes 3 parameters:

* `name` - the attribute to be used in the DOM (e.g. `oz-text`)
* `render` - function responsible for modifying the node. It should accept 5 arguments:
  * `el` - DOM Node being rendered
  * `ctx` - the current context
  * `prop` - the value in the HTML attribute
  * `scope` - string representation of the current scope tree
  * `next` - function to be called when rendering is completed
* `not` - Optional CSS select indicating tags with attribute `name` that should be ignored.

An example plugin function might look like this:

```javascript
module.exports = function (Oz) {
  Oz.tag('my-tag', render)
}
```

The `render` function is called within the context of the Oz instance, so you have access to a number of important [utilities](lib/utils.js):

* Oz#get: get the value of a property in a context
* Oz#scope: get the textual representation of current scope
* Oz#split: split a property into its constituent parts - similar to inline style declarations
* Oz#hide: hide element (`display: 'none';`)
* Oz#show: unhide element (`display: '';`)


See the source for more information, as all the default tags are defined this way in [lib/tags.js](lib/tags.js).
