// Almost idential to PlainFieldErrorComponent, but has a different template with a dark background behind

import { Component } from '@angular/core';

import { FieldErrorComponentBase } from './field.error.component.base';



@Component({
	selector: 'image-field-error',
	templateUrl: './image.field.error.component.html',
})
export class ImageFieldErrorComponent extends FieldErrorComponentBase {}