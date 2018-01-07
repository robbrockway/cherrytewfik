# Cherry Tewfik Ceramics
Online gallery and shop for ceramicist Cherry Tewfik, using Angular 2 and Django REST Framework

## Current features

### Client
- Pottery catalogue, with WYSIWYG editing
  - Elaborate system of ['field' components](https://github.com/robbrockway/cherrytewfik/tree/master/front/src/modules/fields), including [dates](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/year.month.edit.component.ts), [strings](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/string.edit.component.ts), [prices](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/price.edit.component.ts), [images](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts), and [related objects](https://github.com/robbrockway/cherrytewfik/blob/master/front/src/modules/fields/editable/edit/types/image.edit.component.ts)
  - Reorderable lists, for listing categories and listing pieces within each category
- Client-side object-relational mapper
  - Converts data to/from JSON, for communication with server
  - Capable of defining custom model and field types
  - Keeps an up-to-date cache, remembering relationships between objects
- Image ticker component, to give a slideshow effect
  - Avoids excessive repetition of the same images
  - Two tickers on home page avoid showing the same image simultaneously
- Zoomable image thumbnails, on mouse hover
- Information about items, on mouse hover
  - Positioned carefully, to stay on screen
- Login/logout box
  - Handles the full range of possible errors/rejections from server, displaying them in appropriate places
  - Uses a general-purpose flyout component
- Notification system displaying messages in top-right corner, currently used by reorderable lists
- Comprehensive suite of unit tests, including a homemade class-based test system
  - Abstracts away some of the routine parts of Angular testing:
    - Creating test modules
    - Declaring components
    - Searching the DOM for elements and directives
  - Tools for testing the ORM
    - Base classes for testing data models and their associated injectable services
    - Classes for datasets, storing values in their client-side format and their expected server-side conversions
  
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