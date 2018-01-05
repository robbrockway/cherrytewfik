// EditableFieldComponent is a switch between a StaticFieldPromptComponent (when not editing) and an EditComponent (when editing, as staff); it also provides the buttons (OkCancelComponent) for initiating an edit.


import { Component, DebugElement, Type } from '@angular/core';

import {
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
	tick,
} from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/never';
import 'rxjs/add/observable/throw';

import { EditableFieldComponent } from './editable.field.component';
import { SavingState } from './saving-message';
import { Piece, Model } from 'modules/main/models';

import {
	FieldHostComponent,
	FieldComponentTestBase,
} from 'modules/fields/field.component.test.base';

import {
	MockStaticFieldPromptDirective,
	MockEditButtonsDirective,
	MockEditDirective,
	MockSavingMessageDirective,
	MockFieldErrorDirective,
	getChildDirective,
	testPieceData,
	isSpy,
} from 'testing';



@Component({
	template: `
		<editable-field
			[type]="type"
			[object]="object"
			[propertyName]="propertyName"
			[label]="label"
			[prefixText]="prefixText"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			(load)="onLoad()"
			(startEdit)="onStartEdit()"
			(endEdit)="onEndEdit()"
		></editable-field>
	`,
})
class HostComponent extends FieldHostComponent {
	onStartEdit = jasmine.createSpy('onStartEdit');
	onEndEdit = jasmine.createSpy('onEndEdit');
}



// Some field types should give an 'inside' placement to EditButtonsComponent
const insideEditButtonsTypes = 
	['image', 'thumbnail', 'multiline', 'yearMonth', 'price'];

// and some should give 'outside'
const outsideEditButtonsTypes = ['string', 'categoryLink'];



class EditableFieldComponentTest extends FieldComponentTestBase {

	constructor() {
		// Run FieldComponentTestBase's tests to check parameters are passed to MockStaticFieldPromptDirective; when in edit mode, other tests are in place to check for right params
		super(
			EditableFieldComponent,
			MockStaticFieldPromptDirective,	
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();
		
		metadata.declarations.push(
			MockEditDirective,
			MockEditButtonsDirective,
			MockStaticFieldPromptDirective,
			MockSavingMessageDirective,
			MockFieldErrorDirective
		);

		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		const testPropertyName = 'property';
		const errorMessage = 'Error message';
		const errorFadeTime = 10000;

		let testObject: Piece;

		let getButtonContainer: () => DebugElement;
		let checkContainerForDirective: (type: Type<any>) => void;
		let getDirectiveFromButtonContainer: (type: Type<any>) => any;
		let wipeLabelAndUsePropertyName: (propertyName: string) => void;
		let pressButton: (buttonName: string) => void;
		let stopOperationFromCompleting: (operationName: string) => void;
		
		let checkForSavingMessageComponent: (
			expectedState: SavingState
		) => void;

		let testStaticFieldIsStillVisibleForImageTypes: () => void;
		let checkForErrorMessage: (message?: string) => void;
		let triggerTryAgainAfterError: () => void;
		let checkComponentIsInStaticView: () => void;


		beforeEach(() => {
			testObject = this.hostComponent.object;
		});


		it('should contain .buttonContainer', () => {
			expect(getButtonContainer()).toBeTruthy();
		});


		getButtonContainer = () => 
			this.getChildDebugElementByCss('.buttonContainer');


		it('should contain StaticFieldPromptComponent by default', () =>
			checkContainerForDirective(MockStaticFieldPromptDirective)
		);


		checkContainerForDirective = (type: Type<any>) => {
			const directive = getDirectiveFromButtonContainer(type);
			expect(directive).toBeTruthy();
		};


		getDirectiveFromButtonContainer = (type: Type<any>) => 
			getChildDirective(
				getButtonContainer(),
				type
			);


		it(`should pass propertyName to StaticFieldPromptComponent's `
				+ 'label param, in absence of a label', () => {
			
			wipeLabelAndUsePropertyName(testPropertyName);

			const mockStaticFieldPromptComponent =
				this.getChildDirective(MockStaticFieldPromptDirective);

			expect(mockStaticFieldPromptComponent.label)
				.toBe(testPropertyName);
		});


		// Clears label param and sets propertyName, which should then be used by label as a default
		wipeLabelAndUsePropertyName = (propertyName: string) => {
			this.hostComponent.label = undefined;
			this.hostComponent.propertyName = testPropertyName;
			this.fixture.detectChanges();
		};


		it('should contain EditButtonsComponent by default', () =>
			checkContainerForDirective(MockEditButtonsDirective)
		);


		describe(`'s EditButtonsComponent`, () => {

			let mockEditButtonsComponent: MockEditButtonsDirective;

			let testFieldTypesDeterminePlacementOfButtons: (
				fieldTypes: string[],
				expectedPlacement: string
			) => void;
			
			let clearValue: () => void;
			let deleteButLeaveHanging: () => void;
			let deleteButThrowError: (message?: string) => void;
			let clearTimers: () => void;


			beforeEach(() => {
				mockEditButtonsComponent = 
					getDirectiveFromButtonContainer(
						MockEditButtonsDirective
					);
			});


			it(`should be given an 'inside' placement when type calls for`
					+ 'it', () => {
				testFieldTypesDeterminePlacementOfButtons(
					insideEditButtonsTypes,
					'inside'
				);
			});


			testFieldTypesDeterminePlacementOfButtons = (
				fieldTypes: string[],
				expectedPlacement: string
			) => {
				for(let type of fieldTypes) {
					this.hostComponent.type = type;
					this.fixture.detectChanges();

					expect(mockEditButtonsComponent.placement)
						.toBe(expectedPlacement);
				}
			};


			it(`should be given an 'outside' placement when type calls `
					+ 'for it', () => {
				testFieldTypesDeterminePlacementOfButtons(
					outsideEditButtonsTypes,
					'outside'
				);
			});


			it(`should bind 'edit' and 'delete' events, `
					+ 'but no others',
					() => {

				const getBindingCount = (buttonName: string) =>
					mockEditButtonsComponent[buttonName].observers.length;

				expect(getBindingCount('up')).toBe(0);
				expect(getBindingCount('down')).toBe(0);
				expect(getBindingCount('edit')).toBe(1);
				expect(getBindingCount('delete')).toBe(1);
			});


			it(`should show 'delete' button, if field has value`, () => {
				expect(mockEditButtonsComponent.deleteVisible).toBe(true);
			});


			describe(`should hide 'delete' button,`, () => {

				it('if field has no value', () => {
					clearValue();
				});


				it(`if field has 'categoryLink' type`, () => {
					this.hostComponent.type = 'categoryLink';
					this.fixture.detectChanges();
				});


				afterEach(() => {
					expect(mockEditButtonsComponent.deleteVisible).toBe(false);
				});

			});

			
			clearValue = () => {
				this.hostComponent.propertyName = 'fakeProperty';
				this.fixture.detectChanges();
			};


			describe(`, when 'edit' is pressed,`, () => {

				beforeEach(fakeAsync(() => {
					pressButton('edit');
				}));


				it('should switch us to edit mode', fakeAsync(() => {
					this.expectChildDirective(MockEditDirective)
						.toBeTruthy();

					this.expectChildDirective(MockEditButtonsDirective)
						.toBeFalsy();	// gone!
				}));


				it('should hide StaticFieldPromptComponent, for non-image '
						+ 'types', () => {
					
					const nonImageTypes = [
						'string',
						'multiline',
						'price',
						'yearMonth',
						'categoryLink',
					];

					for(let type of nonImageTypes) {
						this.hostComponent.type = type;
						this.fixture.detectChanges();

						this.expectChildDirective(
							MockStaticFieldPromptDirective
						).toBeFalsy();
					}
				});


				it('should emit startEdit event', fakeAsync(() => {
					expect(this.hostComponent.onStartEdit)
						.toHaveBeenCalled();
				}));

			});


			it(`should request nullification of field when 'delete' is `
					+ 'pressed', fakeAsync(() => {
				
				// .update, and not .delete, is called because only the 'name' property, and not the whole object, is being deleted
				spyOn(testObject, 'update').and.callThrough();
				pressButton('delete');
				
				expect(testObject.update)
					.toHaveBeenCalledWith({image: null});
				
			}));


			it(`should show 'deleting' message after 'delete' is pressed`,
					fakeAsync(() => {
				
				deleteButLeaveHanging();

				checkForSavingMessageComponent(
					SavingState.Deleting
				);
			}));


			deleteButLeaveHanging = () => {
				stopOperationFromCompleting('update');
				pressButton('delete');
			};


			it('should keep StaticFieldPromptComponent visible while '
					+ `deleting, if type is 'thumbnail' or 'image'`,
					fakeAsync(() => {
				deleteButLeaveHanging();
				testStaticFieldIsStillVisibleForImageTypes();
			}));


			it(`should switch back to static mode when deletion is done`,
					fakeAsync(() => {
				
				spyOn(testObject, 'delete').and.returnValue(
					Observable.of(null)
				);

				pressButton('delete');
				this.fixture.detectChanges();
				
				checkContainerForDirective(MockStaticFieldPromptDirective);
				checkContainerForDirective(MockEditButtonsDirective);
			}));


			it('should show error message if one is thrown by deletion',
					fakeAsync(() => {
				deleteButThrowError();
				this.fixture.detectChanges();
				checkForErrorMessage();
				tick(errorFadeTime);
			}));


			deleteButThrowError = () => {
				const resultFromDeletion = Observable.throw(errorMessage);
				spyOn(testObject, 'update')
					.and.returnValue(resultFromDeletion);

				pressButton('delete');
				flushMicrotasks();
			};


			it('should try deletion again if FieldErrorComponent emits '
					+ 'tryAgain after error', fakeAsync(() => {
				deleteButThrowError();
				
				stopOperationFromCompleting('update');	// Make second deletion hang, so we can detect it	
				triggerTryAgainAfterError();
				
				checkForSavingMessageComponent(
					SavingState.Deleting
				);
				
				flushMicrotasks();
			}));


			clearTimers = () => flushMicrotasks();


			it('should switch back to static view after deletion error '
					+ 'has shown for a while', fakeAsync(() => {
				deleteButThrowError();
				tick(errorFadeTime);
				this.fixture.detectChanges();
				checkComponentIsInStaticView();
			}));

		});


		pressButton = (buttonName: string) => {
			const mockEditButtonsComponent = this.getChildDirective(
				MockEditButtonsDirective
			);

			mockEditButtonsComponent[buttonName].emit();

			flushMicrotasks();
			this.fixture.detectChanges();
		};


		// Blocks one of testObject's CRUD operations, so that we can check what's happening while work is in progress
		stopOperationFromCompleting = (operationName: string) => {
			const spyTarget = operationName as any;	// to get around the type checker

			if(!isSpy(testObject[spyTarget]))
				spyOn(testObject, spyTarget);

			const spy = testObject[spyTarget];
			spy.and.returnValue(Observable.never());
		};


		checkForSavingMessageComponent = (expectedState: SavingState) => {
			const mockSavingMessageComponent =
				this.getChildDirective(MockSavingMessageDirective);

			const expectedProperties = {
				state: expectedState,
				type: this.hostComponent.type,
			};

			expect(mockSavingMessageComponent).toEqual(
				jasmine.objectContaining(expectedProperties)
			);
		};


		// 'image' and 'thumbnail'-type fields still show the static image as a backdrop while editing/saving/deleting/showing an error, whereas other types will hide it
		testStaticFieldIsStillVisibleForImageTypes = () => {
			for(let type of ['image', 'thumbnail']) {
				this.hostComponent.type = type;
				this.fixture.detectChanges();

				this.expectChildDirective(MockStaticFieldPromptDirective)
					.toBeTruthy();
			}
		};


		checkForErrorMessage = (message = errorMessage) => {
			const mockFieldErrorComponent =
				this.getChildDirective(MockFieldErrorDirective);

			const expectedProperties = {
				message,
				type: this.hostComponent.type,
			};

			expect(mockFieldErrorComponent).toEqual(
				jasmine.objectContaining(expectedProperties)
			);
		};


		triggerTryAgainAfterError = () => {
			const mockFieldErrorComponent =
				this.getChildDirective(MockFieldErrorDirective);

			mockFieldErrorComponent.tryAgain.emit();
			flushMicrotasks();
			this.fixture.detectChanges();
		};


		// 'Static view' i.e. not 'editable view'
		checkComponentIsInStaticView = () => {
			this.expectChildDirective(MockEditDirective)
				.toBeFalsy();

			this.expectChildDirective(MockStaticFieldPromptDirective)
				.toBeTruthy();
			
			this.expectChildDirective(MockEditButtonsDirective)
				.toBeTruthy();
		};


		describe(', in edit mode,', () => {

			const newValue = 'newimage.jpg';
			let mockEditComponent: MockEditDirective;

			let triggerValueChange: () => void;
			let triggerValueChangeButLeaveHanging: () => void;
			let changeToNewValueSuccessfully: () => void;

			let changeToNewValueWithMockResult: (
				resultFromUpdate: Observable<any>
			) => void;

			let testErrorMessageDisplaysOnceThrown: (
				thrownMessage: string,
				messageExpectedToDisplay?: string
			) => void;

			let changeToNewValueButThrowError: (message?: string) => void;
			let triggerGiveUpAfterError: () => void;


			beforeEach(fakeAsync(() => {
				pressButton('edit');

				mockEditComponent =
					this.getChildDirective(MockEditDirective);
			}));


			it('should show prefix text', () => {
				this.checkChildTextContentIs(
					'editable-field',
					this.hostComponent.prefixText
				);
			});


			it('should keep StaticFieldPromptComponent visible behind '
					+ `EditComponent, if type is 'thumbnail' or 'image'`,
					() => {
				testStaticFieldIsStillVisibleForImageTypes();
			});


			it('should pass its current value to EditComponent', () => {
				expect(mockEditComponent.value).toBe(testObject.image);
			});


			it(`should pass its propertyName to EditComponent's label `
					+ 'param, in absence of a label', () => {

				wipeLabelAndUsePropertyName(testPropertyName);
				expect(mockEditComponent.label).toBe(testPropertyName);
			});


			it(`should update object when EditComponent's valueChange `
					+ 'is emitted', fakeAsync(() => {
				spyOn(testObject, 'update').and.callThrough();

				triggerValueChange();
				
				expect(testObject.update).toHaveBeenCalledWith(
					{image: newValue}
				);		
			}));


			triggerValueChange = () => {
				mockEditComponent.valueChange.emit(newValue);
				flushMicrotasks();
			};


			it(`should show 'saving' message after EditComponent's `
					+ 'valueChange is emitted', fakeAsync(() => {
				triggerValueChangeButLeaveHanging();
				this.expectChildDirective(MockEditDirective).toBeFalsy();
				checkForSavingMessageComponent(SavingState.Saving);
			}));


			triggerValueChangeButLeaveHanging = () => {
				stopOperationFromCompleting('update');
				triggerValueChange();
				this.fixture.detectChanges();
			};


			it('should keep StaticFieldPromptComponent visible while '
					+ `saving, for 'image' and 'thumbnail' types`,
					fakeAsync(() => {
				triggerValueChangeButLeaveHanging();
				testStaticFieldIsStillVisibleForImageTypes();		
			}));


			it('should return to static view after saving is done',
					fakeAsync(() => {
				changeToNewValueSuccessfully();
				checkComponentIsInStaticView();
			}));


			changeToNewValueSuccessfully = () => {
				const resultFromUpdate = Observable.of({image: newValue});
				changeToNewValueWithMockResult(resultFromUpdate);
			};


			changeToNewValueWithMockResult = (
				resultFromUpdate: Observable<any>
			) => {
				spyOn(testObject, 'update').and.returnValue(resultFromUpdate);
				triggerValueChange();
				this.fixture.detectChanges();
			};


			it('should emit endEdit event when saving is done',
					fakeAsync(() => {
				changeToNewValueSuccessfully();
				expect(this.hostComponent.onEndEdit).toHaveBeenCalled();
			}));


			it('should show error message if one is thrown by saving',
					fakeAsync(() => {
				testErrorMessageDisplaysOnceThrown(errorMessage);
			}));


			testErrorMessageDisplaysOnceThrown = (
				thrownMessage: string,
				messageExpectedToDisplay = thrownMessage
			) => {
				changeToNewValueButThrowError(thrownMessage);
				checkForErrorMessage(messageExpectedToDisplay);
				tick(errorFadeTime);
			};


			changeToNewValueButThrowError = (message = errorMessage) => {
				const result = Observable.throw(message);
				changeToNewValueWithMockResult(result);
			};


			it('should show default error message if thrown message is '
					+ 'empty', fakeAsync(() => {
				const defaultMessage = 'Error.';
				testErrorMessageDisplaysOnceThrown(null, defaultMessage);
			}));


			it('should keep StaticFieldPromptComponent visible while '
					+ `error is showing, for 'image' and 'thumbnail' `
					+ 'types', fakeAsync(() => {
				changeToNewValueButThrowError();
				testStaticFieldIsStillVisibleForImageTypes();
				tick(errorFadeTime);				
			}));


			it('should switch back to edit mode if FieldErrorComponent '
					+ 'emits tryAgain', fakeAsync(() => {
				changeToNewValueButThrowError();
				triggerTryAgainAfterError();
				
				this.expectChildDirective(MockEditDirective).toBeTruthy();
			}));


			it('should switch back to static view after error has '
					+ 'shown for a while', fakeAsync(() => {
				changeToNewValueButThrowError();
				tick(errorFadeTime);
				this.fixture.detectChanges();
				checkComponentIsInStaticView();
			}));


			it('should switch back to static view if FieldErrorComponent '
					+ 'emits giveUp', fakeAsync(() => {
				changeToNewValueButThrowError();
				triggerGiveUpAfterError();
				checkComponentIsInStaticView();
			}));


			triggerGiveUpAfterError = () => {
				const mockFieldErrorComponent =
					this.getChildDirective(MockFieldErrorDirective);

				mockFieldErrorComponent.giveUp.emit();
				flushMicrotasks();
				this.fixture.detectChanges();
			};


			it(`should clear error message's fade-out timer, if `
					+ `'try again' is clicked`, fakeAsync(() => {
				changeToNewValueButThrowError();
				triggerTryAgainAfterError();
			}));


			describe(`, once 'cancel' is emitted by EditComponent,`, 
					() => {

				beforeEach(async(() => {
					mockEditComponent.cancel.emit();
				}));


				it('should switch back to static view', () => {
					this.fixture.detectChanges();
					checkComponentIsInStaticView();
				});


				it('should emit endEdit event', () => {
					expect(this.hostComponent.onEndEdit)
						.toHaveBeenCalled();
				});

			});

		});

	}

}


new EditableFieldComponentTest();