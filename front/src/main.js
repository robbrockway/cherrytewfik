"use strict";
var core_1 = require('@angular/core');
var platform_browser_dynamic_1 = require('@angular/platform-browser-dynamic');
var main_module_1 = require('./modules/main/main.module');
var environment_1 = require('./environments/environment');
if (environment_1.environment.production) {
    core_1.enableProdMode();
}
platform_browser_dynamic_1.platformBrowserDynamic().bootstrapModule(main_module_1.MainModule)
    .catch(function (err) { return console.log(err); });
//# sourceMappingURL=main.js.map