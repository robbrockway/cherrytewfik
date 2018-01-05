import { Component, SimpleChanges } from '@angular/core';

import { Piece } from 'modules/main/models';

import { OrderedListItemComponent }
	from 'modules/shared/static-ordered-list';



@Component({
	selector: 'editable-piece-list-item',
	templateUrl: './editable.piece.list.item.component.html',
	styleUrls: ['./editable.piece.list.item.component.scss'],
})
export class EditablePieceListItemComponent
		extends OrderedListItemComponent<Piece> {

	get deletingMessageShouldBeShrouded(): boolean {
		// Darken the image, if there is one
		return !!this.piece.image;
	}


	get piece(): Piece {
		return this.object;
	}

}