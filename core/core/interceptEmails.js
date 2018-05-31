import fs from 'fs';
import path from 'path';
import os from 'os';
import opn from 'opn';

function writeFile(filename, data, done) {
  fs.mkdtemp(path.join(os.tmpdir(), 'mailman-'), (err1, folder) => {
    if (err1) return done(err1);
    const temporaryFolderPath = `${folder}/${filename}`;
    return fs.writeFile(temporaryFolderPath, data, (err2) => {
      if (err2) return done(err2);
      return done(null, temporaryFolderPath);
    });
  });
}

const mailman = {};

mailman.warnNoEmailPackage = function warnNoEmailPackage() {
  console.log('unchained:core -> Unchained Mail Manager could not start because you are not using the email package');
  console.log('unchained:core -> Please run `meteor add email`');
};

export default () => {
  Meteor.startup(() => {
    if (!Package.email) {
      mailman.warnNoEmailPackage();
      return;
    }

    mailman.originalSend = Email.send;
    mailman.send = function mailmanSend(options) {
      const filename = `${Date.now()}.html`;
      const header = `<b>from:</b>${options.from}<br><b>to:</b>${options.to}<br><br><b>subject:</b>${options.subject}<hr>`;
      const content = header + (options.html || options.text);
      writeFile(filename, content, (err, filePath) => {
        if (err) { console.log(err); return; }
        console.log('unchained:core -> Mailman detected an outgoing email');
        opn(filePath);
      });
    };

    Email.send = mailman.send;
    console.log('unchained:core -> E-Mail Interception activated');
  });
};
