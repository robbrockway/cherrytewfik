// HTTP service that adds appropriate headers and cookies to every request

import { Injectable } from '@angular/core';

import {
	Http,
	XHRBackend,
	Request,
	RequestOptions,
	RequestOptionsArgs,
	Headers,
	Response,
} from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

import {
	forEachProperty,
	getCookie,
	objectHasPropertyOfType,
	isInstance,
} from 'utils';



const defaultOptions = new RequestOptions({
	withCredentials: true,
});



@Injectable()
export class CustomHttp extends Http {

	constructor(backend: XHRBackend) {
		super(backend, defaultOptions);
	}


	request(
		urlOrRequest: string | Request,
		options: RequestOptionsArgs = {}
	): Observable<Response> {
		
		this.prepareHeaders(urlOrRequest, options);

		return super.request(urlOrRequest, options).do(
			(response: Response) => this.recordCsrfToken(response)
		);
	}


	private prepareHeaders(
		urlOrRequest: string | Request,
		options: RequestOptionsArgs
	): void {

		const container = this.getObjectContainingHeadersAndBody(
			urlOrRequest,
			options
		);

		container.headers.append('X-CSRFToken', this.csrfToken);

		if(isJson(container))
			container.headers.append('Content-Type', 'application/json');
	}


	private getObjectContainingHeadersAndBody(
		urlOrRequest: string | Request,
		options: RequestOptionsArgs
	): any {

		if(isUrl(urlOrRequest)) {
			options.headers = options.headers || new Headers();
			return options;
		}
		
		return urlOrRequest;
	}


	private get csrfToken(): string {
		return localStorage.getItem('csrfToken');
	}


	// Takes token from response header and writes to local storage
	private recordCsrfToken(response: Response): void {
		const token = response.headers.get('X-CSRFToken');
		localStorage.setItem('csrfToken', token);
	}

}



function isJson(container: Request | any): boolean {
	const body = container instanceof Request ?
		container.getBody() : container.body;

	return !(body instanceof FormData);
}


function isUrl(urlOrRequest: string|Request): boolean {
	return typeof urlOrRequest === 'string';
}
