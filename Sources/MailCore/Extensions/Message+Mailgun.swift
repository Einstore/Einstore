//
//  Message+Mailgun.swift
//  MailCore
//
//  Created by Ondrej Rafaj on 19/03/2018.
//

import Foundation
import Vapor
import Mailgun


extension Mailer.Message {
    
    func asMailgunContent() -> MailgunEngine.FormData {
        return MailgunEngine.FormData(from: from, to: to, subject: subject, text: text)
    }
    
}
