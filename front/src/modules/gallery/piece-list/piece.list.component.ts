import { Component, Input } from '@angular/core';

import { StaticOrderedListComponent }
	from 'modules/shared/static-ordered-list';

import { Piece, Category, UserService } from 'modules/main/models';



@Component({
	selector: 'piece-list',
	templateUrl: './piece.list.component.html',
	styleUrls: ['./piece.list.component.scss'],
})
export class PieceListComponent
		extends StaticOrderedListComponent<Piece> {

	@Input() category: Category;


	constructor(private userService: UserService) {
		super();
	}

}