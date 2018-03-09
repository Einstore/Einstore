//
//  ApiCore.swift
//  Mailgun
//
//  Created by Ondrej Rafaj on 09/3/2018.
//


import Foundation


open class MailgunEmail : Codable {
    
    open var from: String?
    open var to: String?
    open var subject: String?
    open var html: String?
    open var text: String?
    
    public init() { }
    
    public init(to: String, from: String, subject: String, html: String){
        self.to = to
        self.from = from
        self.subject = subject
        self.html = html
        // TODO: Fix HTML
//        self.text = html.htmlToString
    }
    
}

