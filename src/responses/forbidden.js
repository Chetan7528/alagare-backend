module.exports = (res, info = {}) => {
  return res.status(403).json({
    status: false,
    message: info.message || "Forbidden",
  });
};

