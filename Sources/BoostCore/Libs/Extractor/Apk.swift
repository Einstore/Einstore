//
//  Apk.swift
//  App
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


class Apk: BaseDecoder, Extractor {
    
    func process() throws -> Future<App?> {
        let promise = Promise<App?>()
        
        return promise.future
    }
    
}
