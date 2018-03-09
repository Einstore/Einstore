//
//  Date+Tools.swift
//  ApiCore
//
//  Created by Ondrej Rafaj on 14/01/2018.
//

import Foundation


extension Date {
    
    public func addMonth(n: Int) -> Date {
        let cal = NSCalendar.current
        return cal.date(byAdding: .month, value: n, to: self)!
    }
    
    public func addDay(n: Int) -> Date {
        let cal = NSCalendar.current
        return cal.date(byAdding: .day, value: n, to: self)!
    }
    
    public func addSec(n: Int) -> Date {
        let cal = NSCalendar.current
        return cal.date(byAdding: .second, value: n, to: self)!
    }
    
    public var day: Int {
        let calendar = NSCalendar(calendarIdentifier: NSCalendar.Identifier.gregorian)
        return calendar?.component(NSCalendar.Unit.day, from: self) ?? 0
    }
    
    public var month: Int {
        let calendar = NSCalendar(calendarIdentifier: NSCalendar.Identifier.gregorian)
        return calendar?.component(NSCalendar.Unit.month, from: self) ?? 0
    }
    
    public var year: Int {
        let calendar = NSCalendar(calendarIdentifier: NSCalendar.Identifier.gregorian)
        return calendar?.component(NSCalendar.Unit.year, from: self) ?? 0
    }
    
    public var dateFolderPath: String {
        return "\(year)/\(month)/\(day)"
    }
    
}
