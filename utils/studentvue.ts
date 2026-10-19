export function unwrapStudentVueResponse<T>(response: T | [T, unknown]): T {
	if (Array.isArray(response)) {
		return response[0];
	}

	return response;
}
