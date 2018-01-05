import { Component, Input, SimpleChanges } from '@angular/core';

import { Subject } from 'rxjs/Subject';

import {
	Category,
	Piece,
	PieceService,
	UserService,
} from 'modules/main/models';

import { NotificationService } from 'modules/main/notification';

import { EditableOrderedListComponent }
	from 'modules/staff/editable-ordered-list';



@Component({
	selector: 'editable-piece-list',
	templateUrl: './editable.piece.list.component.html',
	styleUrls: ['./editable.piece.list.component.scss'],
})
export class EditablePieceListComponent
		extends EditableOrderedListComponent<Piece> {

	@Input() category: Category;


	constructor(
		pieceService: PieceService,
		notificationService: NotificationService,
		userService: UserService
	) {
		super(pieceService, notificationService, userService);
	}


	protected get defaultPropertiesForNewObject(): any {
		return {category: this.category};
	}

}