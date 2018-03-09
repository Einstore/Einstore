
//
//  Filesize.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 22/01/2018.
//

import Foundation


public enum Filesize {
    case kilobyte(Double)
    case megabyte(Double)
    case gigabyte(Double)
    
    public var value: Double {
        switch self {
        case .kilobyte(let no):
            return (no * 1000)
        case .megabyte(let no):
            return ((no * 1000) * 1000)
        case .gigabyte(let no):
            return (((no * 1000) * 1000) * 1000)
        }
    }
    
}
