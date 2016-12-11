//
//  Db.swift
//  Boost
//
//  Created by Ondrej Rafaj on 27/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import VaporMongo
import Vapor


struct Db {
    
    
    static let shared: Db = Db()
    
    
    // MARK: Connections
    
    func setup() {
        drop.preparations = [
            Auth.self,
            User.self,
            Company.self,
            Team.self,
            App.self,
            Build.self,
            UploadToken.self
        ]
        
        do {
            try drop.addProvider(VaporMongo.Provider.self)
        }
        catch {
            // TODO: Handle error
        }
    }
    
}
