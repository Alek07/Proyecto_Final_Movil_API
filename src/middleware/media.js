const multer = require('multer')

const upload = multer({
    limits: {
        fileSize: 5000000
    },
    fileFilter(req, file, callback) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return callback(new Error('Please upload a valid image'))

        callback(undefined, true)
    }
})

module.exports = upload