//
//  UsersController.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 28/12/2017.
//

import Foundation
import Vapor
import FluentPostgreSQL
import MailCore


public class UsersController: Controller {
    
    enum Problem: Error {
        case verificationCodeMissing
    }
    
    public static func boot(router: Router) throws {
        router.get("users") { (req) -> Future<[User.Display]> in
            return User.query(on: req).decode(User.Display.self).all()
        }
        
        router.post("users") { (req) -> Future<Response> in
            return try req.content.decode(User.Registration.self).flatMap(to: Response.self) { user in
                let newUser = try user.newUser(on: req)
                guard let verification = newUser.verification else {
                    throw Problem.verificationCodeMissing
                }
                let templateModel = User.Registration.Template(
                    verification: verification,
                    serverLink: "http://www.liveui.io/fake_url",
                    user: user
                )
                return try RegistrationTemplate.parsed(model: templateModel, on: req).flatMap(to: Response.self) { double in
                    let from = "ondrej.rafaj@gmail.com"
                    let subject = "polip si"
                    let mail = Mailer.Message(from: from, to: user.email, subject: subject, text: double.string, html: double.html)
                    return try req.mail.send(mail).flatMap(to: Response.self) { mailResult in
                        print(mailResult)
                        newUser.verification = try newUser.verification?.passwordHash(req)
                        return newUser.save(on: req).flatMap(to: Response.self) { user in
                            return try user.asDisplay().asResponse(.created, to: req)
                        }
                    }
                }
            }
        }
        
        router.get("users", "search") { (req) -> Future<[User.AllSearch]> in
            // TODO: Add proper limiter/pagination!!
            // TODO: Add the actual search!!!!!!!
            // TODO: Mask info of people from other teams!!!!
            return User.query(on: req).all().map(to: [User.AllSearch].self) { (users) -> [User.AllSearch] in
                return users.compactMap { (user) -> User.AllSearch in
                    return User.AllSearch(user: user)
                }
            }
        }
    }
    
}
