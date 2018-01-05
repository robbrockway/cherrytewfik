// The master FieldComponent gets its own module, as it depends on EditableFieldsModule, StaticFieldsModule and SharedModule, but is required by multiple other modules so cannot be part of MainModule.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditableFieldsModule } from './editable';
import { StaticFieldsModule } from './static';

import { FieldComponent } from './field.component';



@NgModule({
	declarations: [
		FieldComponent,
	],

	imports: [
		EditableFieldsModule,
		StaticFieldsModule,
		CommonModule,
	],

	exports: [
		FieldComponent,
	],
})
export class FieldsModule {}