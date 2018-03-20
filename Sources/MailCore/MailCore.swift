//
//  Boost.swift
//  MailCore
//
//  Created by Ondrej Rafaj on 19/3/2018.
//

import Foundation
import Vapor
import Mailgun


public protocol MailerService: Service {
    func send(message: Mailer.Message, on req: Request) throws -> Future<Mailer.Result>
}


public class Mailer: MailerService {
    
    public struct Message {
        public let from: String
        public let to: String
        public let subject: String
        public let text: String
        
        public init(from: String, to: String, subject: String, text: String) {
            self.from = from
            self.to = to
            self.subject = subject
            self.text = text
        }
    }
    
    public enum Result {
        case serviceNotConfigured
        case success
        case failure(error: Error)
    }
    
    public enum Config {
        case none
        case mailgun(key: String, domain: String)
    }
    
    let config: Config
    
    
    // MARK: Initialization
    
    @discardableResult public init(config: Config, registerOn services: inout Services) {
        self.config = config
        
        switch config {
        case .mailgun(let key, let domain):
            let mailgunEngine = MailgunEngine(apiKey: key, customURL: domain)
            services.register(mailgunEngine, as: MailgunEngine.self)
        default:
            break
        }
        
        services.register(self, as: MailerService.self)
    }
    
    // MARK: Public interface
    
    public func send(message: Message, on req: Request) throws -> Future<Mailer.Result> {
        switch config {
        case .mailgun(_, _):
            let mailgunClient = try req.make(MailgunEngine.self)
            return try mailgunClient.sendMail(data: message.asMailgunContent(), on: req).map(to: Mailer.Result.self) { _ in
                return Mailer.Result.success
            }
        default:
            return req.eventLoop.newSucceededFuture(result: Mailer.Result.serviceNotConfigured)
        }
    }
    
}
