import { async } from '@angular/core/testing';

import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

import { Dialogue, DialogueService } from './dialogue.service';
import { testDialogue } from 'testing';


describe('DialogueService', () => {

	let service: DialogueService;

	const dialogueHandler = 
		(dialogue: Dialogue) => Observable.of(null);
	
	const dialogueCanceller =
		(dialogue: Dialogue) => Observable.throw('Cancel');



	beforeEach(() => {
		service = new DialogueService();
	});


	it('should be able to register handler', () => {
		service.registerHandler(dialogueHandler);
	});


	it(`should call onOk when handler calls 'next'`, done => {
		service.registerHandler(dialogueHandler);
		service.show(testDialogue, done);
	});


	it('should call onCancel when handler throws error', done => {
		service.registerHandler(dialogueCanceller);
		const onOk = fail, onCancel = done;

		service.show(testDialogue, onOk, onCancel);
	});

});