import { Component, Type } from '@angular/core';
import { TestModuleMetadata, async } from '@angular/core/testing';

import { FieldErrorComponent } from './field.error.component';
import { FieldErrorHostComponent } from './field.error.component.test.base';

import { typesPassedTo }
	from '../saving-message/saving.message.component.spec';

import {
	HostedComponentTest,
	MockFieldErrorDirectiveBase,
	MockPlainFieldErrorDirective,
	MockImageFieldErrorDirective,
} from 'testing';



@Component({
	template: `
		<field-error
			[type]="type"
			[message]="message"
			(tryAgain)="onTryAgain($event)"
			(giveUp)="onGiveUp()"
		></field-error>
	`,
})
class HostComponent extends FieldErrorHostComponent {
	type: string;
	onGiveUp = jasmine.createSpy('onGiveUp');
}



class FieldErrorComponentTest extends HostedComponentTest {

	constructor() {
		super(FieldErrorComponent, HostComponent);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		metadata.declarations.push(
			MockPlainFieldErrorDirective,
			MockImageFieldErrorDirective
		);

		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();


		beforeEach(() => {
			this.hostComponent.message = 'Error message';
		});


		for(let fieldType of typesPassedTo.plainSubcomponent) {
			this.defineTestsForFieldType(
				fieldType, 
				MockPlainFieldErrorDirective,
				'PlainFieldErrorComponent'
			);
		}


		for(let fieldType of typesPassedTo.imageSubcomponent) {
			this.defineTestsForFieldType(
				fieldType,
				MockImageFieldErrorDirective,
				'ImageFieldErrorComponent'
			);
		}


		describe('should emit giveUp', () => {

			let event: Event;


			it('when escape is pressed', () => {
				event = new KeyboardEvent('keyup', {key: 'escape'});
			});


			it('when window is clicked', () => {
				event = new MouseEvent('click');
			});


			afterEach(async(() => {
				window.dispatchEvent(event);
				expect(this.hostComponent.onGiveUp).toHaveBeenCalled();
			}));

		});

	}



	protected defineTestsForFieldType(
		fieldType: string,
		mockSubcomponentType: Type<MockFieldErrorDirectiveBase>,
		realSubcomponentName: string
	): void {

		describe(`, when '${fieldType}' type is used,`, () => {

			let emitTryAgainEvent: (event?: Event) => void;


			beforeEach(() => {
				this.hostComponent.type = fieldType;
				this.fixture.detectChanges();
			});


			it(`should pass error message to ${realSubcomponentName}`,
					() => {
				this.checkSubcomponentMatchesHostComponentProperties(
					mockSubcomponentType,
					['message']
				);
			});


			it(`should reemit tryAgain event from ${realSubcomponentName}`,
					async(() => {
				emitTryAgainEvent();
				expect(this.hostComponent.onTryAgain).toHaveBeenCalled();
			}));


			emitTryAgainEvent = (event?: Event) => {
				const mockSubcomponent =
					this.getChildDirective(mockSubcomponentType);

				mockSubcomponent.tryAgain.emit(event);
			};


			it('should stop tryAgain click event from bubbling up to '
					+ 'window', async(() => {
				const event = new Event('click');
				spyOn(event, 'stopPropagation');
				
				emitTryAgainEvent(event);

				expect(event.stopPropagation).toHaveBeenCalled();
			}));

		});

	}

}


new FieldErrorComponentTest();