# Cherry Tewfik Ceramics
Online gallery and shop for ceramicist Cherry Tewfik, using [Angular 2](http://angular.io/) and [Django REST Framework](http://www.django-rest-framework.org/)

Working demo at http://ctdemo.robswebcraft.com/

## Current features

### Client
- Pottery catalogue, with WYSIWYG editing
  - Elaborate system of ['field' components](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/fields), including [dates](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/year.month.edit.component.ts), [strings](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/string.edit.component.ts), [prices](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/price.edit.component.ts), [images](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts), and [related objects](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts)
  - [Reorderable lists](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/staff/editable-ordered-list/editable.ordered.list.component.ts), for [listing categories](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/staff/editable-ordered-list/editable.category.list.component.ts) and [listing pieces within each category](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/gallery/editable/editable.piece.list.component.ts)
- Client-side [object-relational mapper](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/main/models)
  - Converts data [to/from JSON](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/field-descriptors/base.ts), for communication with server
  - Capable of defining custom [model](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.ts) and [field](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/field-descriptors/base.ts) types
  - Keeps an [up-to-date cache](https://github.com/robbrockway/cherrytewfik/blob/2c7f4683c7d25082c3be84f5c12550dd42d6eb84/front/src/modules/main/models/model.ts#L190-L286), remembering relationships between objects
- [Image ticker component](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/shared/image-ticker/image.ticker.component.ts), to give a slideshow effect
  - Avoids excessive repetition of the same images
  - [Two tickers on home page](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/home-view/piece-ticker/piece.ticker.component.ts) avoid showing the [same image simultaneously](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/home-view/piece-ticker/piece.ticker.service.ts)
- [Zoomable image thumbnails](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/static/thumbnail.component.ts), on mouse hover
- [Information about items](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/gallery/shared/static.piece.list.item.component.ts), on mouse hover
  - Positioned carefully, to stay on screen
- [Login/logout box](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/login/login.component.ts)
  - Handles the full range of possible errors/rejections from server, [displaying them in appropriate places](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/login/login.form.component.ts)
  - Uses a general-purpose [flyout component](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/main/flyout)
- [Notification system](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/notification/notification.component.ts) displaying messages in top-right corner, currently used by reorderable lists
- [&lsquo;Sticky&rsquo; left-hand navigation bar](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/sticky.nav.bar.directive.ts), with `fixed` position by default but movable one if bar becomes taller than window
- Comprehensive suite of unit tests, including a homemade [class-based test system](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/testing) and over 1000 cases
  - Abstracts away some of the routine parts of Angular testing:
    - [Creating test modules](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/test.with.module.ts)
    - [Declaring components](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/component.test.base.ts)
    - [Searching the DOM](https://github.com/robbrockway/cherrytewfik/blob/2c7f4683c7d25082c3be84f5c12550dd42d6eb84/front/src/testing/utils.ts#L37-L298) for elements and directives
  - Tools for testing the ORM
    - Base classes for testing [data models](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.test.base.ts) and their associated [injectable services](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.service.test.base.ts)
    - Classes for [datasets](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/data/datasets.ts), storing values in their client-side format and their expected server-side conversions
- [SASS stylesheets](https://github.com/robbrockway/cherrytewfik/tree/2c7f4683c7d25082c3be84f5c12550dd42d6eb84/front/src/styles)
  - [Mixins](https://github.com/robbrockway/cherrytewfik/blob/2c7f4683c7d25082c3be84f5c12550dd42d6eb84/front/src/styles/imports/screen-sizes.scss) for responsive layout
  
  
### Server
- [REST API](https://github.com/robbrockway/cherrytewfik/blob/master/api/django_config/urls.py) that performs list, create, retrieve, update and destroy operations on the catalogue
- Django [models](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/models.py), [serializers](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/serializers.py) and [views](https://github.com/robbrockway/cherrytewfik/tree/master/api/app/views) for all tasks
- [Email templates](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/email.py), using Django's own template renderer
- Other features, soon to be implemented on client:
  - [User registration](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/views/pending_user.py), with an emailed activation key
  - [Password resetter](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/views/password_reset.py) and email address changer, also with activation keys
  - [Ordering system](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/views/order.py)
    - [Basket](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/views/basket.py) containing products, linked to a registered user, or to a guest via session ID
    - [Order model](https://github.com/robbrockway/cherrytewfik/blob/82abcb9bd925dde61deb38610207757002820642/api/app/models.py#L338-L415), which passes through &lsquo;pending&rsquo;, &lsquo;open&rsquo; and &lsquo;dispatched&rsquo; phases
    - Confirmation emails to [customer](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/templates/email/receipt.html) and [merchant](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/templates/email/admin_order_notification.html)
    - PDF invoice, [rendered](https://github.com/robbrockway/cherrytewfik/blob/82abcb9bd925dde61deb38610207757002820642/api/app/views/invoice.py#L23-L181) using [LaTeX](https://www.latex-project.org/) and based on [Django templates](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/templates/invoice.tex), for printing and sending with order ([see example](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/templates/invoice_mockup.pdf))
    - [Payments](https://github.com/robbrockway/cherrytewfik/blob/82abcb9bd925dde61deb38610207757002820642/api/app/views/order.py#L77-L342) using [Braintree API](https://developers.braintreepayments.com/)
      - Payments are updated when [order is edited](https://github.com/robbrockway/cherrytewfik/blob/82abcb9bd925dde61deb38610207757002820642/api/app/views/order.py#L346-L554)
- [Comments](https://github.com/robbrockway/cherrytewfik/blob/master/api/app/views/comment.py) on pieces or categories from the catalogue, postable by users
- Again, a large suite of [unit tests](https://github.com/robbrockway/cherrytewfik/tree/master/api/app/tests), with its own class hierarchy mirroring the app's one


# To-do list

- Implement remaining API features in client app
  - Registration and editing of user accounts
    - Use [DialogueService](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/dialogue/dialogue.service.ts) to display forms and dialogue boxes that float over the main page
  - Basket and order management
    - Show basket in a [flyout](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/main/flyout/flyout.component.ts)
    - New router endpoints for placing, editing and cancelling orders
      - Take and send payment information using Braintree's [hosted fields](https://developers.braintreepayments.com/guides/hosted-fields/overview/javascript/v2)
    - Router endpoint for merchant to view all current orders and mark them when dispatched, or for a user to view their order history
  - User comments
    - Display piece/category comments on the appropriate pages, with a form for posting further comments
    - Display general, undirected comments in a [flyout](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/main/flyout/flyout.component.ts) on the navigation bar
    - Make comments deletable by poster, and all deletable by staff
- Browser compatibility
  - Currently runs well in Chrome 63 and Firefox 57
  - Mostly works in IE11
    - Unfortunate, though not catastrophic, streaky horizontal lines in left-hand category list when scrolling
    - Image thumbnails are displaying at very low resolution, due to lack of support for [`srcset`](https://www.w3.org/TR/html-srcset/)
      - Give a larger version of the image as `src`; modern browsers can opt for a smaller one if need be
  - Test in Safari!
  - Further testing on mobile
    - Editing tools must work somewhat differently on touchscreen
      - No mouse hover, so press-hold can be used to make edit controls appear; normally this leads to right-click behaviour, which must be stopped
    - Get rid of dead space to the right of page, which can currently be scrolled into
    - [ScrollToTopOnNavigationDirective](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/scroll.to.top.on.navigation.directive.ts) ensures that the screen is scrolled correctly after navigating to a new view, but it could do with staying switched off when the app is initially loading, else the title banner and main menu aren't seen
    - Test on iOS
- Testing
  - Frontend could benefit greatly from some end-to-end tests. Components and models work well in isolation, but the modules that contain them are not covered by unit tests, and everything behaves a little unpredictably when first run in earnest.
- Angular compilation, modularity, and code splitting
  - Initial JavaScript download is huge (~1MB)! Fortunately the app uses a number of distinct [NgModule](https://angular.io/guide/ngmodule-faq)s, which can eventually be provided as separate JS files.
  - Staff-only modules ([StaffModule](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/staff), [EditableFieldsModule](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/fields/editable), [EditableGalleryModule](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/fields/editable)) and their components should be loaded dynamically using [NgModuleFactoryLoader](https://pr18487-aedf0aa.ngbuilds.io/api/core/NgModuleFactoryLoader) when a staff user logs in, rather than always loading when the app boots.
  - Problems with Angular's lazy module loader are making a production build impossible right now. Once these are solved, disabling debug mode and using the [ahead-of-time compiler](https://angular.io/guide/aot-compiler) will aid performance and cut download sizes further.

# Thoughts for future projects

- Consider using an full-stack framework like [Meteor](https://www.meteor.com/). This time around, some features (e.g. data models) essentially had to be coded twice: once in Python for server, once in TypeScript for client. Using the same code on both sides would save much time and effort.
- Server-side page rendering (e.g. with [Angular Universal](https://github.com/angular/universal)) would aid search engine visibility and improve support for older browsers.
- Look into state-management libraries like [Redux](https://redux.js.org/docs/introduction/) and NgRx's [store](https://github.com/ngrx/store). This app has often got itself in a twist with multiple and inconsistent copies of the same object; broadcasting its true state from a central store each time it changes would end the need for an elaborate caching system like the one here, and free up resources by reducing the need for change detection.
- Aim for shorter, though still descriptive, names; nobody wants to read 75 letters of unrelenting camelCase! This may require a more carefully-designed class structure, e.g.:
  - [`getDirectlyLinkedObjectsFromModelInstance()`](https://github.com/robbrockway/cherrytewfik/blob/771abb9ad8f1a19c33c7c194bd6e8797ba874f92/front/src/testing/utils.ts#L384-L397) could be rewritten as `Model.getDirectlyLinkedObjects()`, or `Model.directlyLinkedObjects` with a getter, or even `Model.linkedObjects.direct`, with `.linkedObjects` as an instance of a new `LinkedObjects` class. Since this is a test function and not part of the app itself, I could even create a `ModelTester` class that wraps `Model` and provides the needed functionality.
  - An unwieldy class name like [`OwnerCanCreateRetrieveOrUpdate`](https://github.com/robbrockway/cherrytewfik/blob/771abb9ad8f1a19c33c7c194bd6e8797ba874f92/api/app/permissions.py#L107-L111) seems harder to avoid, as Django requires a class, and not just a dynamically-generated object, to be passed to each view as its permissions handler. A `chmod`-like system such as [django-guardian](https://github.com/django-guardian/django-guardian) could solve this problem.