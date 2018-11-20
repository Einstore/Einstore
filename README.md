![Boost: Enterprise AppStore in Swift](https://github.com/LiveUI/Boost/raw/master/Other/Images/header.jpg)

# Boost - Enterprise AppStore

[![Slack](https://img.shields.io/badge/join-slack-745EAF.svg?style=flat)](http://bit.ly/2B0dEyt)
[![Jenkins](https://ci.liveui.io/job/LiveUI/job/Boost/job/master/badge/icon)](https://ci.liveui.io/job/LiveUI/job/Boost/)
[![Apiary.io API documentation for Boost](https://img.shields.io/badge/docs-API-02BFF4.svg?style=flat)](https://boost.docs.apiary.io)
[![Platforms](https://img.shields.io/badge/platforms-macOS%2010.13%20|%20Ubuntu%2016.04%20LTS-ff0000.svg?style=flat)](https://github.com/LiveUI/Boost)
[![Swift 4](https://img.shields.io/badge/swift-4.1-orange.svg?style=flat)](http://swift.org)
[![Vapor 3](https://img.shields.io/badge/vapor-3.0-blue.svg?style=flat)](https://vapor.codes)
[![iOS app](https://img.shields.io/badge/app-iOS-blue.svg?style=flat)](https://github.com/LiveUI/Boost-iOS/)
[![Android app](https://img.shields.io/badge/app-Android-green.svg?style=flat)](https://github.com/LiveUI/Boost-Android/)

##

> <b style="color:red;">Warning! - *Project is not yet completely finished. We are going to release an alpha version in Q4 of 2018, contact us on Slack for ETA or follow the status below*</b>

Boost is an enterprise mobile app distribution platform. Boost has been made originally to help us distribute mobile apps to our clients on our own platform but eventually we have decided to share our baby with the world. Let’s see what it will grow into!

## Test run

You can easily try Boost if you have Docker installed. Just clone this repo and run `docker-compose up`. You should initialize database by visiting `/api/install` when you first run the project.

```shell
git clone git@github.com:LiveUI/Boost.git
cd Boost

# Will run Boost on http://localhost:80
docker-compose up
```

### Reverse proxy

To serve Boost on your custom domain (Boost needs HTTPS enabled in order to serve iOS applications). You can change port of running app (default is `8000`) by setting env variable `BOOST_PORT` and set the final URL so the App generates correct download links when you set `BOOST_BASE_URL`, default value is `http://localhost:8080.

```shell
# Expecting running reverse proxy from https://testing-boost.com => http://localhost:1234
BOOST_PORT=1234 BOOST_BASE_URL=https://testing-boost.com docker-compose up
```

## Main dependencies

* [BoostCore](https://github.com/LiveUI/BoostCore/) - AppStore core module
* [ApiCore](https://github.com/LiveUI/ApiCore/) - Base user & team management including forgotten passwords, etc ...
* [MailCore](https://github.com/LiveUI/MailCore/) - Mailing wrapper for multiple mailing services like MailGun, SendGrig or SMTP (coming)
* [VaporTestTools](https://github.com/LiveUI/VaporTestTools) - Test tools and helpers for Vapor 3

## Documentation (work in progress)

The main documentation for boost can be found in our [GitHub.com Wiki](https://github.com/LiveUI/Boost/wiki). For API documentation go to our [Boost API documentation](https://boost.docs.apiary.io)

In the repo we also maintain a [Postman](https://www.getpostman.com) collection of all available API requests [here](https://github.com/LiveUI/Boost/tree/master/Other/Postman). Use these to test any of the available endpoints.

#### Links:
* [GitHub.com Wiki](https://github.com/LiveUI/Boost/wiki)
* [API documentation](https://boost.docs.apiary.io)
* [Postman collections](https://github.com/LiveUI/Boost/tree/master/Other/Postman)

## Slack

If the documentation is not good enough for you, feel free to join our slack channel and get help using and installing this product from us and other experienced users right away. [Slack](http://bit.ly/2B0dEyt), channel <b>#help-boost</b>

## Test on Heroku (work in progress)

If you after a quick example of what boost can do, get yourself a Heroku account (if you don't have one already) and see for yourself.

To install on Heroku please press the button and follow the instructions:

[![Deploy Boost enterprise appstore to Heroku](https://camo.githubusercontent.com/c0824806f5221ebb7d25e559568582dd39dd1170/68747470733a2f2f7777772e6865726f6b7563646e2e636f6d2f6465706c6f792f627574746f6e2e706e67)](https://heroku.com/deploy?template=https://github.com/LiveUI/Boost)

## Features

#### MVP (current iteration)
- [x] Build basic framework
- [x] Authenticate with username and password
- [x] Upload, process and install iOS app
- [x] Upload, process and install Android app
- [x] Search apps by name, platform and bundle Id
- [x] Integrated web client (web interface)
- [x] Basic emails (forgotten password, registration, invitation)
- [ ] Authenticate with Github


#### Phase 2 (January 2019)
- [x] Support for S3 (and others through protocol) to store files
- [ ] Authenticate in enterprise environment (`ActiveDirectory`, Gitlab, etc ...)
- [ ] Create client accounts
- [ ] Download & install history
- [x] Native iOS client
- [ ] Native Android client
- [ ] Email notifications (new builds, clents, etc)


#### Phase 3 (June 2019)
- [ ] Native tvOS client
- [ ] Comment on builds
- [ ] Create virtual apps for web-apps (urls)
- [ ] Authenticate in enterprise environment (extend for custom plugins and integrations for common systems)


#### Phase 4
- [ ] Upload, process and download standalone files
- [ ] Upload, process and install macOS app
- [ ] Upload, process and install Windows app
- [ ] Upload, process and display web app (.zip)

## Code contributions

We love PR’s, we can’t get enough of them ... so if you have an interesting improvement, bug-fix or a new feature please don’t hesitate to get in touch. If you are not sure about something before you start the development you can always contact our dev and product team through our Slack.

## Support

You can signup for our Slack! To do so, please visit http://bit.ly/2B0dEyt and we’ll send you an invitation email.

## OnDemand hosted service (sounds better than software as a service)

We are also working on a hosted service including a free tier for indie developers. This service will become available just few weeks after the first official release here on github. For more information on our hosted services, please visit our website on http://www.boostappstore.com

## Enterprise

Our enterprise package contains a tailored solution designed to match your needs exactly. We have a team of amazing developers on standby to help you using remote desktops or even to fly them over, should you require help with the setup onsite.

We are a dev house so happy to quote on any customisations you may need on request. Please contact us on enterprise@mangoweb.cz for further details or visit our website on http://www.boostappstore.com

## License

Boost is distributed under an Apache 2 license and can be shared or used freely within the bounds of the license itself.
All third party components used (like Vapor framework and all it’s components) in this software are mainly MIT licensed.
List of all used software is listed in the repository. All Vapor components are available in Vapor dependencies folder.

See the LICENSE file for more info.



