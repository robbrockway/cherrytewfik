"use strict";
exports.testDialogue = {
    heading: 'Test dialogue',
    message: 'Message message message',
    buttonLabels: {
        ok: 'OK',
        cancel: 'Cancel',
    },
};
var testDialogueFormFields = [
    { name: 'name', label: 'Name', htmlInputType: 'text' },
    { name: 'email', label: 'Email address', htmlInputType: 'email' },
];
exports.testFormDialogue = Object.assign({}, exports.testDialogue, { formFields: testDialogueFormFields });
exports.testDialogueFormData = {
    name: 'Henry Crun',
    email: 'crunster@goons.net',
};
//# sourceMappingURL=test.data.js.map