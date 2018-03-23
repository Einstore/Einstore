//
//  RegistrationTemplate.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 23/03/2018.
//

import Foundation


public class RegistrationTemplate: Template {
    
    public static  var name: String = "registration"
    
    public static  var string: String = """
Hi #(user.firstname) #(user.lastname)
Please confirm your email #(user.email) by clicking on this link http://www.example.com/#what-the-fuck
HTML - huhuhu woe :)
Boost team
"""
    
    public static  var html: String? = """
    <h1>Hi #(user.firstname) #(user.lastname)</h1>
    <p>Please confirm your email #(user.email) by clicking on this <a href="http://www.example.com/#what-the-fuck">link</a></p>
    <p>HTML - huhuhu woe :)</p>
    <p>Boost team</p>
    """
    
}
