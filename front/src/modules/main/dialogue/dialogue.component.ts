import { Component } from '@angular/core';

import { Subject } from 'rxjs/Subject';

import { Dialogue, DialogueService } from './dialogue.service';



@Component({
	selector: 'dialogue',
	templateUrl: './dialogue.component.html',
	styleUrls: ['./dialogue.component.scss'],
})
export class DialogueComponent {

	visible: boolean = false;
	dialogue: Dialogue;
	private response$: Subject<any>;


	constructor(private dialogueService: DialogueService) {
		dialogueService.registerHandler((dialogue: Dialogue) => {
			this.response$ = new Subject<any>();
			this.show(dialogue);
			return this.response$;
		});
	}


	private show(dialogue: Dialogue): void {
		this.dialogue = dialogue;
		this.visible = true;
	}


	onOk(): void {
		this.response$.next();
		this.done();
	}


	private done(): void {
		this.visible = false;
		this.response$.complete();
	}


	onCancel(): void {
		this.response$.error(null);
		this.done();
	}

}