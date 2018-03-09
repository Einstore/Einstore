//
//  ApiCore.swift
//  Mailgun
//
//  Created by Ondrej Rafaj on 09/3/2018.
//

import Foundation
import Vapor


open class MailgunResult: Codable {
    
    open var id: String?
    open var success: Bool = false
    open var message: String?
    
    open var hasError : Bool{
        return !success
    }
    
    // MARK: Initialization
    
    init() { }
    
    public init(id:String? = nil, success: Bool, message: String){
        self.id = id
        self.success = success
        self.message = message
    }

}

