export function unwrapStudentVueResponse<T>(response: T | [T, unknown]): T {
	if (Array.isArray(response)) {
		return response[0];
	}

	return response;
}

export function getStudentVueLoginResult<TClient, TGradebook>(
	result:
		| [TClient, TGradebook]
		| { client: TClient; responses: [TGradebook, unknown][] }
): { client: TClient; gradebook: TGradebook } {
	if (Array.isArray(result)) {
		return { client: result[0], gradebook: result[1] };
	}

	const firstResponse = result.responses[0];
	if (!firstResponse) {
		throw new Error("StudentVue login returned no gradebook");
	}

	return { client: result.client, gradebook: unwrapStudentVueResponse(firstResponse) };
}
