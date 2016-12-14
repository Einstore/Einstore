//
//  Request+Validation.swift
//  Boost
//
//  Created by Ondrej Rafaj on 29/11/2016.
//  Copyright © 2016 manGoweb UK Ltd. All rights reserved.
//

import Vapor
import HTTP


extension Request {
    
    
    // MARK: Validation
    
    func isCool(forValues values: [Field]) -> [ValidationError] {
        var errors: [ValidationError] = []
        for field: Field in values {
            let v = self.data[field.name]
            
            var ok: Bool = true
            
            if v == nil {
                ok = false
            }
            else {
                if field.validationType == .empty {
                    if let value = v!.string {
                        if !value.passes(Count.min(1)) {
                            ok = false
                        }
                    }
                }
                else if field.validationType == .email {
                    if let value = v!.string {
                        if !value.passes(Email.self) {
                            ok = false
                        }
                    }
                }
            }
            
            if !ok {
                errors.append(ValidationError(field: field))
            }
        }
        return errors
    }
    
}
