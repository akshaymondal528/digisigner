require('dotenv').config();

exports.envConfig = {
    PORT: process.env.PORT,
    DIGI_SIGNER_API_KEY: process.env.DIGI_SIGNER_API_KEY
}