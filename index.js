const homedir = require('os').homedir();
const fs = require('fs');
const readline = require('readline');
const Api = require('./api');
const FileSystem = require('./fileSystem');

(async () => {
  let config = {
    token: '',
  };
  if (fs.existsSync(`${homedir}/.kode24`)) {
    config = JSON.parse(fs.readFileSync(`${homedir}/.kode24`, 'utf8'));
  }

  const api = new Api();

  let isAuthed = false;
  let fileTree;

  const saveToken = () => {
    fs.writeFileSync(`${homedir}/.kode24`, JSON.stringify(config));
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'KODE24> ',
    completer: (line) => {
      const [arg, input] = line.split(' ');
      let paths = [];
      if (arg === 'cd') {
        paths = fileTree.getPaths({folder: true, file: false, relative: true});
        paths = paths.filter(i => i.startsWith(input));
      }
      else if (arg === 'cat' || arg === 'print') {
        paths = fileTree.getPaths({folder: false, file: true, relative: true});
        paths = paths.filter(i => i.startsWith(input));
      }

      return [paths, input];
    },
  });

  const authCheck = () => {
    return isAuthed;
  };

  const setup = async (token) => {
    api.setToken(token);
    await api.verify();
    isAuthed = true;
    const fileData = await api.files();
    fileTree = new FileSystem(fileData);
  };

  const printHelp = () => {
    console.log(`
      Tilgjengelige kommandoer:
        pwd
          Print hvilken mappe du står i.
        
        token [token]
          Lagre token for bruk senere.

        ls
        dir
          Print innhold i mappe.

        cat
        print
          Print innhold i fil. Bilder vises som lenke da terminal er dårlig på sånt.
        
        cd
          Gå til mappe.

        auth
          Svar på en gåte.
        
        stats
          Print din personlige statistikk.

        help
          Vis denne meldingen.
    `);
  };


  if (!config.token) {
    console.log('Token mangler');
    console.log('Hent ditt token fra nettsiden, cookien kallt "id"');
    console.log('Legg inn tokenet med kommandoen "token [token]"');
  }
  else {
    await setup(config.token);
  }

  rl.prompt();

  rl.on('line', async (line) => {
    const [arg, rest] = line.split(' ');

    switch (arg.trim()) {
      case 'token':
        config.token = rest;
        try {
          await setup(config.token);
          saveToken();
        }
        catch (error) {
          config.token = '';
          console.log(error);
        }
        break;
      case 'pwd':
        console.log(fileTree.getCurrent());
        break;
      case 'ls':
      case 'dir':
        if (!authCheck()) {
          console.log('Autentiser deg først.');
          break;
        }
        fileTree.listFolder(rest);
        break;
      case 'cd':
        const folder = rest;
        try {
          fileTree.gotoFolder(folder);
        }
        catch (error) {
          console.log(error);
        }
        break;
      case 'print':
      case 'cat':
        if (!authCheck()) {
          console.log('Autentiser deg først.');
          break;
        }
        console.log(fileTree.printFile(rest));
        break;
      case 'auth':
        const authResponse = await api.auth(fileTree.getFolderId(), rest);
        console.log(authResponse.content);
        break;
      case 'stats':
        console.log(await api.stats());
        break;
      case 'help':
        printHelp();
        break;
      case 'exit':
      case ':wq':
      case ':q':
        console.log('Back to work!');
        process.exit(0);
        break;
      default:
        if (arg !== '') {
          console.log('Ukjent kommando, prøv "help".');
        }
        break;
    }
    rl.prompt();
  }).on('close', () => {
    console.log('Back to work!');
    process.exit(0);
  });
})();