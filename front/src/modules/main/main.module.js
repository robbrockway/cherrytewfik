"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var router_1 = require('@angular/router');
var platform_browser_1 = require('@angular/platform-browser');
var forms_1 = require('@angular/forms');
var app_component_1 = require('./app.component');
var dialogue_component_1 = require('./dialogue.component');
var dialogue_service_1 = require('./dialogue.service');
var routes = [
    {
        path: '',
        loadChildren: '../home-view/home.view.module#HomeViewModule',
    },
];
var MainModule = (function () {
    function MainModule() {
    }
    MainModule = __decorate([
        core_1.NgModule({
            declarations: [
                app_component_1.AppComponent,
                dialogue_component_1.DialogueComponent,
            ],
            imports: [
                router_1.RouterModule.forRoot(routes),
                platform_browser_1.BrowserModule,
                forms_1.FormsModule,
            ],
            providers: [
                dialogue_service_1.DialogueService,
            ],
            bootstrap: [app_component_1.AppComponent],
        })
    ], MainModule);
    return MainModule;
}());
exports.MainModule = MainModule;
//# sourceMappingURL=main.module.js.map