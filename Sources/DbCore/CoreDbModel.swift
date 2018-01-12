//
//  DbCoreModel.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 12/01/2018.
//

import Foundation
import Vapor
import Fluent


public protocol DbCoreModel: Model, Content, Migration { }
