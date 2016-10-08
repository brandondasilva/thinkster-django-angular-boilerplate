# Django and AngularJS

## Notes

- The concept of an “app” is used to organize code in a meaningful way. An app is a module that houses code for models, view, serializers, etc that are all related in some way.
- To tell Django that we want to treat the email field as the username for this model, we set the `USERNAME_FIELD` attribute to `email`. The field specified by `USERNAME_FIELD` must be unique, so we pass the `unique=True` argument in the email field.
- When you want to get a model instance in Django, you use an expression of the form `Model.objects.get(**kwargs)`. The `objects` attribute here is a `Manager` class whose name typically follows the `<model name>Manager` convention. In our case, we will create an `AccountManager` class.
	- Note: Be sure to create the manager class above the model class in the file.
- Username requirements
	- We will be displaying the username in multiple place. To this end, having a username is not optional, so we include it in the `REQUIRED_FIELDS` list. Normally the `required=True` argument would accomplish this goal, but because this model is replace the `User` model, Django requires us to specify required fields in this way.
- When working in the shell, the default string representation of an `Account` object looks something something like `<Account: Account>`. Because we will have many different accounts, this is not very helpful. Overwriting `__unicode__()` will change this default behaviour. Here we choose to show the user’s email instead. The string representation of an account with the email `james@notgoogleplus.com` will now look like `<Account: james@notgoogleplus.com>`.
- When substituting a customer user model, it is required that you also define a related `Manager` class that overrides the `create_user()` and `create_superuser()` methods.
### Changing the Django AUTH_USER_MODEL
- Even though we have created this `Account` model, the command `python manage.py createsuperuser` (which is coming up later) still creates `User` objects. This is because, at this point, Django still believes that `User` is the model we want to use for authentication.
- To set things straight and start using `Account` as our authentication model, we have to update `settings.AUTH_USER_MODEL` in the `thinkster_django_angular_tutorial/settings.py` file with the following code: `AUTH_USER_MODEL = ‘authentication.Account’`

### Installing apps
- In Django, you must explicitly declare which apps are being used. In the `settings.py` file (mentioned in the previous section), add the apps that you have created to the `INSTALLED_APPS` list.

### Migration
Migrations handle the SQL needed to update the schema of our database so you don’t have to. By way of example, consider the `Account` model. These models need to be stored in the database, but our database doesn’t have a table for `Account` objects yet. By creating our first migration, it will handle adding the tables to the database and offer us a way to rollback the changes if we make a mistake.
Commands for making migrations (every time):
- `python manage.py makemigrations`
- `python manage.py migrate`

### Super User
- Different users have different levels of access in any given application. Some users are admins and can do anything anywhere, while some are just regular users whose actions should be limited. In Django, a super user is the highest level of access you can have. Because we want the ability to work with all facets of our application, we’ll create a super user.
	- `python manage.py createsuperuser`

### Serializing the Account model
The application that is being created with this tutorial will make AJAX requests to the server to get the data it intends to display. Before we can send that data back to the client, we need to format it in a way that the client can understand; in this case we’re using JSON. This conversion of Django models to JSON is called serialization
	- In this project, we are using the Django REST Framework is a toolkit that provides a number of features common to most web applications, including serializers, so we’re going to leverage that
**Going over the code**
- Instead of including `password` in the `fields` tuple, we explicitly define the field at the top of the `AccountSerializer` class. The reason we do this is so we can pass the `required=False` argument. Each field in `fields` is required, but we don’t want to update the user’s password unless they provide a new one.
- `write_only=True` — The user’s password, even in its hashed and salted form, should not be visible to the client in the AJAX response
**The Meta Sub-Class**
- Defines metadata the serializer requires to operate.
- Because this serializer inherits from `serializers.ModelSerializer`, it should make sense that we must tell it which model to serialize. Specifying the model creates a guarantee that only attributes of that model or explicitly created fields can be serialized.
- The `fields` attribute of the `Meta` class is where we specify which attributes of the `Account` model should be serialized. We must be careful when specifying which fields to serialize because some fields, like `is_superuser`, should not be available to the client for security reasons.
- Sometimes we want to turn JSON into a Python object. This is called deserialization and it is handled by the `.create()` and `.update()` methods.

### Creating the Authentication System
Up until this point we have been doing everything in Python. We will begin getting in to Angular at this point.
We need to make users in order to test and figure out logging in and authentication. To register a new user, we need an API endpoint that will create an `Account` object, an AngularJS service to make an AJAX request to the API and a registration form.

- Django REST Framework offers a feature called viewsets. A viewset, as the name implies, is a set of views. Specifically, the `ModelViewSet` offers an interface for listing, creating, retrieving, updating and destroying objects of a given model.
- Django REST Framework uses the specified queryset and serializer to perform the actions listed on lines 8-10 in `authentication/views.py`. Also note that we specify the `lookup_field` attribute. As mentioned earlier, we will use the username attribute of the Account model to look up accounts instead of the id attribute. Overriding lookup_field handles this for us.
- The only user that should be able to call dangerous methods (such as `update()` and `delete()`) is the owner of the account. We first check if the user is authenticated and then call a custom permission, found in `authentication/permissions.py` This case does not hold when the HTTP method is `POST`. We want to allow any user to create an account. If the HTTP method of the request ('GET', 'POST', etc) is "safe", then anyone can use that endpoint.
- When you create an object using the serializer's .save() method, the object's attributes are set literally. This means that a user registering with the password `'password'` will have their password stored as `'password'`. This is bad for a couple of reasons: 1) Storing passwords in plain text is a massive security issue. 2) Django hashes and salts passwords before comparing them, so the user wouldn't be able to log in using `'password'` as their password. We solve this problem by overriding the `.create()` method for this viewset and using `Account.objects.create_user()` to create the `Account` object.

**`permissions.py`**
- Basic permission. If there is a user associated with the current request, we check whether that user is the same object as `account`. If there is no user associated with this request, we simply return `False`.

**Adding an API endpoint**
- `url('^.*$', IndexView.as_view(), name='index'),`
	- It is very important that the last URL (i.e. the line above) from the `urls.py` file, is ALWAYS the last URL. This is known as a passthrough or catch-all route. It accepts all requests not matched by a previous rule and passes the request through to AngularJS's router for processing. The order of other URLs is normally insignificant.

**An Angular services for registering new users**
With the API endpoint in place, we can create an AngularJS service that will handle communication between the client and the server.
- AngularJS supports the use of modules. Modularization is a great feature because it promotes encapsulation and loose coupling. We make thorough use of Angular's module system throughout the tutorial.

**Creating an interface for regsitering new users**
`<form role="form" ng-submit="vm.register()">`
- This is the line responsible for calling `$scope.register`, which we set up in our controller. `ng-submit` will call `vm.register` when the form is submitted. We choose to avoid using `$scope` where possible in favour of `vm` for ViewModel.

`<input type="email" class="form-control" id="register__email" ng-model="vm.email" placeholder="ex. john@notgoogle.com" />`
- On each `<input />`, you will see another directive, `ng-model`. `ng-model` is responsible for storing the value of the input on the ViewModel. This is how we get the username, password, and email when `vm.register` is called.

`vm.register = register;`
- `vm` allows the template we just created to access the `register` method we define later in the controller.

**`thinkster.routes.js`**
`.config(config);`
- Angular, like just about any framework you can imagine, allows you to edit it's configuration. You do this with a `.config` block.

`function config($routeProvider) {`
- Here, we are injecting `$routeProvider` as a dependency, which will let us add routing to the client.

`$routeProvider.when('/register', {`
- `$routeProvider.when` takes two arguments: a path and an options object. Here we use `/register` as the path because that's where we want the registration form to show up. The options object is explained below.

`controller: 'RegisterController',
controllerAs: 'vm',
`
- One key you can include in the options object is `controller`. This will map a certain controller to this route. Here we use the `RegisterController` controller we made earlier. `controllerAs` is another option. This is required to use the `vm` variable. In short, we are saying that we want to refer to the controller as `vm` in the template.
- The rest of the controller is straightforward.

**`authentication.module.js`**

```
angular
  .module('thinkster.authentication', [
    'thinkster.authentication.controllers',
    'thinkster.authentication.services'
  ]);
```
- This syntax defines the module `thinkster.authentication` with `thinkster.authentication.controllers` and `thinkster.authentication.services` as dependencies.

`angular.module('thinkster.authentication.controllers', []);`
- This syntax defines the module `thinkster.authentication.controllers` with no dependencies (Services has `ngCookies` as a dependency).

**`static/javascripts/thinkster.js`**
Need to include `thinkster.authentication` and `thinkster.routes` as dependencies of `thinkster`.

**Hash Routing -- `thinkster.config.js`**
- By default, urls have a hash after the url (i.e. `www.google.com/#/search`). This is by default with Angular. By enabling `$locationProvider.html5Mode` and `$locationProvider.hashPrefix('!')`, you remove this basic hash and it is now: `www.google.com/#!/search`. This is mostly beneficial for search engines which is a good thing. In order to do this you need to create a config file for the entire app in `static/javascripts/` and add the dependency to `thinkster.js`.

**Handling CSRF Protection**
(Side note: I didn't know what this was at first and thought it was a type of security that sucked, but it's really just a type of attack lol)
- Configure AngularJS to handle this. You can see this in `thinkster.js` with the `run()` function.
