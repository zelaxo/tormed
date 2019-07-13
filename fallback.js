//checks the downloads directory for unfinished uploads & completes them

const fs = require('fs');
const aws = require('aws-sdk');

aws.config.update({
    accessKeyId : process.env.AKI,
    secretAccessKey : process.env.SAK
});

const s3 = new aws.S3();

let params = {
    Bucket : 'tormed',
    Key : null,
    Body : null
}

function fallback() {
    fs.readdir('./downloads', (err,files) => {
        if (err) throw err;
        files.forEach((file) => {
            if (fs.lstatSync('./downloads/'+file).isDirectory()) {
                //upload all files in the folder or remove empty folder
                fs.rmdir('./downloads'+file, (err) => {
                    if (err) {
                        fs.readdir('./downloads/'+file, (err,subfiles) => {
                            if (err) throw err;
                            subfiles.forEach((subfile) => {
                                params.Key = subfile;
                                params.Body = fs.readFileSync(`${__dirname}/downloads/${file}/${subfile}`);
                                s3.putObject(params,(err) => {
                                    if (err) throw err;
                                    console.log(`${subfile} transfered to storage!`);
                                    fs.unlink(`${__dirname}/downloads/${file}/${subfile}`, (err) => {
                                        if (err) throw err;
                                        return console.log(`${subfile} cleared from server`);
                                    });
                                }); 
                            });
                        });
                    }
                });
            }
            else {
                //upload single file
                params.Key = file;
                params.Body = fs.readFileSync(`${__dirname}/downloads/${file}`);
                s3.putObject(params,(err) => {
                    if (err) throw err;
                    console.log(`${file} transfered to storage!`);
                    fs.unlink(`${__dirname}/downloads/${file}`, (err) => {
                        if (err) throw err;
                        return console.log(`${file} cleared from server`);
                    });
                });
            }
        });
    });
}

module.exports = {fallback};