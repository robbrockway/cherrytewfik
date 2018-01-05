// Set of properties for one instance of a model, used for testing


import { Type } from '@angular/core';

import {
	Model,
	ModelService,
	FieldDescriptor,
} from 'modules/main/models';

import { TestField } from './test.field';
import { createMockLinkedObjectService } from '../utils';

import {
	getStaticMember,
	getFirstItemWhere,
} from 'utils';



export class ModelInstanceTestData<T extends Model> {

	static mockLinkedObjectService = createMockLinkedObjectService();

	constructor(
		protected modelType: Type<T>,
		public defaultLinkDepth: number = 0,
		protected fields: TestField[] = []
	) {}


	addField(field: TestField): void {
		this.fields.push(field);
	}


	// linkDepth is the number of degrees of separation tolerated between linked objects, e.g. for a Piece:
	//		0 results in a plain Piece with a Category PK included, but no actual Category
	//		1 results in a Piece with its Category included, but just a list of the PKs of the Category's constituent Pieces
	//		2 results in a Piece with its Category, and all the Category's Pieces, each of which refers back to the Category's PK
	toModelInstance(
		modelService: ModelService<T> = this.defaultModelService,
		linkDepth: number = this.defaultLinkDepth
	): T {
		return new this.modelType(
			modelService,
			this.toDictOfTSValues(linkDepth)
		);
	}


	get fieldTSNames(): string[] {
		return this.fields.map(
			(field: TestField) => field.tsName
		);
	}


	get fieldRestNames(): string[] {
		return this.fields.map(
			(field: TestField) => field.restName
		);
	}


	get defaultModelService(): ModelService<T> {
		return ModelInstanceTestData.mockLinkedObjectService as
			ModelService<T>;
	}


	toModelInstanceStub(
		modelService: ModelService<T> = this.defaultModelService
	): T {
		return new this.modelType(
			modelService,
			{pk: this.pk}
		);
	}


	get pk(): number | string {
		return this.pkField.getTSValue();
	}


	protected get pkField(): TestField {
		return getFirstItemWhere(
			this.fields,
			(field: TestField) => field.tsName === this.pkName
		);
	}


	protected get pkName(): string {
		return getStaticMember(this.modelType, 'pkName');
	}


	toDictOfTSValues(linkDepth: number = this.defaultLinkDepth) {
		return this.createDictOfTSValues(linkDepth);
	}


	private createDictOfTSValues(
		linkDepth: number = this.defaultLinkDepth,
		fields: TestField[] = this.fields
	): any {
		return this.createDictFromFields(
			(field: TestField) => field.tsName,
			(field: TestField) => field.getTSValue(linkDepth),
			fields
		);
	}


	// Two callbacks, called once each per field
	private createDictFromFields(
		getKey: (field: TestField) => string,
		getValue: (field: TestField) => any,
		fields: TestField[] = this.fields
	): any {

		return fields.reduce((
			dict: any,
			field: TestField
		) => {
			const key = getKey(field);
			const value = getValue(field);
			dict[key] = value;
			return dict;
		}, {});
	}


	// Only fields that are writable to server
	toDictOfWritableTSValues(
		linkDepth: number = this.defaultLinkDepth
	): any {
		return this.createDictOfTSValues(
			linkDepth,
			this.fieldsWritableToServer
		);
	}


	toDictOfRestValues(linkDepth: number = this.defaultLinkDepth): any {
		return this.createDictOfRestValues(linkDepth);
	}


	private createDictOfRestValues(
		linkDepth: number = this.defaultLinkDepth,
		fields: TestField[] = this.fields
	): any {
		return this.createDictFromFields(
			(field: TestField) => field.restName,
			(field: TestField) => field.getRestValue(linkDepth),
			fields
		);
	}


	// Only fields that are writable to server
	toDictOfWritableRestValues(
		linkDepth: number = this.defaultLinkDepth
	): any {
		return this.createDictOfRestValues(
			linkDepth,
			this.fieldsWritableToServer
		);
	}


	toJson(linkDepth: number = this.defaultLinkDepth): string {
		return JSON.stringify(
			this.toDictOfRestValues(linkDepth)
		);
	}


	checkModelInstanceMatches(
		instance: T,
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {
		
		expect(instance instanceof this.modelType)
			.toBeTruthy();

		this.checkObjectHasCorrectTSValues(
			instance,
			expectedLinkDepth
		);
	}


	checkObjectHasCorrectTSValues(
		object: any,
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {
		
		for(let field of this.fields) {
			const key = field.tsName;
			const value = object[key];
			field.checkTSValueIs(value, expectedLinkDepth);
		}
	}

	
	checkObjectHasCorrectRestValues(
		object: any,
		expectedLinkDepth: number = this.defaultLinkDepth
	): void {
		
		this.checkObjectHasSomeCorrectRestValues(
			this.fields,
			object,
			expectedLinkDepth
		);
	}


	// Checks object for a given set of REST values defined by fieldsToCheck
	private checkObjectHasSomeCorrectRestValues(
		fieldsToCheck: TestField[],
		object: any,
		expectedLinkDepth: number
	): void {

		for(let field of fieldsToCheck) {
			const key = field.restName;
			const value = object[key];
			field.checkRestValueIs(value, expectedLinkDepth);
		}
	}


	// Only checks for the fields that are writable to server; good for testing request data
	checkObjectHasCorrectWritableRestValues(
		object: any,
		expectedLinkDepth: number = 0
	): void {

		this.checkObjectHasSomeCorrectRestValues(
			this.fieldsWritableToServer,
			object,
			expectedLinkDepth
		);
	}


	// Writable subset of this.fields[]
	private get fieldsWritableToServer(): TestField[] {
		const fieldDescriptors =
			getStaticMember(this.modelType, 'fieldDescriptors');

		const writableFieldDescriptors = fieldDescriptors.filter(
			(fieldDescriptor: FieldDescriptor) =>
				fieldDescriptor.canWriteToServer
		);

		const writableFieldNames = writableFieldDescriptors.map(
			(fieldDescriptor: FieldDescriptor) =>
				fieldDescriptor.tsName
		);

		return writableFieldNames.map(
			(name: string) => this.getFieldByName(name)
		);	
	}


	getTSValue(fieldName: string): any {
		const field = this.getFieldByName(fieldName);
		return field.getTSValue();
	}


	getFieldByName(name: string): TestField {
		return getFirstItemWhere(
			this.fields,
			(field: TestField) => field.tsName === name
		);
	}


	checkModelInstanceHasCorrectPK(instance: T): void {
		expect(instance.pk).toBe(this.pk);
	}

}