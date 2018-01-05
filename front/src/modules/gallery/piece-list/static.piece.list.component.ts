// Static, uneditable gallery; this is replaced by StaffModule's version of PieceListComponent once a staff user logs in and the module is lazy-loaded.


import { Component } from '@angular/core';

import { StaticOrderedListComponent }
	from 'modules/shared/static-ordered-list';

import { Piece } from 'modules/main/models';



@Component({
	selector: 'static-piece-list',
	templateUrl: './static.piece.list.component.html',
})
export class StaticPieceListComponent extends
		StaticOrderedListComponent<Piece> {}