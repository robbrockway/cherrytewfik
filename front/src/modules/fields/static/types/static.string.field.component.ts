import { Component, Input } from '@angular/core';

import { FastLoadingStaticFieldComponent }
	from '../fast.loading.static.field.component';



@Component({
	selector: 'static-string-field',
	templateUrl: './plain.static.field.component.html',
})
export class StaticStringFieldComponent
		extends FastLoadingStaticFieldComponent<string> {

	@Input() allowLinebreaks: boolean = false;


	get renderedValue(): string {
		
		try {
			let value = this.value;
			
			if(!this.allowLinebreaks)
				value = this.removeLinebreaks(value);

			return value;
		} catch(TypeError) {
			return '';
		}
	
	}


	private removeLinebreaks(html: string): string {
		return html.replace('</p>', '')	// Don't replace </p> with a space; just remove it
			.replace(/<(\/)?(br|p)[^>]*(\/)?>/g, ' ');
	}

}
