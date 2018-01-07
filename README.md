# Cherry Tewfik Ceramics
Online gallery and shop for ceramicist Cherry Tewfik, using Angular 2 and Django REST Framework

## Current features

### Client
- Pottery catalogue, with WYSIWYG editing
  – Elaborate system of 'field' components, including dates, strings, prices, images, and related objects
  – Reorderable lists, for listing categories and listing pieces within each category
– Client-side object-relational mapper
  – Converts data to/from JSON, for communication with server
  – Capable of defining custom model and field types
  – Keeps an up-to-date cache, remembering relationships between objects
– Image ticker component, to give a slideshow effect
  – Avoids excessive repetition of the same images
  – Two tickers on home page avoid showing the same image simultaneously
– Zoomable image thumbnails, on mouse hover
– Information about items, on mouse hover
  – Positioned carefully, to stay on screen
– Login/logout box
  – Handles the full range of possible errors/rejections from server, displaying them in appropriate places
  – Uses a general-purpose flyout component
– Notification system displaying messages in top-right corner, currently used by reorderable lists
– Comprehensive suite of unit tests, including a homemade class-based test system
  – Abstracts away some of the routine parts of Angular testing:
    – Creating test modules
    – Declaring components
    – Searching for DOM elements and directives inside the testbed's component fixture
  – Also provides base classes for testing the ORM, including data models and their associated injectable services
    