// Displays the value passed to its 'value' attribute in a readable format. A string will be unprocessed; a date will be rendered; an image will be displayed through a ThumbnailComponent if type="thumbnail" is given.

// This component is largely a switch, based on its 'type' input, that delegates to one of a number of other components (StaticStringFieldComponent, StaticDateFieldComponent, etc.)


import { Component, Input } from '@angular/core';

import { FieldComponentBase } from '../field.component.base';



@Component({
	selector: 'static-field',
	templateUrl: './static.field.component.html',
})
export class StaticFieldComponent extends FieldComponentBase {}