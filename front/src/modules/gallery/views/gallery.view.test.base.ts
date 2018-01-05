// Base class for testing subclasses of GalleryView; tests that any FieldComponents in view are displaying the correct data, and that this changes when the router navigates to a new instance

import { Type } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { ActivatedRoute, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import {
	GalleryModel,
	ModelService,
	FieldDescriptor,
	CategorySelector,
	Category,
} from 'modules/main/models';

import { GalleryView } from './gallery.view';
import { getStaticMember } from 'utils';
import { ViewTest } from 'modules/shared/view.test.base';

import {
	ModelTestData,
	MockFieldDirective,
	mergeModuleMetadata,
} from 'testing';



type RouteParams = {pk: string};


export abstract class GalleryViewTest<T extends GalleryModel>
		extends ViewTest {

	protected mockModelService: any;
	protected mockActivatedRoute: any;
	protected mockCategorySelector: any;
	protected route$: Subject<RouteParams>;	  // Will be subscribed to by component. Give it routes.
	protected currentInstance: T;	// ...being displayed



	constructor(
		componentType: Type<GalleryView<T>>,
		private modelType: Type<T>,
		private modelServiceType: Type<ModelService<T>>,
		protected testData: ModelTestData<T>
	) {
		super(componentType);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const defaultMetadata = super.getModuleMetadata();

		this.mockModelService = this.createMockModelService();
		this.mockActivatedRoute = this.createMockActivatedRoute();
		this.mockCategorySelector = this.createMockCategorySelector();

		const extraMetadata = {
			declarations: [
				MockFieldDirective,
			],

			providers: [
				{
					provide: this.modelServiceType,
					useValue: this.mockModelService,
				},

				{
					provide: ActivatedRoute,
					useValue: this.mockActivatedRoute,
				},

				{
					provide: CategorySelector,
					useValue: this.mockCategorySelector,
				},
			],

			imports: [
				RouterTestingModule.withRoutes(this.routes),
			],
		};

		return mergeModuleMetadata(defaultMetadata, extraMetadata);
	}


	protected createMockModelService(): any {
		this.currentInstance = this.createModelInstance();

		return {
			lazyRetrieve: (pk: any) => 
				Observable.of(this.currentInstance),
		};
	}


	// Uses different data depending on index (see testing/data/datasets.ts)
	private createModelInstance(index: number = 0): T {
		const instanceData = this.testData.instances[index];
		return instanceData.toModelInstance();
	}


	private createMockActivatedRoute(): any {		
		this.route$ = new Subject<RouteParams>();

		return {
			params: this.route$.asObservable(),
		};
	}


	private createMockCategorySelector(): any {
		return jasmine.createSpyObj('CategorySelector', ['select']);
	}


	private get routes(): Routes {
		const modelName = this.modelType.name.toLowerCase();

		return [{
			path: `gallery/${modelName}/:pk`, 
			component: this.componentType,
		}];
	}


	protected defineTests(): void {
		super.defineTests();

		let emitRoute: (instanceToView?: T) => void;

		let forEachField: (
			func: (mockFieldComponent: MockFieldDirective) => void
		) => void;

		let checkInstanceOnDisplayIs: (instance: T) => void;


		beforeEach(fakeAsync(() => {
			this.fixture.detectChanges();
			emitRoute();	// Navigate to piece
		}));


		// Prompts the component, via ActivatedRoute, to navigate to a new instance
		emitRoute = (instanceToView: T = this.currentInstance) => {
			const routeParams = {pk: instanceToView.pk.toString()};
			this.route$.next(routeParams);
			flushMicrotasks();
			this.fixture.detectChanges();
		};


		describe(`'s fields`, () => {

			it('should all be given the correct object', () => {
				forEachField(
					(mockFieldComponent: MockFieldDirective) =>
						expect(mockFieldComponent.object)
							.toBe(this.currentInstance)
				);
			});


			it('should all be given a valid property name', () => {
				const validPropertyNames = this.fieldDescriptors.map(
					(fieldDescriptor: FieldDescriptor) => fieldDescriptor.tsName
				);

				forEachField(
					(mockFieldComponent: MockFieldDirective) =>
						expect(validPropertyNames)
							.toContain(mockFieldComponent.propertyName)
				);
			});

		});


		forEachField = (
			func: (mockFieldComponent: MockFieldDirective) => void
		) => {
			const mockFieldComponents = 
				this.getAllChildDirectivesOfType(MockFieldDirective);

			for(let mockFieldComponent of mockFieldComponents)
				func(mockFieldComponent);
		};


		describe(`, when app's route changes,`, () => {

			let newInstance: T;


			beforeEach(fakeAsync(() => {
				newInstance = this.createModelInstance(1);
				this.currentInstance = newInstance;	// so that mock piece service provides it to component
				emitRoute(newInstance);
			}));


			it('should show load screen', () => {
				expect(this.mockLoadScreenService.show).toHaveBeenCalled();
			});


			it('should switch to new instance',	() => {
				checkInstanceOnDisplayIs(newInstance);
			});


			it('should select the appropriate category, using '
					+ 'CategorySelector', () => {
				expect(this.mockCategorySelector.select)
					.toHaveBeenCalledWith(this.expectedCategoryToHighlight);
			});

		});


		checkInstanceOnDisplayIs = (instance: T) => {
			forEachField(
				(mockFieldComponent: MockFieldDirective) =>
					expect(mockFieldComponent.object).toBe(instance)
			);
		};


		it('should deselect category through CategorySelector, '
				+ 'on destruction', () => {
			this.fixture.destroy();

			expect(this.mockCategorySelector.select)
				.toHaveBeenCalledWith(null);
		});
		
	}


	// Should return whichever category is expected to be selected through CategorySelector
	protected abstract get expectedCategoryToHighlight(): Category;


	private get fieldDescriptors(): FieldDescriptor[] {
		return getStaticMember(this.modelType, 'fieldDescriptors');
	}

}