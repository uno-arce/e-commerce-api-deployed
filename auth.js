const jwt = require("jsonwebtoken");

const secret = ("ElectronicCommerceAPI");

module.exports.createAccessToken = (user) => {
	const data = {
		id: user._id,
		email: user.email,
		role: user.role
	}

	return jwt.sign(data, secret, {});
}

// Token Verification
module.exports.verify = (request, response, next) => {
	let token = request.headers.authorization;

	if(token === undefined) {
		return response.send("No token provided!");
	} else {
		token = token.slice(7, token.length);

		// Token decryption
		jwt.verify(token, secret, (err, decodedToken) => {
			if(err) {
				return response.send({
					auth: "Failed",
					message: err.message
				})
			} else {
				request.user = decodedToken;
				next();
			}
		})
	}
}

// To check wether the user is admin or not
module.exports.verifyAdmin = (request, response, next) => {
	if(request.user.role === 'Admin') {
		next();
	} else {
		return response.send({
			auth: "Failed",
			message: "Action Forbidden!"
		})
	}
}