const router = require('express').Router();
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new S3Client();

let upload = multer({
    storage: multerS3({
        s3: s3,
        // acl: 'public-read',
        bucket: process.env.S3_BUCKET_NAME,
        key: function (req, file, cb) {
            let filename = 'digisigner_upload/' + Date.now() + "-" + file.originalname
            cb(null, filename);
        }
    })
});

let uploadMultiple = upload.fields([{ name: "document", maxCount: 1 }]);
upload = uploadMultiple;

const { uploadsOnS3, uploadDocumentonDigisigner, uploadDocument, sendDocument, requestStatus, documentContent } = require('../controllers');


router.post('/upload-document', uploadMultiple, uploadsOnS3);
router.get('/upload-document-digi', uploadMultiple, uploadDocumentonDigisigner);
router.post('/send-document', sendDocument);
router.get('/download-document/:docId', uploadDocument);
router.get('/document-status/:requestId', requestStatus);
router.get('/document-content/:docId', documentContent);

module.exports = router;
