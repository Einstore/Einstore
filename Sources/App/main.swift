//
//  main.swift
//  Boost
//
//  Created by Ondrej Rafaj on 24/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import VaporMongo


let drop = Droplet()

try drop.addProvider(VaporMongo.Provider.self)


//drop.get { req in
//    return try drop.view.make("welcome", [
//        "message": drop.localization[req.lang, "welcome", "title"]
//        ])
//}

drop.get("users") { req in
    return JSON(["fuck": [["who": "you"], ["who": "him"]]])
}

//drop.get("apps") { req in
//    if let db = drop.database?.driver as? MongoDriver {
//        let version = try db.raw("SELECT version()")
//        return try JSON(node: version)
//    }
//    else {
//        return "No db connection"
//    }
//}



drop.resource("posts", PostController())

drop.run()
