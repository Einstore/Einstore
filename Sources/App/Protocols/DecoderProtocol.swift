//
//  Decoder.swift
//  Boost
//
//  Created by Ondrej Rafaj on 02/12/2016.
//
//

import Foundation
import Vapor


protocol DecoderProtocol {
    
    init(_ file: Multipart)
    
    var iconData: Data? { get }
    var appName: String { get }
    var bundleId: String? { get }
    var platform: Platform { get }
    
    func prepare() throws
    func parse() throws
    
}
