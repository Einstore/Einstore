//
//  Apk.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor
import ApiCore


class Apk: BaseDecoder, Extractor {
    
    func process() throws -> Promise<App> {
        let promise = Promise<App>()
        
        return promise
    }
    
}
