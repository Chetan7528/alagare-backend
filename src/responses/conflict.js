module.exports = (res, info) => {
    return res.status(409).send({
        status: false,
        message: (info && info.message) ? info.message : (typeof info === 'string' ? info : 'Conflict error'),
        data: info,
    });
};
