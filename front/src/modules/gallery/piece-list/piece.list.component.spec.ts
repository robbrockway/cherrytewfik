import { Component } from '@angular/core';
import { async } from '@angular/core/testing';

import { OrderedListHostComponent }
	from 'modules/shared/static-ordered-list/static.ordered.list.component.test.base';

import { PieceListComponent } from './piece.list.component';
import { Piece } from 'modules/main/models';

import {
	StaticOrEditableComponentTest,
	StaticOrEditableSubcomponentProfile,
	StaticOrEditableSubcomponentProfiles,
	MockStaticPieceListDirective,
	MockEditablePieceListDirective,
	testPieceData,
	testCategoryData,
} from 'testing';



const categoryInstanceData = testCategoryData.instances[0];



@Component({
	template: `
		<piece-list
			[(objects)]="objects"
			[category]="category"
			(load)="onLoad()"
		></piece-list>			
	`,
})
class HostComponent extends OrderedListHostComponent<Piece> {

	category = categoryInstanceData.toModelInstance();

	constructor() {
		super(Piece);
	}

}



const subcomponentData = {
	static: {
		mockComponentType: MockStaticPieceListDirective,
		realComponentName: 'StaticPieceListComponent',
	},

	editable: {
		mockComponentType: MockEditablePieceListDirective,
		realComponentName: 'EditablePieceListComponent',
	},
};


const inputData = {
	objects: testPieceData.toListOfModelInstances(),
};



class PieceListComponentTest extends StaticOrEditableComponentTest {

	constructor() {
		super(PieceListComponent, HostComponent);
	}


	protected get subcomponentData(
	): StaticOrEditableSubcomponentProfiles {
		return subcomponentData;
	}


	protected get inputsToBeTransmitted(): any {
		return inputData;
	}


	protected defineTests(): void {
		super.defineTests();


		it(`should pass 'category' input on to `
				+ 'EditablePieceListComponent', async(() => {
			this.becomeStaff();
				
			this.checkSubcomponentMatchesHostComponentProperties(
				MockEditablePieceListDirective,
				['category']
			);
		}));

	}


	protected defineTestsWithSubcomponentType(
		correctProfile: StaticOrEditableSubcomponentProfile,
		incorrectProfile: StaticOrEditableSubcomponentProfile
	): void {

		super.defineTestsWithSubcomponentType(
			correctProfile,
			incorrectProfile
		);


		it('should re-emit objectsChange event from '
				+ correctProfile.realComponentName, async(() => {

			const mockSubcomponent = 
				this.getChildDirective(correctProfile.mockComponentType);

			mockSubcomponent.objectsChange.emit(inputData.objects);
			expect(this.hostComponent.objects).toBe(inputData.objects);
		}));

	}

}



new PieceListComponentTest();