//
//  MyErrors.swift
//  MyErrors
//
//  Created by Ondrej Rafaj on 09/12/2017.
//

import Foundation
import Vapor


public protocol WebError { }


public enum HTTPError: Error, WebError {
    case notAuthorized
}


public class MyErrors {
    
    
    
}
