import { Component } from '@angular/core';

import { StaticFieldPromptComponent } 
	from './static.field.prompt.component';

import {
	FieldComponentTestBase,
	FieldHostComponent,
} from 'modules/fields/field.component.test.base';

import { MockStaticFieldDirective } from 'testing';



@Component({
	template: `
		<static-field-prompt
			[type]="type"
			[object]="object"
			[propertyName]="propertyName"
			[label]="label"
			[prefixText]="prefixText"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			(load)="onLoad()"
		></static-field-prompt>
	`,
})
class HostComponent extends FieldHostComponent {}


// These types (arguments for component's 'type' input) should result in component being replaced with a prompt message when value is empty
const promptedTypes = [
	'string',
	'multiline',
	'price',
	'yearMonth',
];	


const unpromptedTypes = [
	'image',
	'thumbnail',
	'categoryLink',
];



class StaticFieldPromptComponentTest extends FieldComponentTestBase {

	constructor() {
		super(
			StaticFieldPromptComponent,
			MockStaticFieldDirective,
			HostComponent
		);
	}


	protected defineTests(): void {
		super.defineTests();

		for(let type of promptedTypes)
			this.defineTestsForPromptedType(type);

		for(let type of unpromptedTypes)
			this.defineTestsForUnpromptedType(type);
	}


	private defineTestsForPromptedType(type: string): void {
		this.describeForType(type, () => {

			let checkForPrompt: () => void;


			it('should show prompt, if value is empty', () => {
				this.clearValue();

				this.expectChildDirective(MockStaticFieldDirective)
					.toBeFalsy();

				checkForPrompt();
			});


			checkForPrompt = () => {
				const expectedMessage = `Add ${this.hostComponent.label}`;

				this.checkChildTextContentIs(
					'span.faint',
					expectedMessage
				);
			};


			it('should show field, if value is set', () => {
				this.checkForFieldAndNotPrompt();
			});

		});
	}


	private describeForType(type: string, description: () => void): void {
		describe(`, of ${type} type,`, () => {

			beforeEach(() => {
				this.hostComponent.type = type;
			});


			description();

		});
	}


	private checkForFieldAndNotPrompt(): void {
		this.expectChildDirective(MockStaticFieldDirective).toBeTruthy();
		this.expectChildNativeElement('span.faint').toBeFalsy();
	}


	private defineTestsForUnpromptedType(type: string): void {
		this.describeForType(type, () => {

			describe('should show field,', () => {
				beforeEach(() => this.fixture.detectChanges());
				it('if value is empty', () => this.clearValue());
				it('if value is set', () => {});
				afterEach(() =>	this.checkForFieldAndNotPrompt());
			});

		});
	}

}


new StaticFieldPromptComponentTest();