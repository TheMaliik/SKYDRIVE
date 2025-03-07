const logger = (req, res, next) => {
    console.log(
      `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl} ${
        res.statusCode
      }`
    );
    next();
  };
  
  module.exports = logger;