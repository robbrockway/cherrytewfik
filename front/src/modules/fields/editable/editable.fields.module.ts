// Provides editable components, for FieldComponent to use when a staff member is logged in

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SharedModule } from 'modules/shared/shared.module';

import { StaticFieldsModule }
	from '../static/static.fields.module';

import { EditableFieldComponent } from './editable.field.component';

import { StaticFieldPromptComponent }
	from './static.field.prompt.component';

import {
	SpinComponent,
	EditComponent,
	ContentEditableModelDirective,
	FileSelectDirective,
} from './edit';

import {
	StringEditComponent,
	PriceEditComponent,
	YearMonthEditComponent,
	ImageEditComponent,
	CategoryLinkEditComponent,
} from './edit/types';

import {
	SavingMessageComponent,
	PlainSavingMessageComponent,
	ImageSavingMessageComponent,
} from './saving-message';

import {
	FieldErrorComponent,
	PlainFieldErrorComponent,
	ImageFieldErrorComponent,
} from './field-error';



@NgModule({
	declarations: [
		EditableFieldComponent,
		StaticFieldPromptComponent,
		SpinComponent,
		EditComponent,
		StringEditComponent,
		PriceEditComponent,
		YearMonthEditComponent,
		ImageEditComponent,
		CategoryLinkEditComponent,
		SavingMessageComponent,
		PlainSavingMessageComponent,
		ImageSavingMessageComponent,
		FieldErrorComponent,
		PlainFieldErrorComponent,
		ImageFieldErrorComponent,
		ContentEditableModelDirective,
		FileSelectDirective,
	],

	imports: [
		SharedModule,
		StaticFieldsModule,
		CommonModule,
		FormsModule,
	],

	exports: [
		EditableFieldComponent,
	],
})
export class EditableFieldsModule {}