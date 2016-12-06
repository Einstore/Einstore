//
//  Mailer.swift
//  Boost
//
//  Created by Ondrej Rafaj on 30/11/2016.
//
//

import Foundation
import Vapor
import SMTP
import Transport


final class Mailer {
    
    func send(to: String, fromName: String, subject: String, body: String) throws {
        let username: String = drop.config["email", "username"]?.string ?? "none"
        let password: String = drop.config["email", "password"]?.string ?? "none"
        let credentials = SMTPCredentials(user: username, pass: password)
        
        let from: String = drop.config["email", "from"]?.string ?? "none"
        let fromEmail = EmailAddress(name: fromName, address: from)
        let toEmail = EmailAddress(address: to)
        let email = Email(from: fromEmail, to: toEmail, subject: subject, body: body)
        
        let host: String = drop.config["email", "host"]?.string ?? "none"
        let port: Int = drop.config["email", "port"]?.int ?? 465
        let client = try SMTPClient<TCPClientStream>(host: host, port: port, securityLayer: SecurityLayer.none)
        try client.send(email, using: credentials)
    }
    
}
