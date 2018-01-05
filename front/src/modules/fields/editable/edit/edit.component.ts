// This component represents a model instance's field while it is actively being edited. Essentially a switch, which delegates to the appropriate component (StringEditComponent, DateEditComponent, etc) based on the chosen type.



import {
	Component,
	Input,
	Output,
	EventEmitter,
} from '@angular/core';

import { EditComponentBase } from './edit.component.base';



@Component({
	selector: 'edit',
	templateUrl: './edit.component.html',
})
export class EditComponent extends EditComponentBase<any> {

	@Input() type: string = 'string';


	onValueChange(newValue: any): void {
		this.valueChange.emit(newValue);
	}


	onCancel(): void {
		this.cancel.emit();
	}

}