import {
	TestModuleMetadata,
	inject,
	async,
} from '@angular/core/testing';

import {
	HttpModule,
	XHRBackend,
	Request,
	RequestMethod,
	RequestOptions,
	Headers,
} from '@angular/http';

import { MockBackend, MockConnection } from '@angular/http/testing';

import {
	HttpServiceTest,
	mergeModuleMetadata,
	forEachEnumItem,
	createResponse,
} from 'testing';

import { CustomHttp } from './custom.http';





const allRequestMethods = [];

forEachEnumItem(
	RequestMethod,
	(index: number) => allRequestMethods.push(index)
);


const requestMethodsWithBodies = [
	RequestMethod.Put,
	RequestMethod.Patch,
	RequestMethod.Post,
];



class CustomHttpTest extends HttpServiceTest<CustomHttp> {

	constructor() {
		super(CustomHttp);
	}


	protected defineTests(): void {
		super.defineTests();

		const testCsrfToken = 'tokentokentoken';

		let onRequest: (
			func: (request: Request) => void
		) => void;

		let supplyCsrfTokenInResponseHeader: (token: string) => void;


		beforeEach(() => {
			localStorage.setItem('csrfToken', testCsrfToken);
		});


		this.describeForAllRequestMethods(
			'should have Content-Type header set to application/json, '
				+ 'if request body is a compound object',
			
			(request: Request) => {
				expect(request.headers.get('Content-Type'))
					.toBe('application/json');
			},

			requestMethodsWithBodies,	// Only check PUT, PATCH and POST
			{bodyProperty: 'value'}
		);


		this.describeForAllRequestMethods(
			'should have Content-Type header set to application/json, '
				+ 'if request body is empty',
			
			(request: Request) => {
				expect(request.headers.get('Content-Type'))
					.toBe('application/json');
			}
		);


		this.describeForAllRequestMethods(
			'should have leave Content-Type header blank for autodetection, '
				+ 'if request body is a FormData object',

			(request: Request) => {
				expect(request.headers.get('Content-Type'))
					.toBe(null);
			},

			requestMethodsWithBodies,
			new FormData()
		);


		this.describeForAllRequestMethods(
			'should have X-CSRFToken header set to correct token',
			(request: Request) => {
				expect(request.headers.get('X-CSRFToken'))
					.toBe(testCsrfToken);
			}
		);


		it('should set CSRF token in local storage to value in response '
				+ 'header', async(() => {

			const newCsrfToken = 'newtokennewtoken';
			supplyCsrfTokenInResponseHeader(newCsrfToken);
			
		}));


		supplyCsrfTokenInResponseHeader = (token: string) => {
			const headers = new Headers({'X-CSRFToken': token});
			const response = createResponse({headers});

			this.setMockResponse(response);
		};

	}


	// Defines a test for each of the specified request methods, in which a request of said method is sent, intercepted and tested using the provided function
	private describeForAllRequestMethods(
		testName: string,
		testFunc: (request: Request) => void,
		methodsToTest: RequestMethod[] = allRequestMethods,
		requestBody?: any
	): void {

		describe(testName, () => {

			let testMethod: (method: RequestMethod) => void;


			for(let method of methodsToTest) {
				const methodName = RequestMethod[method].toUpperCase();

				it(`, with ${methodName} request`, async(() => {
					testMethod(method);
				}));
			}


			testMethod = (method: RequestMethod) => {
				// Run callback once request is intercepted
				this.onRequest(testFunc);

				const options = new RequestOptions(
					{method, body: requestBody}
				);

				this.http.request(new Request(options), options);
			};

		});

	}

		
	// Runs callback next time a request has been sent
	private onRequest(
		func: (request: Request) => void
	): void {
		this.mockHttpBackend.connections.subscribe(
			(connection: MockConnection) => func(connection.request)
		);
	}


	protected get http(): CustomHttp {
		return this.service as CustomHttp;
	}

}


new CustomHttpTest();