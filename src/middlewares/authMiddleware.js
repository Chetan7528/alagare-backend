const passport = require("passport");
const response = require("@responses");

const auth = (...allowedRoles) => {
    return (req, res, next) => {
        passport.authenticate('jwt', { session: false }, function (err, user, info) {
            if (err) { 
                return response.error(res, err); 
            }
            
            
            if (!user || user.isDeleted) { 
                return response.unAuthorize(res, info || { 
                    isDeleted: true,
                    message: "This account has been deleted" 
                }); 
            }
            if (user.isBlocked) {
                return response.unAuthorize(res, { 
                    isBlocked: true,
                    message: "Account is blocked" 
                });
            }

            if (allowedRoles.length === 0) {
                req.user = user;
                return next();
            }
            
            if (!allowedRoles.includes(user.role)) { 
                return response.unAuthorize(res, { message: "Insufficient permissions" }); 
            }
            
            req.user = user;
            next();
        })(req, res, next);
    }
};

module.exports = auth;
