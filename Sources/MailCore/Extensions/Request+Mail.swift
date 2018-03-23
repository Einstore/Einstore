//
//  Request+Mail.swift
//  MailCore
//
//  Created by Ondrej Rafaj on 19/03/2018.
//

import Foundation
import Vapor


public struct MailProperty {
    
    let request: Request
    
    public func send(_ message: Mailer.Message) throws -> EventLoopFuture<Mailer.Result> {
        let mailer = try request.make(MailerService.self)
        return try mailer.send(message, on: request)
    }
    
    public func send(from: String, to: String, subject: String, text: String) throws -> EventLoopFuture<Mailer.Result> {
        return try send(Mailer.Message(from: from, to: to, subject: subject, text: text))
    }
    
}


extension Request {
    
    public var mail: MailProperty {
        return MailProperty(request: self)
    }
    
}
