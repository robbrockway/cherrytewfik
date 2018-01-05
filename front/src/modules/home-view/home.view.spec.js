"use strict";
var testing_1 = require('@angular/core/testing');
var platform_browser_1 = require('@angular/platform-browser');
var home_view_1 = require('./home.view');
describe('HomeView', function () {
    var fixture;
    var component;
    beforeEach(testing_1.async(function () {
        testing_1.TestBed.configureTestingModule({
            declarations: [home_view_1.HomeView],
        }).compileComponents();
        fixture = testing_1.TestBed.createComponent(home_view_1.HomeView);
        component = fixture.debugElement.componentInstance;
    }));
    it("should contain h1 tag saying 'Home'", function () {
        var debugElement = fixture.debugElement.query(platform_browser_1.By.css('h1'));
        expect(debugElement.nativeElement.textContent)
            .toBe('Home');
    });
});
//# sourceMappingURL=home.view.spec.js.map