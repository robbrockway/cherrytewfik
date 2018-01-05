// Base class for testing EditableOrderedListComponent derivatives. Includes some basic tests for reordering.

import { Type, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { 
	TestModuleMetadata,
	async,
	fakeAsync,
	flushMicrotasks,
	tick,
	inject,
} from '@angular/core/testing';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/never';

import {
	GalleryModel,
	ReorderableModelService,
	UserService,
} from 'modules/main/models';

import { NotificationService } from 'modules/main/notification';

import {
	StaticOrderedListComponentTest,
	OrderedListHostComponent,
} from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import {
	checkPKsAreEqual,
	checkChildTextContentIs,
	MockEditButtonsDirective,
	MockOrderedListItemDirective,
	getMostRecentCallArg,
} from 'testing';

import { getLastItem } from 'utils';

import { EditableOrderedListComponent }
	from './editable.ordered.list.component';



const reorderDebounceTime = 5000;



export abstract class EditableOrderedListComponentTest<T extends GalleryModel>
		extends StaticOrderedListComponentTest<T> {

	protected extraMockObject = new this.modelType(null);	// to be 'created' when 'Add new' button is pressed
	protected mockModelService: any;
	protected mockUserService: any;
	protected mockNotificationService: any;


	constructor(
		hostedComponentType: Type<EditableOrderedListComponent<T>>,
		hostComponentType: Type<OrderedListHostComponent<T>>,
		mockSubcomponentType: Type<MockOrderedListItemDirective<T>>,
		testName?: string
	) {
		super(
			hostedComponentType,
			hostComponentType,
			mockSubcomponentType,
			testName
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		metadata.providers = metadata.providers || [];

		metadata.providers.push(
			{
				provide: NotificationService,
				useValue: this.createMockNotificationService(),
			},
			{
				provide: UserService,
				useValue: this.createMockUserService(),
			},
			{
				provide: this.modelServiceType,
				useValue: this.createMockModelService(),
			}
		);

		metadata.declarations.push(MockEditButtonsDirective);

		return metadata;
	}


	protected abstract get modelServiceType():
		Type<ReorderableModelService<T>>;


	private createMockNotificationService(): any {
		return jasmine.createSpyObj(
			'NotificationService',
			['show']
		);
	}


	private createMockUserService(): any {
		const mockUserService = {
			isStaff: true,
		};

		return mockUserService;
	}


	private createMockModelService(): any {
		return {
			create: jasmine.createSpy('create')
				.and.returnValue(Observable.of(this.extraMockObject)),

			reorder: (objectsInNewOrder: T[]) =>
				Observable.of(objectsInNewOrder),

			modelType: this.modelType,

			destroy: (pk: number | string) =>
				Observable.of(null),
		};
	}


	protected abstract get modelType(): Type<T>;


	protected defineTests(): void {
		super.defineTests();

		const errorMessage = 'Error message';

		let expectNumberOfMockEditButtonsComponents: () => any;
		let getNumberOfMockEditButtonsComponents: () => number;

		let testButtonVisibility: (
			indexInList: number,
			upVisible: boolean,
			downVisible: boolean
		) => void;

		let testObjectsDisplayInNewOrder: (direction: string) => void;

		let reorderAndPerformCustomTest: (
			direction: string,
			checkObjectIsCorrectlyPlaced:
				(indexInList: number, expectedObject: T) => void
		) => void;

		let testObjectsAreStoredInternallyInNewOrder: (
			direction: string
		) => void;

		let prepareForFailedReorder: () => void;

		let initialObjects: T[];
			
		
		beforeEach(() => {
			initialObjects = this.hostComponent.objects;
		});

		
		const setMockServices = (
			mockModelService: ReorderableModelService<T>,
			mockUserService: UserService,
			mockNotificationService: NotificationService
		) => {
			this.mockModelService = mockModelService as any;
			this.mockUserService = mockUserService as any;
			this.mockNotificationService = mockNotificationService as any;
		};


		beforeEach(inject(
			[this.modelServiceType, UserService, NotificationService],
			setMockServices
		));
		


		it('should show all edit buttons if user is staff', () => {
			const numObjects = initialObjects.length;
			
			expectNumberOfMockEditButtonsComponents()
				.toBe(numObjects);
		});


		expectNumberOfMockEditButtonsComponents = () =>
			expect(getNumberOfMockEditButtonsComponents());


		getNumberOfMockEditButtonsComponents = () => {
			const allMockEditButtons = this.getAllChildDirectivesOfType(
				MockEditButtonsDirective
			);

			return allMockEditButtons.length;
		};


		it('should show no edit buttons if user is not staff', () => {
			this.mockUserService.isStaff = false;
			this.fixture.detectChanges();
			expectNumberOfMockEditButtonsComponents()
				.toBe(0);
		});


		it('should hide edit buttons while object is being deleted', () => {
			const initialNumberOfButtonsComponents =
				getNumberOfMockEditButtonsComponents();

			initialObjects[0].deleting = true;
			this.fixture.detectChanges();

			expectNumberOfMockEditButtonsComponents()
				.toBe(initialNumberOfButtonsComponents - 1);
		});


		it(`should show 'down', but not 'up', buttons `
				+ 'on top entry', () => {

			const indexInList = 0, upVisible = false, downVisible = true;
			testButtonVisibility(indexInList, upVisible, downVisible);
		});


		testButtonVisibility = (
			indexInList: number,
			upVisible: boolean,
			downVisible: boolean
		) => {
			const mockEditButtons = this.getMockEditButtons(indexInList);
			expect(mockEditButtons.upVisible).toBe(upVisible);
			expect(mockEditButtons.downVisible).toBe(downVisible);
		};


		it(`should show both 'up' and 'down' buttons `
				+ 'on intermediate entries', () => {

			const indexInList = 1, upVisible = true, downVisible = true;
			testButtonVisibility(indexInList, upVisible, downVisible);
		});


		it(`should show 'up', but not 'down', buttons `
				+ 'on bottom entry', () => {

			const indexInList = 2, upVisible = true, downVisible = false;
			testButtonVisibility(indexInList, upVisible, downVisible);
		});


		it('should switch object with previous one on-screen when '
				+ `'up' is clicked`, fakeAsync(() => {
			testObjectsDisplayInNewOrder('up');
		}));


		// direction should be 'up' or 'down'
		testObjectsDisplayInNewOrder = (direction: string) => {
			const testFunc = this.checkObjectIsDisplayedAtIndex.bind(this);
			reorderAndPerformCustomTest(direction, testFunc);
		};


		// checkObjectIsCorrectlyPlaced() might check the object is listed at the correct position in DOM, or check it's in the right place in the component's .objects array
		reorderAndPerformCustomTest = (
			direction: string,
			checkObjectIsCorrectlyPlaced: 
				(indexInList: number, expectedObject: T) => void
		) => {

			let indexOfClickedObject: number;
			let indexOfOtherObject: number;

			if(direction === 'up') {
				indexOfClickedObject = 2;
				indexOfOtherObject = 1;
			} else {
				indexOfClickedObject = 0;
				indexOfOtherObject = 1;
			}

			const clickedObject = initialObjects[indexOfClickedObject];
			const otherObject = initialObjects[indexOfOtherObject];

			this.triggerEditButton(indexOfClickedObject, direction);

			checkObjectIsCorrectlyPlaced(
				indexOfClickedObject,
				otherObject
			);

			checkObjectIsCorrectlyPlaced(
				indexOfOtherObject,
				clickedObject
			);

			this.waitForDebounce();
		};


		it('should switch object with next one on-screen when '
				+ `'down' is clicked`, fakeAsync(() => {
			testObjectsDisplayInNewOrder('down');
		}));


		it('should switch internal list order correctly when '
				+ `'up' is clicked`, fakeAsync(() => {
			testObjectsAreStoredInternallyInNewOrder('up');
		}));


		testObjectsAreStoredInternallyInNewOrder = (
			direction: string
		) => {
			const testFunc = 
				this.checkObjectIsStoredInternallyAtIndex
					.bind(this);

			reorderAndPerformCustomTest(direction, testFunc);
		};


		it('should switch internal list order correctly when '
				+ `'down' is clicked`, fakeAsync(() => {
			testObjectsAreStoredInternallyInNewOrder('down');
		}));


		describe(`should call .reorder() on the appropriate service `
				+ 'with newly-ordered list of objects as argument', () => {
			
			let reorderAndCheckServiceForRequest: (
				direction: string
			) => void;


			it('when moving up', fakeAsync(() => {
				reorderAndCheckServiceForRequest('up');
			}));


			reorderAndCheckServiceForRequest = (
				direction: string
			) => {

				let indexToMove: number;
				let expectedNewOrder: number[];

				if(direction === 'up') {
					indexToMove = 2;
					expectedNewOrder = [0, 2, 1];
				} else {
					indexToMove = 0;
					expectedNewOrder = [1, 0, 2];
				}

				const objectsInExpectedNewOrder =
					expectedNewOrder.map(
						(index: number) => initialObjects[index]
					);

				spyOn(this.mockModelService, 'reorder')
					.and.callThrough();

				this.triggerEditButton(indexToMove, direction);
				this.waitForDebounce();

				expect(this.mockModelService.reorder)
					.toHaveBeenCalledWith(objectsInExpectedNewOrder);
			};


			it('when moving down', fakeAsync(() => {
				reorderAndCheckServiceForRequest('down');
			}));

		});


		it('should show error notification when reordering fails', fakeAsync(() => {
			prepareForFailedReorder();

			this.triggerEditButton(0, 'down');
			this.waitForDebounce();

			const expectedErrorMessage = 'Error saving new sequence: '
				+ errorMessage;

			expect(this.mockNotificationService.show)
				.toHaveBeenCalledWith(expectedErrorMessage);
		}));


		prepareForFailedReorder = () =>
			spyOn(this.mockModelService, 'reorder')
				.and.returnValue(Observable.throw(errorMessage));


		describe(`'s 'delete' button`, () => {

			const testErrorMessage = 'Error';

			let pressDelete: () => void;
			let prepareForSuccessfulDeletion: () => void;
			let setDeletionReturnValue: (value: Observable<any>) => void;
			let prepareForFailedDeletion: () => void;


			it(`should call object's .delete() method when `
					+ 'pressed', fakeAsync(() => {

				const object = initialObjects[0];
				spyOn(object, 'delete').and.callThrough();
				pressDelete();
				expect(object.delete).toHaveBeenCalled();
			}));


			pressDelete = () =>
				this.triggerEditButton(0, 'delete');


			it('should remove object from internal list',
					fakeAsync(() => {

				prepareForSuccessfulDeletion();
				pressDelete();
				
				expect(this.hostComponent.objects.length)
					.toBe(initialObjects.length - 1);
			}));


			prepareForSuccessfulDeletion = () =>
				setDeletionReturnValue(Observable.of(null));


			setDeletionReturnValue = (value: Observable<any>) =>
				spyOn(initialObjects[0], 'delete')
					.and.returnValue(value);


			it('should remove object from displayed list',
					fakeAsync(() => {

				const initialSecondObject = initialObjects[1];
				prepareForSuccessfulDeletion();

				pressDelete();

				this.checkObjectIsDisplayedAtIndex(
					0,
					initialSecondObject
				);
			}));


			it('should show error notification when deletion fails',
					fakeAsync(() => {

				prepareForFailedDeletion();
				pressDelete();
				this.waitForDebounce();

				const actualErrorMessage = getMostRecentCallArg(
					this.mockNotificationService.show
				);
				
				expect(actualErrorMessage).toContain(testErrorMessage);
			}));


			prepareForFailedDeletion = () =>
				setDeletionReturnValue(Observable.throw(testErrorMessage));

		});


		describe(`, when 'add' button is pressed,`, () => {

			const expectedAddingMessage = 'Adding...';
			const errorMessage = 'Error';

			let pressAddNew: () => void;
			let stallAddingOfObject: () => void;
			let setCreationReturnValue: (value: Observable<T>) => void;
			let triggerUnsuccessfulCreation: () => void;
			let triggerSuccessfulCreation: () => void;
			let checkErrorHasDisappeared: () => void;


			it('should ask model service to create new object',
					async(() => {

				pressAddNew();
				expect(this.mockModelService.create).toHaveBeenCalled();
			}));

			
			pressAddNew = () => {
				const button = this.getChildNativeElementByCss('.addNew');
				button.click();
			};


			it('should create new object with correct properties',
					async(() => {

				pressAddNew();
				
				const properties =
					getMostRecentCallArg(this.mockModelService.create);

				expect(properties).toEqual(jasmine.objectContaining(
					this.expectedPropertiesForNewObject
				));
			}));


			it(`should show 'Adding' message while working`, async(() => {
				stallAddingOfObject();
				pressAddNew();
				this.fixture.detectChanges();

				this.checkChildTextContentIs(
					'.addNew .label',
					expectedAddingMessage
				);
			}));


			stallAddingOfObject = () =>
				setCreationReturnValue(Observable.never());


			setCreationReturnValue = (value: Observable<T>) =>
				this.mockModelService.create
					.and.returnValue(value);


			it(`shouldn't accept further click events while busy adding a `
					+ 'piece', async(() => {
				stallAddingOfObject();
				pressAddNew();
				
				this.fixture.detectChanges();
				this.mockModelService.create.calls.reset();
				pressAddNew();	// again!

				expect(this.mockModelService.create).not.toHaveBeenCalled();
			}));


			it('should return to regular message when finished', async(() => {
				pressAddNew();

				const label =
					this.getChildNativeElementByCss('.addNew .label');

				expect(label.textContent).not.toBe(expectedAddingMessage);
			}));


			it('should show error message, if thrown', async(() => {
				triggerUnsuccessfulCreation();
				this.checkChildTextContentIs('.error', errorMessage);
			}));

			
			triggerUnsuccessfulCreation = () => {
				setCreationReturnValue(Observable.throw(errorMessage));
				pressAddNew();
				this.fixture.detectChanges();
			};


			it('should hide error message when button is clicked again',
					async(() => {
				triggerUnsuccessfulCreation();
				triggerSuccessfulCreation();
				this.fixture.detectChanges();
				
				checkErrorHasDisappeared();
			}));


			triggerSuccessfulCreation = () => {
				setCreationReturnValue(Observable.of(this.extraMockObject));
				pressAddNew();
			};


			checkErrorHasDisappeared = () =>
				this.expectChildNativeElement('.error').toBeFalsy();


			it('should show new object', async(() => {
				setCreationReturnValue(Observable.of(this.extraMockObject));
				pressAddNew();
				this.fixture.detectChanges();

				// Since we're using a mock service, new object will have been added to .objectsInPresentedOrder but not to .objects; therefore, .objectsInPresentedOrder will be one item longer
				const lastIndex = this.hostComponent.objects.length;

				this.checkObjectIsDisplayedAtIndex(
					lastIndex,
					this.extraMockObject
				);
			}));

		});


		it('should show new list of objects, when list changes', () => {
			const newObjects = Array.from(initialObjects);
			newObjects.reverse();
			this.hostComponent.objects = newObjects;
			this.fixture.detectChanges();

			this.checkObjectsAreDisplayedInCorrectOrder();
		});

	}
	

	
	protected waitForDebounce(): void {
		tick(reorderDebounceTime);
	}


	// While the displayed list should update immediately on triggering a reorder, the internal .objects array should wait for a response from server; here we test that this has happened.
	protected checkObjectIsStoredInternallyAtIndex(
		indexInList: number,
		expectedObject: T
	): void {
		this.waitForDebounce();
		checkPKsAreEqual(
			this.hostComponent.objects[indexInList],
			expectedObject
		);
	}


	protected triggerEditButton(
		objectIndex: number,
		buttonName: string
	): void {
		const mockEditButtons = this.getMockEditButtons(objectIndex);
		mockEditButtons[buttonName].emit();

		flushMicrotasks();
		this.fixture.detectChanges();
	}


	private getMockEditButtons(
		objectIndex: number
	): MockEditButtonsDirective {

		const allDebugElements = this.fixture.debugElement.queryAll(
			By.directive(MockEditButtonsDirective)
		);

		const singleElement = allDebugElements[objectIndex];
		return singleElement.injector.get(MockEditButtonsDirective);
	}


	protected get expectedPropertiesForNewObject(): any {
		return {};
	}

}