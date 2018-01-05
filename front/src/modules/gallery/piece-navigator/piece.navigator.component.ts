// Previous/next/random buttons for piece view; takes list of pieces and controls which one is being viewed

import {
	Component,
	Input,
	Output,
	EventEmitter,
	SimpleChanges,
} from '@angular/core';

import { SlowLoadingListComponent } from 'modules/shared';
import { Piece } from 'modules/main/models';
import { removeFromArray } from 'utils';
import { PieceNavigatorButton } from './piece.navigator.button';



@Component({
	selector: 'piece-navigator',
	templateUrl: './piece.navigator.component.html',
	styleUrls: ['./piece.navigator.component.scss'],
})
export class PieceNavigatorComponent 
		extends SlowLoadingListComponent<PieceNavigatorButton> {

	@Input() pieces: Piece[];
	@Input() currentPiece: Piece;
	@Output() currentPieceChange = new EventEmitter<Piece>();

	buttons = [

		new PieceNavigatorButton(
			PieceNavigatorButton.Index.Previous,
			'Previous',
			'previous.svg'
		),
		
		new PieceNavigatorButton(
			PieceNavigatorButton.Index.Random,
			'Random',
			'random.svg'
		),
		
		new PieceNavigatorButton(
			PieceNavigatorButton.Index.Next,
			'Next',
			'next.svg'
		),
	
	];



	constructor() {
		super();
		this.itemsYetToLoad = Array.from(this.buttons);	// Will be ticked off as subcomponents load
	}


	ngOnChanges(changes: SimpleChanges): void {
		this.enableAppropriateButtons();
	}


	private enableAppropriateButtons(): void {
		if(!this.hasMoreThanOnePiece)
			this.disableAllButtons();
		else if(this.showingFirstPiece)
			this.enableAllButtonsExceptPrevious();
		else if(this.showingLastPiece)
			this.enableAllButtonsExceptNext();
		else
			this.enableAllButtons();
	}


	private get hasMoreThanOnePiece(): boolean {
		return !!(this.pieces && this.pieces.length > 1);
	}


	private disableAllButtons(): void {
		for(let button of this.buttons)
			button.enabled = false;
	}


	private get showingFirstPiece(): boolean {
		return this.currentPieceIndex === 0;
	}


	private get currentPieceIndex(): number {
		return this.pieces.indexOf(this.currentPiece);
	}


	private enableAllButtonsExceptPrevious(): void {
		for(let button of this.buttons)
			button.enabled =
				button.index !== PieceNavigatorButton.Index.Previous;
	}


	private get showingLastPiece(): boolean {
		const lastPieceIndex = this.pieces.length - 1;
		return this.currentPieceIndex === lastPieceIndex;
	}


	private enableAllButtonsExceptNext(): void {
		for(let button of this.buttons)
			button.enabled =
				button.index !== PieceNavigatorButton.Index.Next;
	}


	private enableAllButtons(): void {
		for(let button of this.buttons)
			button.enabled = true;
	}


	onButtonPress(button: PieceNavigatorButton): void {
		if(!button.enabled)
			return;

		switch(button.index) {
		case PieceNavigatorButton.Index.Previous:
			this.onPrevious();
			break;
		case PieceNavigatorButton.Index.Random:
			this.onRandom();
			break;
		case PieceNavigatorButton.Index.Next:
			this.onNext();
		}
	}


	private onPrevious(): void {
		this.goToPieceIndex(this.currentPieceIndex - 1);
	}


	private goToPieceIndex(index: number): void {
		this.currentPieceChange.emit(
			this.pieces[index]
		);
	}

	
	private onRandom(): void {
		const index = this.chooseFreshRandomPieceIndex();
		this.goToPieceIndex(index);
	}


	// i.e. not the current index
	private chooseFreshRandomPieceIndex(): number {
		let index: number;

		do {
			index = this.chooseRandomPieceIndex();
		} while(index === this.currentPieceIndex);

		return index;
	}


	private chooseRandomPieceIndex(): number {
		return Math.floor(
			Math.random() * this.pieces.length
		);
	}


	private onNext(): void {
		this.goToPieceIndex(this.currentPieceIndex + 1);
	}

}