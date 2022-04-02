// Based on status definitions from Mozilla
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

function handleResponse(req, res, statusCode, data, msgOverride) {
  let isError = false;    // Initially set to false
  let message = msgOverride;      // Override a custom message for response
  switch (statusCode) {
    case 200:
      isError = false;
      message = msgOverride || 'OK';
      break;
    case 204:
      return res.sendStatus(204);
    case 400:
      isError = true;
      break;
    case 403:
      isError = true;
      message = msgOverride || 'Access to this resource is denied';
      break;
    case 404:
      isError = true;
      message = msgOverride || 'Not found';
      break;
    case 406:
      isError = true;
      message = msgOverride || 'Not Acceptable'
    case 500:
      isError = true;
      message = msgOverride || "Internal server error"
    default:
      break;
  }
  const resObj = data || {};
  if (isError) {
    resObj.error = true;
    resObj.message = message;
  }
  return res.status(statusCode).json(resObj);
}

module.exports = { handleResponse }
