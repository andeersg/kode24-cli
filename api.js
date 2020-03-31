const got = require('got');

class Api {
  constructor(token = '') {
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async callApi(url) {
    const response = await got(url, {
      headers: {
        cookie: `id=${this.token}`,
      }
    });
    return JSON.parse(response.body);
  }

  async verify() {
    try {
      await this.callApi('https://paaske2020.kode24.no/api/user/verify');
      return true;
    }
    catch (error) {
      return false;
    }
  };
  async files() {
    return await this.callApi('https://paaske2020.kode24.no/api/files');
  };

  async auth(folder, answer) {
    const response = await this.callApi(`https://paaske2020.kode24.no/api/files/answer/${folder}/${answer}`);
    return response.answerResponse;
  };

  async stats() {
    return await this.callApi('https://paaske2020.kode24.no/api/user/rank');
  }
}

module.exports = Api;