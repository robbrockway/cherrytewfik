"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/of');
require('rxjs/add/observable/throw');
var dialogue_service_1 = require('./dialogue.service');
var test_data_1 = require('./test.data');
describe('DialogueService', function () {
    var service;
    var dialogueHandler = function (dialogue) { return Observable_1.Observable.of('Dialogue response'); };
    var dialogueCanceller = function (dialogue) { return Observable_1.Observable.throw('Cancel'); };
    beforeEach(function () {
        service = new dialogue_service_1.DialogueService();
    });
    it('should be able to register handler', function () {
        service.registerHandler(dialogueHandler);
    });
    it('should call onOk with response data', function (done) {
        service.registerHandler(dialogueHandler);
        service.show(test_data_1.testDialogue, function (response) {
            expect(response).toEqual('Dialogue response');
            done();
        });
    });
    it('should call onCancel when handler throws error', function (done) {
        service.registerHandler(dialogueCanceller);
        var onOk = fail, onCancel = done;
        service.show(test_data_1.testDialogue, onOk, onCancel);
    });
});
//# sourceMappingURL=dialogue.service.spec.js.map