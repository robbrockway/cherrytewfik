import { Component, Type } from '@angular/core';

import {
	TestModuleMetadata,
	inject,
	async,
} from '@angular/core/testing';

import { FieldComponent } from './field.component';
import { UserService } from 'modules/main/models/user';
import { Piece } from 'modules/main/models/piece';

import { FieldHostComponent } from './field.component.test.base';

import {
	StaticOrEditableComponentTest,
	StaticOrEditableSubcomponentProfiles,
	HostedComponentTest,
	MockStaticFieldDirective,
	MockEditableFieldDirective,
	testPieceData,
	mergeModuleMetadata,
} from 'testing';



@Component({
	template: `
		<field
			[object]="object"
			[propertyName]="propertyName"
			[type]="type"
			[label]="label"
			[widthList]="widthList"
			[rootDirectory]="rootDirectory"
			[prefixText]="prefixText"
			(load)="onLoad()"
		></field>
	`,
})
class HostComponent extends FieldHostComponent {}


		
const testData = testPieceData.instances[0];
const testObject = testData.toModelInstance();


const testInputs = {
	object: testObject,
	propertyName: 'image',
	type: 'image',
	label: 'label',
	prefixText: 'Prefix',
	widthList: [300, 450],
	rootDirectory: 'directory',
};


const subcomponentData = {	// Editable subcomponent shows when user is staff; static when not
	static: {
		mockComponentType: MockStaticFieldDirective,
		realComponentName: 'StaticFieldComponent',
	},

	editable: {
		mockComponentType: MockEditableFieldDirective,
		realComponentName: 'EditableFieldComponent',
	},
};



class FieldComponentTest extends StaticOrEditableComponentTest {

	constructor() {
		super(
			FieldComponent,
			HostComponent
		);
	}


	protected get subcomponentData(
	): StaticOrEditableSubcomponentProfiles {
		return subcomponentData;
	}


	protected get inputsToBeTransmitted(): any {
		return testInputs;
	}

}


new FieldComponentTest();