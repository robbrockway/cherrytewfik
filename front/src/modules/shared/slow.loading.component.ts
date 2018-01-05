// Special type of component that emits – at the subclass's behest – a 'load' event, designed to let the main view know when assets have loaded and are ready to display

import { Output, EventEmitter } from '@angular/core';



export abstract class SlowLoadingComponent {

	@Output() load = new EventEmitter<any>();


	onReady(): void {
		this.load.emit();
	}

}