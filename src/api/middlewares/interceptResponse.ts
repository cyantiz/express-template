export function interceptResponse(req, res, next) {
  const oldSend = res.send;

  res.send = function (data) {
    if (data.statusCode === undefined) {
      return;
    }

    res.status(data.statusCode);
    console.info('RESPONSE', req.method, req.originalUrl, data);
    res.send = oldSend;
    // eslint-disable-next-line prefer-rest-params
    oldSend.apply(res, arguments);
  };

  next();
}
