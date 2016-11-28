//
//  main.swift
//  Boost
//
//  Created by Ondrej Rafaj on 24/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor


let drop = Droplet()

Db.shared.setup()

drop.register(controller: AppController())
drop.register(controller: AppsController())
drop.register(controller: VersionsController())
drop.register(controller: UsersController())
drop.register(controller: HistoryController())
drop.register(controller: SettingsController())
drop.register(controller: InstallController())


drop.run()
