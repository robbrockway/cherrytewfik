"use strict";
var testing_1 = require('@angular/core/testing');
var platform_browser_1 = require('@angular/platform-browser');
function checkElementTextContentIs(root, cssSelector, expectedContent) {
    if (root instanceof testing_1.ComponentFixture)
        root = root.debugElement;
    var debugElement = root.query(platform_browser_1.By.css(cssSelector));
    var actualContent = debugElement.nativeElement.textContent;
    actualContent = actualContent.trim();
    expectedContent = expectedContent.trim();
    expect(actualContent).toBe(expectedContent);
}
exports.checkElementTextContentIs = checkElementTextContentIs;
//# sourceMappingURL=utils.js.map