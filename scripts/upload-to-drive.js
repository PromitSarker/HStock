const fs = require('fs');
const { google } = require('googleapis');

async function uploadFile() {
    const credentials = JSON.parse(process.env.GDRIVE_CREDENTIALS);
    const folderId = process.env.FOLDER_ID;
    const filePath = process.env.FILE_PATH;
    const fileName = process.env.FILE_NAME;

    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/drive.file']
    );

    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log(`Attempting to upload ${fileName} to folder ${folderId}...`);
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId]
            },
            media: {
                mimeType: 'application/sql',
                body: fs.createReadStream(filePath)
            }
        });
        console.log('Upload successful! File ID:', response.data.id);
    } catch (error) {
        console.error('Upload failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

uploadFile();
