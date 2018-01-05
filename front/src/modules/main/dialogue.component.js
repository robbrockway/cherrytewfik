"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var Subject_1 = require('rxjs/Subject');
var DialogueComponent = (function () {
    function DialogueComponent(dialogueService) {
        var _this = this;
        this.dialogueService = dialogueService;
        this.visible = false;
        dialogueService.registerHandler(function (dialogue) {
            _this.response$ = new Subject_1.Subject();
            _this.show(dialogue);
            return _this.response$;
        });
    }
    DialogueComponent.prototype.hasForm = function () {
        return !!(this.dialogue.formFields
            && this.dialogue.formFields.length);
    };
    DialogueComponent.prototype.show = function (dialogue) {
        this.formValues = this.createFormValues(dialogue);
        this.dialogue = dialogue;
        this.visible = true;
    };
    DialogueComponent.prototype.createFormValues = function (dialogue) {
        var formValues = {};
        if (dialogue.formFields) {
            for (var _i = 0, _a = dialogue.formFields; _i < _a.length; _i++) {
                var field = _a[_i];
                formValues[field.name] = '';
            }
        }
        return formValues;
    };
    DialogueComponent.prototype.onOk = function () {
        this.response$.next(this.formValues);
        this.done();
    };
    DialogueComponent.prototype.done = function () {
        this.visible = false;
        this.response$.complete();
    };
    DialogueComponent.prototype.onCancel = function () {
        this.response$.error(null);
        this.done();
    };
    DialogueComponent = __decorate([
        core_1.Component({
            selector: 'dialogue',
            templateUrl: './dialogue.component.html',
            styles: ['./dialogue.component.scss'],
        })
    ], DialogueComponent);
    return DialogueComponent;
}());
exports.DialogueComponent = DialogueComponent;
//# sourceMappingURL=dialogue.component.js.map