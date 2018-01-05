"use strict";
var testing_1 = require('@angular/core/testing');
var testing_2 = require('@angular/router/testing');
var forms_1 = require('@angular/forms');
var app_component_1 = require('./app.component');
var dialogue_component_1 = require('./dialogue.component');
describe('AppComponent', function () {
    var fixture;
    var component;
    beforeEach(testing_1.async(function () {
        testing_1.TestBed.configureTestingModule({
            declarations: [
                app_component_1.AppComponent,
                dialogue_component_1.DialogueComponent,
            ],
            imports: [
                testing_2.RouterTestingModule,
                forms_1.FormsModule,
            ],
        }).compileComponents();
        fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
        component = fixture.debugElement.componentInstance;
    }));
    it('should create the component', testing_1.async(function () {
        expect(component).toBeTruthy();
    }));
});
//# sourceMappingURL=app.component.spec.js.map