const sgmail = require('@sendgrid/mail');

sgmail.setApiKey(process.env.SG);

function serverNotif(filename) {
    const message = { 
        to : 'otdo@mail.ccsf.edu',
        from : { email : 'notification@tormed.azurewebsites.net' , name: 'TorMed'},
        subject : "TorMed Notification",
        text : `Hello Sir, ${filename} has been downloaded to the server`
    }
    sgmail.send(message).then(() => {
        console.log("Email sent to master");   
    },(err) => {
        console.log(err);
    });
}

module.exports = {serverNotif};