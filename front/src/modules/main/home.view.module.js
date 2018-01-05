"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var router_1 = require('@angular/router');
var home_view_1 = require('./home.view');
var routes = [{
        path: '',
        component: home_view_1.HomeView,
    }];
var HomeViewModule = (function () {
    function HomeViewModule() {
    }
    HomeViewModule = __decorate([
        core_1.NgModule({
            declarations: [home_view_1.HomeView],
            imports: [router_1.RouterModule.forChild(routes)],
        })
    ], HomeViewModule);
    return HomeViewModule;
}());
exports.HomeViewModule = HomeViewModule;
//# sourceMappingURL=home.view.module.js.map