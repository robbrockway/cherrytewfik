import { Component } from '@angular/core';

import { View } from 'modules/shared';

import {
	Piece,
	PieceService,
	TableStringService,
	StringTable,
} from 'modules/main/models';

import { LoadScreenService } from 'modules/main/load-screen';



@Component({
	templateUrl: './home.view.html',
	styleUrls: ['./home.view.scss'],
})
export class HomeView extends View {

	pieces: Piece[];
	stringTable: StringTable;
	private numSubcomponentsYetToLoad = 4;


	constructor(
		loadScreenService: LoadScreenService,
		private pieceService: PieceService,
		private tableStringService: TableStringService
	) {
		super(loadScreenService);

		pieceService.lazyList().subscribe(
			(pieces: Piece[]) => this.pieces = pieces
		);

		tableStringService.dict().subscribe(
			(stringTable: StringTable) =>
				this.stringTable = stringTable
		);
	}


	onSubcomponentLoad(): void {
		this.numSubcomponentsYetToLoad--;

		if(!this.numSubcomponentsYetToLoad)
			this.onReady();
	}

}