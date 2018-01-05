// Base class for views, i.e. components that are endpoints for the router. Sending of hide/show messages to LoadScreenService is built in.

import { LoadScreenService } from 'modules/main/load-screen';



export abstract class View {

	constructor(protected loadScreenService: LoadScreenService) {}


	// To be called from subclasses, when the view has loaded and is ready to show
	onReady(): void {
		this.loadScreenService.hide();
	}


	ngOnDestroy(): void {
		this.loadScreenService.show();
	}

}