//
//  RequestIdService.swift
//  BoostCore
//
//  Created by Ondrej Rafaj on 07/03/2018.
//

import Foundation
import Vapor


final class RequestIdService: Service, ServiceType {
    
    static func makeService(for worker: Container) throws -> RequestIdService {
        return RequestIdService()
    }
    
    let uuid = UUID()
    
}

extension Request {
    
    public var sessionId: UUID {
        return try! self.privateContainer.make(RequestIdService.self, for: Request.self).uuid
    }
    
}
