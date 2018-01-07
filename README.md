# Cherry Tewfik Ceramics
Online gallery and shop for ceramicist Cherry Tewfik, using [Angular 2](http://angular.io/) and [Django REST Framework](http://www.django-rest-framework.org/)

## Current features

### Client
- Pottery catalogue, with WYSIWYG editing
  - Elaborate system of ['field' components](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/fields), including [dates](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/year.month.edit.component.ts), [strings](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/string.edit.component.ts), [prices](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/price.edit.component.ts), [images](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts), and [related objects](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts)
  - [Reorderable lists](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/staff/editable-ordered-list/editable.ordered.list.component.ts), for [listing categories](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/staff/editable-ordered-list/editable.category.list.component.ts) and [listing pieces within each category](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/gallery/editable/editable.piece.list.component.ts)
- Client-side [object-relational mapper](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/main/models)
  - Converts data [to/from JSON](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/field-descriptors/base.ts), for communication with server
  - Capable of defining custom [model](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.ts) and [field](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/field-descriptors/base.ts) types
  - Keeps an [up-to-date cache](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.service.ts), remembering relationships between objects
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
- Comprehensive suite of unit tests, including a homemade [class-based test system](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/testing)
  - Abstracts away some of the routine parts of Angular testing:
    - [Creating test modules](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/test.with.module.ts)
    - [Declaring components](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/component.test.base.ts)
    - [Searching the DOM](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/utils.ts) for elements and directives
  - Tools for testing the ORM
    - Base classes for testing [data models](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.test.base.ts) and their associated [injectable services](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/main/models/model.service.test.base.ts)
    - Classes for [datasets](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/testing/data/datasets.ts), storing values in their client-side format and their expected server-side conversions
  
### Server
- REST API that performs list, create, retrieve, update and destroy operations on the catalogue
- Django models, serializers and views for all tasks
- Email templates, using Django's own template renderer
- Other features, soon to be implemented on client:
  - User registration, with an emailed activation key
  - Password resetter and email address changer, also with activation keys
  - Ordering system
    - Basket containing products, linked to a registered user, or to a guest via session ID
    - Order model, passing through &lsquo;pending&rsquo;, &lsquo;open&rsquo; and &lsquo;dispatched&rsquo; phases
    - Confirmation emails to customer and merchant
    - PDF invoice, rendered using LaTeX and based on Django templates, for printing and sending with order (see example)
- Again, a large suite of unit tests, with its own class hierarchy mirroring the app's one