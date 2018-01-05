// All the necessary data to describe one of the previous/next/random buttons from PieceNavigatorComponent

const buttonsBasePath = 'images/buttons/piece-navigator';



export class PieceNavigatorButton {

	constructor(
		public index: PieceNavigatorButton.Index,	// for internal use
		public label: string,
		public filename: string,	// with no directory
		public enabled: boolean = false
	) {}
	

	get src(): string {
		return this.enabled ? this.enabledSrc : this.disabledSrc;
	}


	get disabledSrc(): string {
		const parts = 
			[buttonsBasePath, 'grey', this.filename];

		return parts.join('/');
	}


	get enabledSrc(): string {
		const parts =
			[buttonsBasePath, this.filename];

		return parts.join('/');
	}

}



export module PieceNavigatorButton {
	export enum Index {
		Previous,
		Random,
		Next,
	}
}
