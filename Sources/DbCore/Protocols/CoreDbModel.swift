//
//  DbCoreModel.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 12/01/2018.
//

import Foundation
import Vapor
import Fluent
import FluentPostgreSQL

public protocol DbCoreModel: PostgreSQLUUIDModel, Content { }
