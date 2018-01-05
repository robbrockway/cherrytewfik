// Switch between a prompt (e.g. 'Add name', 'Add description') if the field has an empty value, and the static field itself if it does. Some field types (e.g. image, thumbnail) will never be replaced with a prompt, as they have their own ways of indicating their emptiness.

import { Component } from '@angular/core';

import { FieldComponentBase } from 'modules/fields/field.component.base';
import { arrayContains } from 'utils';



const unpromptedTypes = [
	'image',
	'thumbnail',
	'categoryLink',
];



@Component({
	selector: 'static-field-prompt',
	templateUrl: './static.field.prompt.component.html',
})
export class StaticFieldPromptComponent extends FieldComponentBase {

	get shouldShowField(): boolean {
		const fieldIsUnprompted = 
			arrayContains(unpromptedTypes, this.type);

		const valueIsSet = !!this.value;

		return fieldIsUnprompted || valueIsSet;
	}

}