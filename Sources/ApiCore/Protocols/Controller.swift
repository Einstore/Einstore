//
//  Controller.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public protocol Controller {
    static func boot(router: Router) throws
}
