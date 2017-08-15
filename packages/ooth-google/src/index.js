const nodeify = require('nodeify')
const GoogleStrategy = require('passport-google-id-token')

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1])
    }
}

module.exports = function({
    clientID,
    clientSecret,
}) {
    return function({
        name,
        registerUniqueField,
        registerProfileField,
        registerPassportMethod,
        requireNotLogged,
        getUserByUniqueField,
        insertUser,
        updateUser,
    }) {
        registerUniqueField('email', 'email')
        registerProfileField('email')
        registerPassportMethod('login', requireNotLogged, new GoogleStrategy({
            clientID,
            clientSecret,
        }, nodeifyAsync((parsedToken, googleId) => {
            const email = parsedToken.payload.email
            return getUserByUniqueField('email', email)
                .then(user => {
                    if (user) {
                        if (!user[name]) {
                            return updateUser(user._id, {
                                email,
                            })
                        }

                        return user
                    }

                    return insertUser({
                        email,
                    })
                })
        })))
    }
}