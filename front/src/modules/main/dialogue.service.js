"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var Observable_1 = require('rxjs/Observable');
var Subject_1 = require('rxjs/Subject');
require('rxjs/add/observable/empty');
require('rxjs/add/operator/mergeMap');
// Takes requests for dialogue boxes (type Dialogue, above), passes them to a given handler function which shows the dialogue (in practice, this is part of AppComponent), and calls a given 'onOk' or 'onCancel' function in response.
var DialogueService = (function () {
    function DialogueService() {
        this.dialogue$ = new Subject_1.Subject();
        this.response$ = Observable_1.Observable.empty();
    }
    // Handler function should return an Observable of any data (e.g. form fields) gathered by the dialogue box, which raises an error if cancel/no is pressed
    DialogueService.prototype.registerHandler = function (onShow) {
        this.response$ = this.dialogue$.mergeMap(onShow);
    };
    DialogueService.prototype.show = function (dialogue, onOk, // 'response' may be form data
        onCancel) {
        var sub;
        var onSuccess = function (response) {
            if (onOk)
                onOk(response);
        };
        var onError = function (error) {
            if (onCancel)
                onCancel();
        };
        var cleanUp = function () {
            if (sub)
                sub.unsubscribe();
        };
        sub = this.response$.subscribe(onSuccess, onError, cleanUp);
        this.dialogue$.next(dialogue);
    };
    DialogueService = __decorate([
        core_1.Injectable()
    ], DialogueService);
    return DialogueService;
}());
exports.DialogueService = DialogueService;
//# sourceMappingURL=dialogue.service.js.map