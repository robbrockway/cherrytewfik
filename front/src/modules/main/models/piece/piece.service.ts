import { Injectable, Injector } from '@angular/core';
import { Http } from '@angular/http';

import { ReorderableModelService }
	from '../reorderable.model.service';

import { Piece } from './piece';



@Injectable()
export class PieceService extends ReorderableModelService<Piece> {

	constructor(http: Http, injector: Injector) {
		super(Piece, http, injector);
	}


	get restEndpointName(): string {
		return 'piece';
	}

}
