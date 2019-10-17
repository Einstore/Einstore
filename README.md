# Einstore

[![Slack](https://img.shields.io/badge/join-slack-745EAF.svg?style=flat)](https://bit.ly/2UkyFO8)
[![Docker](https://img.shields.io/badge/docker-enabled-blue.svg?style=flat)](https://hub.docker.com/u/einstore)
[![macOS](https://img.shields.io/badge/macOS-10.13-ff0000.svg?style=flat)](https://github.com/Einstore/Einstore)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-18.04%20LTS-D95E33.svg?style=flat)](https://www.ubuntu.com/download/server)
[![Apiary.io API documentation for Einstore](https://img.shields.io/badge/docs-API-02BFF4.svg?style=flat)](https://boost.docs.apiary.io)
[![Swift 4](https://img.shields.io/badge/swift-4.1-orange.svg?style=flat)](http://swift.org)
[![Vapor 3](https://img.shields.io/badge/vapor-3.0-blue.svg?style=flat)](https://vapor.codes)

Enterprise distribution platform for mobile apps ... the first open source appstore

### Screenshots
<table>
  <tr>
    <td><img src="/Screenshots/Admin/screen1.png?raw=true" /></td>
    <td><img src="/Screenshots/Admin/screen2.png?raw=true" /></td>
    <td><img src="/Screenshots/Admin/screen3.png?raw=true" /></td>
  </tr>
  <tr>
    <td><img src="/Screenshots/Admin/screen4.png?raw=true" /></td>
    <td><img src="/Screenshots/Admin/screen5.png?raw=true" /></td>
    <td>&nbsp;</td>
  </tr>
</table>
  
### Requirements:

- [docker](https://www.docker.com/products/docker-desktop)
- [docker-compose](https://docs.docker.com/compose/install/) (17.12.0+)
- Make (optional, wrapper for handy scripts)

### Basic usage

- To install run `make install-db`
- To start and stop the project `make up` and `make stop`
- Run `make help` or just `make` for other commands
- Optionally look into the [Makefile](https://github.com/Einstore/Einstore/blob/master/Makefile) for all remaining scripts

#### Login

> Default username and password is `core@liveui.io`/`sup3rS3cr3t`

#### Demo mode

- To install demo data run `make install-demo`
- To start and stop the project `make up` and `make stop`


### Documentation

The main documentation for Einstore can be found in our [Wiki here on Github](https://github.com/Einstore/Einstore/wiki). For API documentation go to our [Einstore API documentation](https://boost.docs.apiary.io)

#### Shortcuts
* [Emails](https://github.com/Einstore/Einstore/wiki/Configure-email)
* [Continuous integration (CI)](https://github.com/Einstore/Einstore/wiki/Continuous-integrations)
* [Environmental variables](https://github.com/Einstore/Einstore/wiki/Environmental-variables)
* [Tags](https://github.com/Einstore/Einstore/wiki/Tags)

### Slack support and community

If you don't like going through documentation, feel free to join our slack channel and get help using and installing this product from us directly and other experienced users right away. [Slack](https://bit.ly/2UkyFO8)

### Main dependencies

- API - [EinstoreCore](https://github.com/Einstore/EinstoreCore)
- Web app interface [EinstoreAdmin](https://github.com/Einstore/EinstoreAdmin)

### License

Einstore is distributed under an Apache 2 license and can be shared or used freely within the bounds of the license itself.
Third party components used (like Vapor framework and all its components) in this software are mainly MIT licensed although some are Apache 2 as well.
