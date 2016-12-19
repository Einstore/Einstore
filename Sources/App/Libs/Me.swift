//
//  Me.swift
//  Boost
//
//  Created by Ondrej Rafaj on 28/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Foundation
import Vapor


final class Me {
    
    static let shared: Me = Me()
    
    var auth: Auth?
    var user: User?
    
    func id() -> Node? {
        return self.user?.id
    }
    
    func type(min: UserType) -> Bool {
        let type = self.user?.type ?? .tester
        switch type {
        case .superAdmin:
            return true
        case .admin:
            if min == .superAdmin {
                return false
            }
            return true
        case .developer:
            if min == .superAdmin || min == .admin {
                return false
            }
            return true
        case .tester:
            if min == .tester || min == .client {
                return true
            }
            return false
        case .client:
            if min == .tester || min == .client {
                return true
            }
            return false
        }
    }
    
}
