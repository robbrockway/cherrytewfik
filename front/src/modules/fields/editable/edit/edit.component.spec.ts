import { Component, Type } from '@angular/core';
import { async,	TestModuleMetadata } from '@angular/core/testing';

import { EditComponent } from './edit.component';
import { EditHostComponent } from './edit.component.test.base';

import {
	MockStringEditDirective,
	MockPriceEditDirective,
	MockYearMonthEditDirective,
	MockImageEditDirective,
	MockCategoryLinkEditDirective,
	HostedComponentTest,
	testCategoryData,
} from 'testing';

import { forEachProperty } from 'utils';



@Component({
	template: `
		<edit [type]="type"
			[label]="label"
			[(value)]="value"
			(cancel)="onCancel()"
		></edit>`,
})
class HostComponent extends EditHostComponent<any> {
	type: string;
}


const categoryInstanceData = testCategoryData.instances[0];
const testCategory = categoryInstanceData.toModelInstance();


// Data for testing that each type causes the correct [...]EditComponent to be used, e.g. 'string' -> StringEditComponent
type FieldTypeData = {testValue: any, mockSubcomponentType: Type<any>};

const types: {[key: string]: FieldTypeData} = {
	string: {
		testValue: 'String value',
		mockSubcomponentType: MockStringEditDirective,
	},

	multiline: {
		testValue: 'Multiline value',
		mockSubcomponentType: MockStringEditDirective,
	},

	price: {
		testValue: 49.99,
		mockSubcomponentType: MockPriceEditDirective,
	},

	image: {
		testValue: 'image.jpg',
		mockSubcomponentType: MockImageEditDirective,
	},

	thumbnail: {
		testValue: 'thumbnail.jpg',
		mockSubcomponentType: MockImageEditDirective,
	},

	categoryLink: {
		testValue: testCategory,
		mockSubcomponentType: MockCategoryLinkEditDirective,
	},

};


const testLabel = 'label';



class EditComponentTest extends HostedComponentTest {

	constructor() {
		super(
			EditComponent,
			HostComponent
		);
	}

	
	protected getModuleMetadata(): TestModuleMetadata {
		const metadata = super.getModuleMetadata();

		metadata.declarations.push(
			MockStringEditDirective,
			MockPriceEditDirective,
			MockYearMonthEditDirective,
			MockImageEditDirective,
			MockCategoryLinkEditDirective
		);
		
		return metadata;
	}


	protected defineTests(): void {
		super.defineTests();

		forEachProperty(
			types,
			(typeName: string, data: FieldTypeData) =>
				this.defineTestsForFieldType(typeName, data)
		);


		describe('should set StringEditComponent.allowLinebreaks', () => {

			let expectAllowLinebreaks: () => any;


			it(`to false, for 'string' type`, () => {
				this.setData('string');
				expectAllowLinebreaks().toBe(false);
			});


			expectAllowLinebreaks = () => {
				const mockStringEditComponent =
					this.getChildDirective(MockStringEditDirective);

				return expect(mockStringEditComponent.allowLinebreaks);
			};


			it(`to true, with 'multiline' type`, () => {
				this.setData('multiline');
				expectAllowLinebreaks().toBe(true);
			});

		});

	}


	// For one particular type ('string', 'price', etc), this checks that data is successfully sent to and received from the appropriate subcomponent (StringEditComponent, PriceEditComponent, etc).
	private defineTestsForFieldType(
		typeName: string,
		data: FieldTypeData
	): void {
		const subcomponentName = data.mockSubcomponentType.name;

		const getSubcomponent = () =>
			this.getChildDirective(data.mockSubcomponentType);


		describe(`, with '${typeName}' type,`, () => {

			it(`should pass label and value to ${subcomponentName}`, () => {
				this.setData(typeName, data.testValue, testLabel);

				this.checkSubcomponentMatchesHostComponentProperties(
					data.mockSubcomponentType,
					['label', 'value']
				);
			});


			it('should re-emit valueChange event emitted by '
					+ subcomponentName, async(() => {
				this.setData(typeName, '');
				const mockSubcomponent = getSubcomponent();
				mockSubcomponent.valueChange.emit(data.testValue);
				expect(this.hostComponent.value).toBe(data.testValue);
			}));


			it(`should re-emit cancel event emitted by ${subcomponentName}`,
					async(() => {
				this.setData(typeName);
				const mockSubcomponent = getSubcomponent();
				mockSubcomponent.cancel.emit();
				expect(this.hostComponent.onCancel).toHaveBeenCalled();
			}));
		
		});

	}


	private setData(
		newType: string,
		newValue?: any,
		newLabel?: string
	): void {
		this.hostComponent.type = newType;
		
		if(newValue !== undefined)
			this.hostComponent.value = newValue;

		if(newLabel !== undefined)
			this.hostComponent.label = newLabel;
		
		this.fixture.detectChanges();
	}

}


new EditComponentTest();

