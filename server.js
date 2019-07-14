const WebTorrent = require('webtorrent');
const aws = require('aws-sdk');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const rm = require('rimraf');

const {serverNotif} = require('./mailer');
const {fallback} = require('./fallback');

const app = express();
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.urlencoded({extended:true}));
const port = process.env.PORT || 8080;

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

//Activating Fallback
fallback();

app.post('/murl', (req,res) => {
    let magnet = req.body.mag;
    console.log(`New MagnetUrl received : ${magnet}`);
    let client = new WebTorrent();
    client.add(magnet, {path:`${__dirname}/downloads`}, (torrent) => {
        console.log(`Downloading : ${torrent.name}`);
        torrent.on('done', () => {
            console.log('Torrent successfully downloaded to server!');
            serverNotif(torrent.name);  //Sends notification email
            fs.readdir('./downloads', (err,files) => {
                if (err) throw err;
                files.forEach((file) => {
                    if(fs.lstatSync('./downloads/'+file).isDirectory()) {
                        fs.readdir('./downloads/'+file, (err,subfiles) => {
                            if (err) throw err;
                            if(subfiles.length == 0) {
                                rm('./downloads/'+file, (err) => {
                                    if (err) throw err;
                                });
                            }
                            else {
                                subfiles.forEach((subfile) => {
                                    params.Key = subfile;
                                    params.Body = fs.readFileSync(`${__dirname}/downloads/${file}/${subfile}`);
                                    s3.putObject(params,(err) => {
                                        if (err) throw err;
                                        console.log(`${subfile} transfered to storage!`);
                                        //Releasing Memory
                                        params.Key = null;
                                        params.Body = null;
                                        //Removing Local Files
                                        fs.unlink(`${__dirname}/downloads/${file}/${subfile}`, (err) => {
                                            if (err) throw err;
                                            return console.log(`${subfile} cleared from server`);
                                        });
                                    }); 
                                });
                            }
                        });
                    }
                    else {
                        params.Key = file;
                        params.Body = fs.readFileSync(`${__dirname}/downloads/${file}`);
                        s3.putObject(params,(err) => {
                        if (err) throw err;
                        console.log(`${file} transfered to storage!`);
                        //Releasing Memory
                        params.Key = null;
                        params.Body = null;
                        //Deleting Local Files
                        fs.unlink(`${__dirname}/downloads/${file}`, (err) => {
                            if (err) throw err;
                            return console.log(`${file} cleared from server`);
                        });
                     });
                    }
                });
            });
        });
    });
});

app.listen(port,(err) => {
    if (err) throw err;
    console.log(`Server started on port ${port}`);
});