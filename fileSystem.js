class fileSystem {
  constructor(files) {
    this.organizeTree(files);
    this.current = '/';
  }

  organizeTree(files) {
    const paths = {
      '/': {
        content: files,
        type: 'folder',
      },
    };
    files.forEach(element => {
      paths[`/${element.name}`.toLowerCase()] = {
        content: element,
        type: 'folder',
      };
      element.files.forEach(file => {
        paths[`/${element.name}/${file.name}`.toLowerCase()] = {
          content: file,
          type: 'file',
        };
      });
    });
    this.paths = paths;
  }

  getCurrent() {
    return this.current;
  }
  
  getFolderId() {
    return this.paths[this.current].content._id;
  }

  getPaths(options) {
    options = Object.assign({}, {file: true, folder: true, relative: false}, options);

    const items = Object.entries(this.paths)
      .filter(([key]) => {
        if (options.relative) {
          const startPath = this.current.length > 1 ? this.current + '/' : this.current;
          if (key.startsWith(startPath)) {
            return true;
          }
          return false;
        }
        else {
          return true;
        }
      })
      .filter(([key, value]) => {
        return ((options.file && value.type == 'file') || (options.folder && value.type == 'folder'));
      });
    
    return items.map(item => {
      let path = item[0];
      if (options.relative) {
        path = path.replace(this.current, '');
        path = path.replace(/^\//, '');
      }
      return path;
    });
  }

  gotoFolder(path) {
    if (path == '..') {
      if (this.current !== '/') {
        this.current = '/';
        return true;
      }
      return false;
    }
    if (path == '.') {
      return true;
    }

    path = this.resolvePath(path);

    const match = Object.keys(this.paths).find(i => i.toLowerCase() == path.toLowerCase());
    if (match) {
      this.current = path;
      return true;
    }
    else {
      return false;
    }
  }

  listFolder(path = false) {
    path = path || this.current;

    path = this.resolvePath(path);

    const content = this.paths[path].content;
    const field = content.files || content;

    field.forEach(item => {
      const isFile = item.content ? '-' : 'd';

      console.log(`${isFile}rwx------ ${item.name}`);
    });
  }

  printFile(path) {
    path = this.resolvePath(path);
    const file = this.paths[path].content;

    if (file.type == 'photo') {
      return file.content[0];
    }

    return file.content.join('\n');

    // if (file.type == 'photo') {
    //   const {body} = await got(file.content[0], {responseType: 'buffer'});
	  //   console.log(await terminalImage.buffer(body));
    // }
  }

  resolvePath(path) {
    if (!path.startsWith('/')) {
      path = `${this.current}/${path}`;
    }
    path = path.replace(/\/\//g, '/');
    path = path.length > 1 ? path.replace(/\/$/, '') : path;


    return path.toLowerCase();
  }
}

module.exports = fileSystem;
