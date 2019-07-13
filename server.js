const WebTorrent = require('webtorrent');
const aws = require('aws-sdk');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

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
fs.readdir('./downloads', function(err, files) {
    if (err) {
       console.log('Problem accessing downloads');
    } else {
       if (files.length != 0) {
        files.forEach((file) => {
            serverNotif(file);
        });
        fallback();
       }
    }
});

app.post('/murl', (req,res) => {
    let magnet = req.body.mag;
    console.log(`New MagnetUrl received : ${magnet}`);
    let client = new WebTorrent();
    client.add(magnet, {path:`${__dirname}/downloads`}, (torrent) => {
        console.log(`Downloading : ${torrent.name}`);
        torrent.on('done', () => {
            console.log('Torrent successfully downloaded to server!');
            serverNotif(torrent.name);  //Sends notification email
            torrent.files.forEach((file) => {
                params.Key = file.name;
                params.Body = fs.readFileSync(`${__dirname}/downloads/${file.name}`);
                s3.putObject(params,(err) => {
                    if (err) throw err;
                    console.log(`${file.name} transfered to storage!`);
                    fs.unlink(`${__dirname}/downloads/${file.name}`, (err) => {
                        if (err) throw err;
                        return console.log(`${file.name} cleared from server`);
                    });
                }); 
            });
        });
    });
});

app.listen(port,(err) => {
    if (err) throw err;
    console.log(`Server started on port ${port}`);
});