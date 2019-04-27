const WebTorrent = require('webtorrent');
const aws = require('aws-sdk');
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static(`${__dirname}/public`));
const port = process.env.PORT || 3000;

aws.config.update({
    accessKeyId : 'AKIAJLI4URTABVKBM7TQ',
    secretAccessKey : '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'
});

const s3 = aws.S3;

let params = {
    Bucket : 'tormed',
    Key : null,
    Body : null
}

app.post('/', (req,res) => {
    let magnet = req.body.mag;
    console.log(`New MagnetUrl received : ${magnet}`);
    let client = new WebTorrent();
    client.add(magnet, (torrent) => {
        console.log(`Downloading : ${torrent.infoHash}`);
        torrent.files.forEach((file) => {
            params.Key = file;
            params.Body = fs.readFileSync(file);
            s3.putObject(params,(err) => {
                if (err) throw err;
                console.log("Torrent successfully downloaded!");
            }); 
        });
    });
});

app.listen(port,(err) => {
    if (err) throw err;
    console.log(`Server started on port ${port}`);
});