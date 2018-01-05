import {
	Component,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';

import { SlowLoadingComponent, ImagePreloader } from 'modules/shared';
import { PieceNavigatorButton } from './piece.navigator.button';



@Component({
	selector: 'piece-navigator-button',
	templateUrl: 'piece.navigator.button.component.html',
	styleUrls: ['piece.navigator.button.component.scss'],
})
export class PieceNavigatorButtonComponent extends SlowLoadingComponent {

	@Input() button: PieceNavigatorButton;

	
	constructor(private preloader: ImagePreloader) {
		super();
	}


	ngOnInit(): void {
		const onComplete = () => this.load.emit();

		this.preloader.loadImages(
			this.button.enabledSrc,
			this.button.disabledSrc
		).subscribe(null, null, onComplete);
	}

}