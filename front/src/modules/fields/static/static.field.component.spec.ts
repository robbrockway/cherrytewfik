import { Component, Type } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { StaticFieldComponent } from './static.field.component';
import { Piece } from 'modules/main/models/piece';

import { FieldHostComponent }
	from 'modules/fields/field.component.test.base';


import {
	HostedComponentTest,
	MockFieldDirective,
	MockStaticStringFieldDirective,
	MockStaticPriceFieldDirective,
	MockStaticYearMonthFieldDirective,
	MockStaticImageFieldDirective,
	MockStaticThumbnailFieldDirective,
	MockStaticCategoryLinkFieldDirective,
	testPieceData,
} from 'testing';

import { getObjectPropertyValues } from 'utils';


@Component({
	template: `
		<static-field
			[object]="object"
			[propertyName]="propertyName"
			[type]="type"
			[label]="label"
			[prefixText]="prefixText"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			(load)="onLoad()"
		></static-field>
	`,
})
class HostComponent extends FieldHostComponent {}



// Each of these can, if its type is requested, be a subcomponent of StaticFieldComponent. Keys correspond to 'type' parameters as accepted by StaticFieldComponent
const mockSubcomponentTypes = {
	string: MockStaticStringFieldDirective,
	price: MockStaticPriceFieldDirective,
	yearMonth: MockStaticYearMonthFieldDirective,
	image: MockStaticImageFieldDirective,
	thumbnail: MockStaticThumbnailFieldDirective,
	categoryLink: MockStaticCategoryLinkFieldDirective,
};



// Doesn't inherit from FieldComponentTest, or even from SlowLoadingComponentTest, because loading behaviour is atypical
class StaticFieldComponentTest extends HostedComponentTest {

	constructor() {
		super(
			StaticFieldComponent,
			HostComponent
		);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		const subcomponentTypesList = 
			getObjectPropertyValues(mockSubcomponentTypes);

		metadata.declarations.push(...subcomponentTypesList);
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		const testData = testPieceData.instances[0];
		const testObject = testData.toModelInstance();

		const imageWidthList = [100, 200, 400];
		const imageRootDirectory = 'directory';


		let setComponentData: (
			object: any,
			propertyName: string,
			type: string,
			prefixText?: string
		) => void;

		let testSubcomponentIsGivenProperties: (
			mockSubcomponentType: Type<MockFieldDirective>,
			propertyName: string,
			type: string
		) => void;

		let checkSubcomponentHasObjectAndPropertyName: (
			mockDirectiveType: Type<MockFieldDirective>
		) => void;


		let testImageSubcomponentIsGivenProperties: (
			mockSubcomponentType: Type<MockFieldDirective>,
			propertyName: string,
			typeString: string
		) => void;


		let testSubcomponentTriggersLoadEvent: (
			subcomponentType: Type<MockFieldDirective>,
			typeString: string
		) => void;


		let triggerSubcomponentLoadEvent: (
			subcomponentType: Type<MockFieldDirective>
		) => void;


		describe(`'s prefix text`, () => {

			let checkPrefixTextIsVisible: () => void;
			let clearValue: () => void;
			let checkPrefixTextIsHidden: () => void;


			beforeEach(() => {
				setComponentData(
					testObject,
					'name',
					'string',
					'Prefix'
				);
			});


			it('should show, if field has value', () => {
				checkPrefixTextIsVisible();
			});


			checkPrefixTextIsVisible = () =>
				this.checkChildTextContentIs(
					'static-field',
					this.hostComponent.prefixText
				);


			it('should be hidden, if field has no value', () => {
				clearValue();
				checkPrefixTextIsHidden();
			});


			clearValue = () => {
				this.hostComponent.propertyName = 'fakeProperty';
				this.fixture.detectChanges();
			};


			checkPrefixTextIsHidden = () => 
				this.checkChildTextContentIs('static-field', '');

		});


		setComponentData = (
			object: any,
			propertyName: string,
			type: string,
			prefixText?: string,
		) => {

			Object.assign(
				this.hostComponent,
				{object, propertyName, type, prefixText}
			);

			this.fixture.detectChanges();
		};


		it('should delegate string value to StaticStringFieldComponent',
				() => {
			const propertyName = 'name';
			const type = 'string';

			testSubcomponentIsGivenProperties(
				MockStaticStringFieldDirective,
				propertyName,
				type
			);
		});


		it('should delegate multiline value to StaticStringFieldComponent '
				+ 'with .allowLinebreaks = true', () => {
			
			const propertyName = 'name';
			const type = 'multiline';

			testSubcomponentIsGivenProperties(
				MockStaticStringFieldDirective,
				propertyName,
				type
			);

			const subcomponent =
				this.getChildDirective(MockStaticStringFieldDirective);

			expect(subcomponent.allowLinebreaks).toBe(true);
		});


		// Ensures that the appropriate type-specific Static*FieldComponent is passed the properties it needs
		testSubcomponentIsGivenProperties = (
			mockDirectiveType: Type<MockFieldDirective>,
			propertyName: string,
			type: string
		) => {
			setComponentData(testObject, propertyName, type);
			checkSubcomponentHasObjectAndPropertyName(mockDirectiveType);
		};

		
		checkSubcomponentHasObjectAndPropertyName = (
			mockDirectiveType: Type<MockFieldDirective>
		) => {
			this.checkSubcomponentMatchesHostComponentProperties(
				mockDirectiveType,
				['object', 'propertyName']
			);
		};


		it('should delegate price value to StaticPriceFieldComponent',
				() => {
			const propertyName = 'price';
			const type = 'price';
			
			testSubcomponentIsGivenProperties(
				MockStaticPriceFieldDirective,
				propertyName,
				type
			);
		});


		it('should delegate year/month value to StaticYearMonthFieldComponent',
				() => {
			const propertyName = 'date';
			const type = 'yearMonth';

			testSubcomponentIsGivenProperties(
				MockStaticYearMonthFieldDirective,
				propertyName,
				type
			);
		});


		it('should delegate image value to StaticImageFieldComponent, '
				+ 'including image-specific parameters', () => {
			
			const propertyName = 'image';
			const type = 'image';

			testImageSubcomponentIsGivenProperties(
				MockStaticImageFieldDirective,
				propertyName,
				type
			);
		});


		// Includes testing for image-specific properties
		testImageSubcomponentIsGivenProperties = (
			subcomponentType: Type<MockFieldDirective>,
			propertyName: string,
			typeString: 'image' | 'thumbnail'
		) => {
			this.hostComponent.widthList = imageWidthList;
			this.hostComponent.rootDirectory = imageRootDirectory;

			setComponentData(
				testObject,
				propertyName,
				typeString,
			);

			const propertyNamesToCheck = [
				'object',
				'propertyName',
				'widthList',
				'rootDirectory',
			];

			this.checkSubcomponentMatchesHostComponentProperties(
				subcomponentType,
				propertyNamesToCheck,
			);
		};


		it('should delegate thumbnail-typed value to '
				+ 'StaticThumbnailFieldComponent, '
				+ 'including image-specific parameters', () => {

			const propertyName = 'image';
			const type = 'thumbnail';

			testImageSubcomponentIsGivenProperties(
				MockStaticThumbnailFieldDirective,
				propertyName,
				type
			);
		});


		it('should delegate category value to '
				+ 'StaticCategoryLinkFieldComponent', () => {

			const propertyName = 'category';
			const type = 'categoryLink';

			testSubcomponentIsGivenProperties(
				MockStaticCategoryLinkFieldDirective,
				propertyName,
				type
			);
		});


		it(`shouldn't emit load event before subcomponent has loaded`,
				() => {
			this.fixture.detectChanges();
			expect(this.hostComponent.onLoad).not.toHaveBeenCalled();
		});


		it('should emit load event once subcomponent has loaded, '
				+ 'regardless of type', fakeAsync(() => {
			
			for(let typeString of Object.keys(mockSubcomponentTypes)) {
				const subcomponentType = mockSubcomponentTypes[typeString];

				testSubcomponentTriggersLoadEvent(
					subcomponentType,
					typeString
				);
			}
			
		}));


		// Switches to the requested type, before testing that a load event from the subcomponent of this type triggers the parent component's own load event
		testSubcomponentTriggersLoadEvent = (
			subcomponentType: Type<MockFieldDirective>,
			typeString: string
		) => {
			this.hostComponent.type = typeString;
			this.fixture.detectChanges();

			expect(this.hostComponent.onLoad).not.toHaveBeenCalled(); // yet!

			triggerSubcomponentLoadEvent(subcomponentType);
			expect(this.hostComponent.onLoad).toHaveBeenCalled();

			this.component.onLoad.calls.reset();	// clean slate for next subcomponent
		};


		triggerSubcomponentLoadEvent = (
			subcomponentType: Type<MockFieldDirective>
		) => {
			const mockSubcomponent =
				this.getChildDirective(subcomponentType);

			mockSubcomponent.load.emit();
			flushMicrotasks();
		};

	}

}


new StaticFieldComponentTest();


