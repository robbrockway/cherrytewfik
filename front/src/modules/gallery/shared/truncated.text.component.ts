// Chops a body of text off at a given limit, adding an ellipsis. HTML is entirely removed. Cut-off point is the last non-alphanumeric character (usually a space) before the limit.

import {
	Component,
	Input,
	SimpleChanges,
	SecurityContext,
} from '@angular/core';

import { DomSanitizer } from '@angular/platform-browser';



@Component({
	selector: 'truncated-text',
	templateUrl: './truncated.text.component.html',
})
export class TruncatedTextComponent {

	@Input() text: string;
	@Input() maxLength: number;

	truncatedText: string;


	constructor(private sanitizer: DomSanitizer) {}


	ngOnChanges(changes: SimpleChanges) {
		if(changes['text'])
			this.truncatedText = this.truncateText();
	}


	private truncateText(): string {
		const text = this.plainText;

		if(text.length <= this.maxLength)
			return text;	// short enough

		return this.chopAtLastNonAlphanumericBeforeLimit(text)
				+ '...';
	}


	// Remove HTML tags
	private get plainText(): string {
		const htmlTagPattern = /(<([^>]+)>)/ig;
		return this.textWithHtmlLinebreaksConverted
			.replace(htmlTagPattern, '');
	}


	// Converts <br/> etc to plain linebreaks
	private get textWithHtmlLinebreaksConverted(): string {
		// Paragraph close/open becomes one linebreak
		const text = this.text.replace('</p><p>', '\n');
		
		const htmlLinebreakPattern = /(<\/?(br|p)\s*\/?>)/ig;
		return text.replace(htmlLinebreakPattern, '\n');
	}


	private chopAtLastNonAlphanumericBeforeLimit(text: string): string {
		text = text.slice(0, this.maxLength);
		
		const lastNonAlphanumeric = /[^a-zA-Z0-9](?![\s\S]*[^a-zA-Z0-9])/g;
		const match = lastNonAlphanumeric.exec(text);

		if(match)
			return text.slice(0, match.index);

		// No non-alphanumeric characters
		return text;
	}

}