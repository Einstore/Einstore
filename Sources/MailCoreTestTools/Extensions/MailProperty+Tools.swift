//
//  MailProperty+Tools.swift
//  MailCoreTestTools
//
//  Created by Ondrej Rafaj on 20/03/2018.
//

import Foundation
@testable import MailCore


extension MailProperty {
    
    public var mock: MailerMock {
        let mailer = try! request.make(MailerService.self)
        return mailer as! MailerMock
    }
    
}
