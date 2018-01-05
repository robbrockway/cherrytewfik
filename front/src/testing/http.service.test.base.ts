// Base class for testing injectable services that use HTTP. The connection is mocked using Angular's MockBackend.

import { Type } from '@angular/core';
import { TestBed, TestModuleMetadata } from '@angular/core/testing';

import {
	HttpModule,
	XHRBackend,
	ResponseOptionsArgs,
} from '@angular/http';

import { MockBackend, MockConnection } from '@angular/http/testing';

import { TestWithModule } from './test.with.module';
import { createResponse, createErrorResponse } from './utils';



export abstract class HttpServiceTest<T> extends TestWithModule {

	protected service: T;
	protected mockHttpBackend: MockBackend;


	constructor(
		protected serviceType: Type<T>,
		testName: string = serviceType.name
	) {
		super(testName);
	}


	protected getModuleMetadata(): TestModuleMetadata {
		return {
			imports: [HttpModule],

			providers: [
				this.serviceType,
				{provide: XHRBackend, useClass: MockBackend},
			],
		};
	}


	protected defineTests(): void {
		super.defineTests();


		beforeEach(() => {
			this.service = TestBed.get(this.serviceType);
			this.mockHttpBackend = TestBed.get(XHRBackend);
		});

	}


	protected setMockResponse(
		options: ResponseOptionsArgs
	): void {
		const response = createResponse(options);

		this.mockHttpBackend.connections.subscribe(
				(connection: MockConnection) => {

			connection.mockRespond(response);
		});
	}


	protected setMockResponseError(
		message: string,
		status: number = 400
	): void {
		const jsonText = JSON.stringify({detail: message});
		const response = createErrorResponse(message, status);

		this.mockHttpBackend.connections.subscribe(
				(connection: MockConnection) => {

			// Double cast, to avoid an Angular bug (Response not accepted by .mockError())
			connection.mockError(response as any as Error);
		});
	}

}