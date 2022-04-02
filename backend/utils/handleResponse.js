// Based on status definitions from Mozilla
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

function handleResponse(req, res, statusCode, data, msg) {
  let isError = false;
  let message = msg;
  switch (statusCode) {
    case 200:
      isError = false;
      message = msg || 'OK';
      break;
    case 204:
      return res.sendStatus(204);
    case 400:
      isError = true;
      break;
    case 403:
      isError = true;
      message = msg || 'Access to this resource is denied.';
      break;
    case 404:
      isError = true;
      message = msg || 'Not found';
      break;
    case 500:
      isError = true;
      message = msg || "Internal server error."
    default:
      break;
  }
  const resObj = data || {};
  resObj.error = isError;
  resObj.message = message;

  return res.status(statusCode).json(resObj);
}

module.exports = { handleResponse }
