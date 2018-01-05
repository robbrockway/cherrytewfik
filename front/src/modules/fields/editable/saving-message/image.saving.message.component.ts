// 'Uploading...' or 'Deleting...' message, in a box with a with a dark translucent background, to be used when altering image data

import { Component } from '@angular/core';

import { SavingMessageComponentBase } from './saving.message.component.base';



@Component({
	selector: 'image-saving-message',
	templateUrl: './image.saving.message.component.html',
})
export class ImageSavingMessageComponent extends SavingMessageComponentBase {
}