//
//  Insertable.swift
//  DbCore
//
//  Created by Ondrej Rafaj on 18/01/2018.
//

import Foundation


public protocol Insertable {
    associatedtype T where T: DbCoreModel
    var insertable: T { get }
}
