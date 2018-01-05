import { Model } from '../model';

import {
	FieldDescriptor,
	StringFieldDescriptor,
} from '../field-descriptors';

import { UserService } from './user.service';



export interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	isStaff: boolean;
}



export class User extends Model {

	static fieldDescriptors: FieldDescriptor[] = [
		new FieldDescriptor('id'),
		new StringFieldDescriptor('firstName', 'first_name'),
		new StringFieldDescriptor('lastName', 'last_name'),
		new StringFieldDescriptor('email'),
		new FieldDescriptor('isStaff', 'is_staff'),
	];


	constructor(
		userService: UserService,
		properties?: any,
		isStub?: boolean
	) {
		super(userService, properties, isStub);
	}


	get fullName(): string {
		return [this.firstName, this.lastName].join(' ');
	}

}