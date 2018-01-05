"use strict";
var testing_1 = require('@angular/core/testing');
var forms_1 = require('@angular/forms');
var platform_browser_1 = require('@angular/platform-browser');
var dialogue_service_1 = require('./dialogue.service');
var dialogue_component_1 = require('./dialogue.component');
var test_data_1 = require('./test.data');
var utils_1 = require('../../testing/utils');
describe('DialogueComponent', function () {
    var fixture;
    var component;
    var service;
    var getShroudOpacity;
    var showDialogue;
    var getFormDialogueTableRows;
    var forEachFormField;
    var forEachFormInput;
    var pressButton;
    var setFormValuesToTestData;
    var setInputValueToTestData;
    beforeEach(testing_1.async(function () {
        testing_1.TestBed.configureTestingModule({
            imports: [forms_1.FormsModule],
            declarations: [dialogue_component_1.DialogueComponent],
            providers: [dialogue_service_1.DialogueService],
        }).compileComponents();
        service = testing_1.TestBed.get(dialogue_service_1.DialogueService);
        fixture = testing_1.TestBed.createComponent(dialogue_component_1.DialogueComponent);
        component = fixture.debugElement.componentInstance;
    }));
    it('should create the component', testing_1.async(function () {
        expect(component).toBeTruthy();
    }));
    it('should hide the shroud at first', testing_1.async(function () {
        fixture.detectChanges();
        expect(getShroudOpacity()).toBe('0');
    }));
    getShroudOpacity = function () {
        var shroud = fixture.debugElement.query(platform_browser_1.By.css('.shroud'));
        return shroud.nativeElement.style.opacity;
    };
    it('should show dialogue on request', function () {
        showDialogue();
        expect(getShroudOpacity()).toBe('1');
    });
    showDialogue = function (dialogue, onOk, onCancel) {
        if (dialogue === void 0) { dialogue = test_data_1.testDialogue; }
        service.show(dialogue, onOk, onCancel);
        fixture.detectChanges();
    };
    it('should show dialogue heading', function () {
        showDialogue();
        utils_1.checkElementTextContentIs(fixture, 'h1', test_data_1.testDialogue.heading);
    });
    it('should show dialogue message', function () {
        showDialogue();
        utils_1.checkElementTextContentIs(fixture, 'p', test_data_1.testDialogue.message);
    });
    it('should show correct OK button label', function () {
        showDialogue();
        utils_1.checkElementTextContentIs(fixture, 'button[name="ok"]', test_data_1.testDialogue.buttonLabels.ok);
    });
    it('should show correct Cancel button label', function () {
        showDialogue();
        utils_1.checkElementTextContentIs(fixture, 'button[name="cancel"]', test_data_1.testDialogue.buttonLabels.cancel);
    });
    it('should show form fields', function () {
        var tableRows = getFormDialogueTableRows();
        expect(tableRows.length).toEqual(test_data_1.testFormDialogue.formFields.length);
    });
    getFormDialogueTableRows = function () {
        showDialogue(test_data_1.testFormDialogue);
        return fixture.debugElement.queryAll(platform_browser_1.By.css('tr'));
    };
    it('should show correct form labels', function () {
        forEachFormField(function (field, tableRow) {
            var label = tableRow.query(platform_browser_1.By.css('label'));
            expect(label.properties['htmlFor']).toBe(field.name);
            expect(label.nativeElement.textContent.trim()).toBe(field.label);
        });
    });
    forEachFormField = function (func) {
        var fields = test_data_1.testFormDialogue.formFields;
        var tableRows = getFormDialogueTableRows();
        for (var i = 0; i < fields.length; i++) {
            func(fields[i], tableRows[i]);
        }
    };
    it('should use correct form input types', function () {
        forEachFormInput(function (field, input) {
            expect(input.properties['type']).toBe(field.htmlInputType);
        });
    });
    forEachFormInput = function (func) {
        forEachFormField(function (field, tableRow) {
            var input = tableRow.query(platform_browser_1.By.css('input'));
            func(field, input);
        });
    };
    it('should use correct form input IDs', function () {
        forEachFormInput(function (field, input) {
            return expect(input.properties['id']).toBe(field.name);
        });
    });
    var testDialogueClosesOnButtonPress = function (buttonName) {
        showDialogue();
        pressButton(buttonName);
        fixture.detectChanges();
        expect(getShroudOpacity()).toBe('0');
    };
    pressButton = function (name) {
        var predicate = platform_browser_1.By.css("button[name=" + name + "]");
        var button = fixture.debugElement.query(predicate);
        button.nativeElement.click();
    };
    it('should close dialogue when OK is pressed', testDialogueClosesOnButtonPress.bind(null, 'ok'));
    it('should close dialogue when Cancel is pressed', testDialogueClosesOnButtonPress.bind(null, 'cancel'));
    it('should call onOk when OK is pressed', function (done) {
        var onOk = function (response) { return done(); };
        var onCancel = fail;
        showDialogue(test_data_1.testDialogue, onOk, onCancel);
        pressButton('ok');
    });
    it('should call onCancel when Cancel is pressed', function (done) {
        var onOk = function (response) { return fail(); };
        var onCancel = done;
        showDialogue(test_data_1.testDialogue, onOk, onCancel);
        pressButton('cancel');
    });
    it("should pass form data back with 'OK' response", testing_1.async(function (done) {
        var onOk = function (response) {
            expect(response).toEqual(test_data_1.testDialogueFormData);
            done();
        };
        showDialogue(test_data_1.testFormDialogue, onOk);
        setFormValuesToTestData();
        fixture.whenStable().then(function () { return pressButton('ok'); });
    }));
    setFormValuesToTestData = function () {
        forEachFormInput(function (field, input) {
            return setInputValueToTestData(input);
        });
    };
    setInputValueToTestData = function (input) {
        var nativeInput = input.nativeElement;
        nativeInput.value = test_data_1.testDialogueFormData[nativeInput.id];
        nativeInput.dispatchEvent(new Event('input'));
    };
});
//# sourceMappingURL=dialogue.component.spec.js.map