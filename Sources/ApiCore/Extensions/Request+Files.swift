//
//  Request+Files.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 22/01/2018.
//

import Foundation
import Vapor


extension Request {
    
    public var fileData: Future<Data> {
        return self.http.body.makeData(max: Int(ApiCore.configuration.maxUploadSize.value))
    }
    
}
