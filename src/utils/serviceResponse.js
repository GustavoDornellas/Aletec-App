export function createSuccessResponse(data, message = '') {
  return {
    success: true,
    data,
    message,
    error: null,
  };
}

export function createErrorResponse(message, details = {}) {
  return {
    success: false,
    data: null,
    message: '',
    error: {
      message,
      ...details,
    },
  };
}
