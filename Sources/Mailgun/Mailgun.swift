//
//  ApiCore.swift
//  Mailgun
//
//  Created by Ondrej Rafaj on 09/3/2018.
//


import Foundation
import Vapor


open class Mailgun {
    
    static let baseURL: String = "api.mailgun.net/v3/"
    
    private let apiKey : String
    private let domain : String
    
    enum MailingError: Error {
        case badAPIUrl
    }
    
    enum Router {
        case sendEmail(String)
        
        var path: String {
            switch self{
            case .sendEmail(let domain):
                return "\(domain)/messages"
            }
        }
        
        func urlStringWithApiKey(_ apiKey : String) throws -> URL {
            let urlWithKey = "https://api:\(apiKey)@\(Mailgun.baseURL)"
            
            guard let url = URL(string: urlWithKey)?.appendingPathComponent(path) else {
                throw MailingError.badAPIUrl
            }
            return url
        }
        
    }
    
    public init(apiKey: String, clientDomain: String) {
        self.apiKey = apiKey
        self.domain = clientDomain
        
    }
    
    open func send(email to: String, from: String, subject: String, bodyHTML: String) throws -> Future<Void> {
        let emailObject = MailgunEmail(to: to, from: from, subject: subject, html: bodyHTML)
        return try send(email: emailObject)
    }
    
    open func send(email: MailgunEmail) throws -> Future<Void> {
        let params = try JSONEncoder().encode(email)
        
        let url = try Router.sendEmail(self.domain).urlStringWithApiKey(self.apiKey)
        
        //        //The mailgun API expect multipart params.
        //        //Setups the multipart request
        //        Alamofire.upload(multipartFormData: { multipartFormData in
        //
        //            // add parameters as multipart form data to the body
        //            for (key, value) in params {
        //
        //                multipartFormData.append((value as! String).data(using: .utf8, allowLossyConversion: false)!, withName: key)
        //            }
        //
        //        }, to: Router.sendEmail(self.domain).urlStringWithApiKey(self.apiKey), encodingCompletion: { encodingResult in
        //            switch encodingResult {
        //            //Check if it works
        //            case .success(let upload, _, _):
        //                upload.responseJSON { response in
        //
        //                    //Check the response
        //                    switch response.result{
        //
        //                    case .failure(let error):
        //
        //                        print("error calling \(Router.sendEmail)")
        //
        //                        let errorMessage = error.localizedDescription
        //
        //                        if let data = response.data
        //                        {
        //                            let errorData = String(data: data, encoding: String.Encoding.utf8)
        //                            print(errorData as Any)
        //                        }
        //
        //                        let result = MailgunResult(success: false, message: errorMessage, id: nil)
        //
        //                        completionHandler(result)
        //                        return
        //
        //                    case .success:
        //
        //                        if let value: AnyObject = response.result.value as AnyObject? {
        //
        //                            let result:MailgunResult = ObjectParser.objectFromJson(value)!
        //
        //                            result.success = true
        //
        //                            completionHandler(result)
        //
        //                            return
        //
        //                        }
        //
        //                    }
        //                }
        //            //Check if we fail
        //            case .failure(let error):
        //
        //                print("error calling \(Router.sendEmail)")
        //                print(error)
        //
        //                let errorMessage = "There was an error"
        //
        //                let result = MailgunResult(success: false, message: errorMessage, id: nil)
        //
        //                completionHandler(result)
        //                return
        //
        //            }
        //        }
        //        )
        return Future(Void())
    }
}



