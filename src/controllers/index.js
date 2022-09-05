const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const { envConfig } = require('../config/env');
const pipeline = promisify(stream.pipeline);

const API_KEY = envConfig.DIGI_SIGNER_API_KEY;
const s3 = new aws.S3();

const bufferToStream = (buffer) => {
    let streamData = new stream.Readable();
    streamData.push(buffer);
    streamData.push(null);
    return streamData;
}

exports.uploadsOnS3 = async (req, res) => {
    try {
        if (req.files) res.json(req.files);
    } catch (error) {
        throw error;
    }
}

exports.uploadDocumentonDigisigner = async (req, res) => {
    try {
        let objdData = await s3.listObjects({ Bucket: process.env.S3_BUCKET_NAME, Prefix: `digisigner_upload/` }).promise();
        let params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: String(objdData.Contents[0].Key)
        }
        let data = await s3.getObject(params).promise();
        const form = new FormData();
        await pipeline(bufferToStream(data.Body), fs.createWriteStream(objdData.Contents[0].Key.split('/')[1]));
        form.append('file', fs.readFileSync(objdData.Contents[0].Key.split('/')[1]), objdData.Contents[0].Key.split('/')[1]);
        const response = await axios.post(
            'https://api.digisigner.com/v1/documents',
            form,
            {
                headers: {
                    ...form.getHeaders()
                },
                auth: {
                    username: API_KEY
                }
            }
        );
        if (fs.existsSync(objdData.Contents[0].Key.split('/')[1])) {
            fs.unlinkSync(objdData.Contents[0].Key.split('/')[1]);
        }
        res.json(response.data)
    } catch (error) {
        throw error;
    }
}

exports.sendDocument = async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.digisigner.com/v1/signature_requests',
            {
                'documents': [
                    {
                        // document_id: req.params.docId,
                        document_id: '433dc407-de41-4c88-add9-2c541462fbc9',
                        subject: 'Digisign Document Signature',
                        message: 'Signature your document',
                        signers: [
                            {
                                'email': req.body.email,
                                'role': 'Signer 1',
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                auth: {
                    username: API_KEY
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.log('error -->', error)
        throw error;
    }
}

exports.uploadDocument = async (req, res) => {
    try {
        const response = await axios.get(`https://api.digisigner.com/v1/documents/${req.params.docId}`, {
            auth: {
                username: API_KEY
            },
            responseType: 'stream',
        });
        let fileName = `${Date.now()}.pdf`;
        await pipeline(response.data, fs.createWriteStream(fileName));
        let params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `digisigner_upload/${fileName}`,
            Body: fs.readFileSync(fileName)
        }
        await s3.upload(params).promise();
        fs.unlinkSync(fileName);
        res.json({ msg: 'success' });
    } catch (error) {
        console.log(error)
        throw error;
    }
}

exports.requestStatus = async (req, res) => {
    try {
        const response = await axios.get(`https://api.digisigner.com/v1/signature_requests/${req.params.requestId}`, {
            auth: {
                username: API_KEY
            },
        });
        res.json(response.data);
    } catch (error) {
        throw error;
    }
}

exports.documentContent = async (req, res) => {
    try {
        const response = await axios.get(`https://api.digisigner.com/v1/documents/${req.params.docId}/fields`, {
            auth: {
                username: API_KEY
            },
        });
        // res.json(response.data.document_fields)
        // let obj = {}
        // for (let memb of response.data.document_fields) {
        //     if (memb.label == 'Bank Name') {
        //         obj.bankname = memb.submitted_content
        //         // bank = memb.submitted_content
        //     }
        //     if (memb.label == 'Account Holders Name') {
        //         obj.accountHolder = memb.submitted_content
        //         // holder = memb.submitted_content
        //     }
        //     if (memb.label == 'Account Type') {
        //         obj.accountType = memb.submitted_content
        //         // type = memb.submitted_content
        //     }
        //     if (memb.label == 'IFSC Code') {
        //         obj.ifscCode = memb.submitted_content
        //         // ifsc = memb.submitted_content
        //     }
        //     if (memb.label == 'Account Number') {
        //         obj.accountNo = memb.submitted_content
        //         // accno = memb.submitted_content
        //     }
        // }
        // res.json(obj);
        res.json(response.data);
    } catch (error) {
        throw error;
    }
}