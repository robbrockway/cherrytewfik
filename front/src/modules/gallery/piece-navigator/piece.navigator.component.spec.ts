import { Component, DebugElement } from '@angular/core';

import {
	TestModuleMetadata,
	fakeAsync,
	flushMicrotasks,
} from '@angular/core/testing';

import { Piece } from 'modules/main/models';

import { SlowLoadingHostComponent }
	from 'modules/shared/slow.loading.component.test.base';

import { SlowLoadingListComponentTest }
	from 'modules/shared/slow.loading.list.component.test.base';

import {
	MockPieceNavigatorButtonDirective,
	testPieceData,
	forEachEnumItem,
	forEachPair,
} from 'testing';

import { PieceNavigatorComponent } from './piece.navigator.component';
import { PieceNavigatorButton } from './piece.navigator.button';


enum ButtonTestIndex {
	Previous = 0,
	Random = 1,
	Next = 2,
};	// Numbers match with order in which buttons appear on page


type ButtonTestParams = {
	index: PieceNavigatorButton.Index,
	label: string,
	filename: string,
};


const expectedButtonData: ButtonTestParams[] = [

	{
		index: PieceNavigatorButton.Index.Previous,
		label: 'Previous',
		filename: 'previous.svg',
	},

	{
		index: PieceNavigatorButton.Index.Random,
		label: 'Random',
		filename: 'random.svg',
	},

	{
		index: PieceNavigatorButton.Index.Next,
		label: 'Next',
		filename: 'next.svg',
	},

];



@Component({
	template: `
		<piece-navigator
			[pieces]="pieces"
			[(currentPiece)]="currentPiece"
			(load)="onLoad()"
		></piece-navigator>
	`,
})
class HostComponent extends SlowLoadingHostComponent {
	pieces: Piece[] = testPieceData.toListOfModelInstances();
	currentPiece: Piece;
}



class PieceNavigatorComponentTest
		extends SlowLoadingListComponentTest<PieceNavigatorButton> {

	private mockPieceNavigatorButtonComponents:
		MockPieceNavigatorButtonDirective[];


	constructor() {
		super(
			PieceNavigatorComponent,
			HostComponent,
			MockPieceNavigatorButtonDirective
		);
	}


	protected defineTests(): void {
		super.defineTests();

		let buttons: PieceNavigatorButton[];

		let checkButtonHasParams: (
			button: PieceNavigatorButton,
			params: ButtonTestParams
		) => void;

		let viewFirstPiece: () => void;
		let viewPieceByIndex: (index: number) => void;
		let checkButtonIsDisabled: (index: ButtonTestIndex) => void;
		let checkButtonIsEnabled: (index: ButtonTestIndex) => void;
		let viewMiddlePiece: () => void;
		let viewLastPiece: () => void;
		let setPiecesArray: (array: Piece[]) => void;
		let pressButton: (buttonIndex: ButtonTestIndex) => void;
		let getSecondLastPiece: () => Piece;
		let getSecondPiece: () => Piece;
		let checkRandomButtonLeadsToDifferentPiece: () => void;


		beforeEach(() => {
			this.fixture.detectChanges();

			this.mockPieceNavigatorButtonComponents = 
				this.getAllChildDirectivesOfType(
					MockPieceNavigatorButtonDirective
				);

			buttons = this.mockPieceNavigatorButtonComponents.map(
				(component: any) => component.button
			);
		});


		it('should pass correct parameters to buttons', () => {
			forEachPair(buttons, expectedButtonData, checkButtonHasParams);
		});


		checkButtonHasParams = (
			button: PieceNavigatorButton,
			params: ButtonTestParams
		) => expect(button).toEqual(jasmine.objectContaining(params));


		it(`should disable 'previous' button and enable others when `
				+ 'viewing first piece', () => {

			viewFirstPiece();
			checkButtonIsDisabled(ButtonTestIndex.Previous);
			checkButtonIsEnabled(ButtonTestIndex.Random);
			checkButtonIsEnabled(ButtonTestIndex.Next);
		});


		viewFirstPiece = () => viewPieceByIndex(0);


		viewPieceByIndex = (index: number) => {
			this.hostComponent.currentPiece =
				this.hostComponent.pieces[index];

			this.fixture.detectChanges();
		};


		checkButtonIsEnabled = (index: ButtonTestIndex) =>
			expect(buttons[index].enabled).toBe(true);


		checkButtonIsDisabled = (index: ButtonTestIndex) =>
			expect(buttons[index].enabled).toBe(false);


		it('should enable all buttons when viewing middle piece', () => {
			viewMiddlePiece();
			forEachEnumItem(ButtonTestIndex, checkButtonIsEnabled);
		});


		viewMiddlePiece = () => viewPieceByIndex(1);


		it(`should disable 'next' button and enable others when viewing `
				+ 'last piece', () => {

			viewLastPiece();
			checkButtonIsEnabled(ButtonTestIndex.Previous);
			checkButtonIsEnabled(ButtonTestIndex.Random);
			checkButtonIsDisabled(ButtonTestIndex.Next);
		});


		viewLastPiece = () => {
			const index = this.hostComponent.pieces.length - 1;
			viewPieceByIndex(index);
		};


		describe('should disable all buttons', () => {

			it('when list contains one piece', () =>
				setPiecesArray([this.hostComponent.currentPiece])
			);

		
			it('when list contains no pieces', () =>
				setPiecesArray([])
			);


			it('when piece list is null', () => 
				setPiecesArray(null)
			);


			afterEach(() =>
				forEachEnumItem(ButtonTestIndex, checkButtonIsDisabled)
			);

		});


		setPiecesArray = (array: Piece[]) => {
			this.hostComponent.pieces = array;
			this.fixture.detectChanges();
		}


		it(`shouldn't take any click events from buttons that are `
				+ 'disabled', fakeAsync(() => {
			
			const initialPiece = this.hostComponent.currentPiece;

			forEachEnumItem(ButtonTestIndex, (index: number) => {
				buttons[index].enabled = false;
				pressButton(index);
				expect(this.hostComponent.currentPiece).toBe(initialPiece);
			});
		}));

		

		it(`should navigate to previous piece when 'previous' button is `
				+ 'pressed', fakeAsync(() => {

			viewLastPiece();
			pressButton(ButtonTestIndex.Previous);
			const secondLastPiece = getSecondLastPiece();
			expect(this.hostComponent.currentPiece).toBe(secondLastPiece);
		}));


		pressButton = (buttonIndex: ButtonTestIndex) => {
			const mockPieceNavigatorButtonComponent =
				this.mockPieceNavigatorButtonComponents[buttonIndex];

			mockPieceNavigatorButtonComponent.click.emit();
			flushMicrotasks();
			this.fixture.detectChanges();
		};


		getSecondLastPiece = () => {
			const pieces = this.hostComponent.pieces;
			const index = pieces.length - 2;
			return pieces[index];
		};

		
		it(`should navigate to next piece when 'next' button is pressed`,
				fakeAsync(() => {
			
			viewFirstPiece();
			pressButton(ButtonTestIndex.Next);
			const secondPiece = this.hostComponent.pieces[1];
			expect(this.hostComponent.currentPiece).toBe(secondPiece);
		}));


		it(`should navigate to some other piece than the current one, `
				+ `when 'random' button is pressed`, fakeAsync(() => {

			viewFirstPiece();

			for(let i = 0; i < 10; i++)
				checkRandomButtonLeadsToDifferentPiece();
		}));


		checkRandomButtonLeadsToDifferentPiece = () => {
			const initialPiece = this.hostComponent.currentPiece;
			pressButton(ButtonTestIndex.Random);

			expect(this.hostComponent.currentPiece)
				.not.toBe(initialPiece);
		};

	}

}


new PieceNavigatorComponentTest();